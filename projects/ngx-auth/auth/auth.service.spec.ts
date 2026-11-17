import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component, Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { HttpTestingUtilities } from 'testing/http';
import { AddedPasskeyDevice, PasskeyTestingUtilities } from 'testing/passkey';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CookieAuthData, CurrentUserProfile, JwtAuthData, OtpRegistration } from 'zibri-contract';

import { AuthConfigChanges } from './auth-config-changes.model';
import { AuthStrategyName } from './auth-strategy-name.type';
import { authInterceptor } from './auth.interceptor';
import { provideAuth } from './auth.provider';
import { AuthService } from './auth.service';
import { LinkedIdentity } from './linked-identity.model';
import { LoginResult } from './login-result.model';
import { PasskeyUtilities } from './passkey.utilities';
import { PendingProviderLogin } from './pending-provider-login.model';
import { PkceUtilities } from './pkce.utilities';
import { SecondFactor } from './second-factor.model';

const API: string = 'https://api.example.com/auth';
const HOUR: number = 3_600_000;

/**
 * The roles of the app of the tests.
 */
type Role = 'admin' | 'user';

/**
 * The permissions of the app of the tests in a tenant.
 */
type Permission = 'invoices.export' | 'invoices.read';

/**
 * The permissions of the app of the tests by the roles of a user's own.
 */
type PlatformPermission = 'tenants.create';

@Service()
class AppAuthService extends AuthService<Role, Permission, PlatformPermission> {}

// what GET /me answers for user-1: a reader in one tenant, an exporter in the other.
const PROFILE: CurrentUserProfile<Permission, PlatformPermission> = {
    id: 'user-1',
    email: 'ada@example.com',
    memberships: [
        { tenantId: 'tenant-a', permissions: ['invoices.read'] },
        { tenantId: 'tenant-b', permissions: ['invoices.read', 'invoices.export'] }
    ],
    platformPermissions: ['tenants.create']
};

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

function setup(strategy: AuthStrategyName, changes: Partial<AuthConfigChanges> = {}): [AppAuthService, HttpTestingController] {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([{ path: '**', component: PageComponent }]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy, ...changes })
        ]
    });
    return [TestBed.inject(AppAuthService), TestBed.inject(HttpTestingController)];
}

function inMs(ms: number): string {
    return new Date(Date.now() + ms).toISOString();
}

function createJwtData(accessToken: string = 'access-1', refreshToken: string = 'refresh-1'): JwtAuthData<Role> {
    return {
        userId: 'user-1',
        roles: ['user'],
        accessToken: { value: accessToken, expirationDate: inMs(HOUR) },
        refreshToken: { value: refreshToken, expirationDate: inMs(30 * 24 * HOUR) }
    };
}

function createCookieData(csrfToken: string): CookieAuthData<Role> {
    return { userId: 'user-1', roles: ['admin'], csrfToken, sessionExpirationDate: inMs(HOUR), refreshSessionExpirationDate: inMs(24 * HOUR) };
}

// what zibri answers a refused request with.
function refuse(request: TestRequest, status: number, body: object): void {
    request.flush({ status, message: 'Refused', paragraphs: ['Refused'], ...body }, { status, statusText: 'Refused' });
}

async function expectRequest(backend: HttpTestingController, method: string, url: string): Promise<TestRequest> {
    return await vi.waitFor(() => backend.expectOne({ method, url }));
}

// a login and a refresh load the user right after.
async function answerCurrentUser(backend: HttpTestingController): Promise<TestRequest> {
    const request: TestRequest = await expectRequest(backend, 'GET', `${API}/me`);
    request.flush(PROFILE);
    return request;
}

async function loginWithJwt(authService: AppAuthService, backend: HttpTestingController, data: JwtAuthData<Role> = createJwtData()): Promise<void> {
    const loggedIn: Promise<LoginResult> = authService.login({ email: 'ada@example.com', password: 'secret' });
    (await expectRequest(backend, 'POST', `${API}/login?authenticator=password&strategy=jwt`)).flush(data);
    await answerCurrentUser(backend);
    expect(await loggedIn).toEqual({ type: 'loggedIn' });
}

describe('AuthService', () => {
    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        vi.useRealTimers();
        TestBed.inject(HttpTestingController).verify();
    });

    test('logs in with the credentials of an authenticator and keeps the login across a reload', async () => {
        const [authService, backend] = setup('jwt');
        expect(authService.loggedIn()).toBe(false);

        const loggedIn: Promise<LoginResult> = authService.login({ email: 'ada@example.com', password: 'secret' });
        const request: TestRequest = await expectRequest(backend, 'POST', `${API}/login?authenticator=password&strategy=jwt`);
        expect(request.request.body).toEqual({ email: 'ada@example.com', password: 'secret' });
        request.flush(createJwtData());
        // the login is done once the user is loaded, so the routes the app opens next can check permissions
        expect((await answerCurrentUser(backend)).request.headers.get('Authorization')).toBe('Bearer access-1');
        expect(await loggedIn).toEqual({ type: 'loggedIn' });
        expect(authService.roles()).toEqual(['user']);
        expect(authService.currentUser()).toEqual(PROFILE);

        TestBed.resetTestingModule();
        const [afterReload, afterReloadBackend] = setup('jwt');
        expect(afterReload.authData()).toEqual(expect.objectContaining({ strategy: 'jwt', userId: 'user-1' }));
        expect(afterReload.currentUser()).toEqual(PROFILE);
        afterReloadBackend.expectNone(`${API}/me`);
    });

    test('logs in even when GET /me fails, and loads the user on demand', async () => {
        const [authService, backend] = setup('jwt');

        const loggedIn: Promise<LoginResult> = authService.login({ email: 'ada@example.com', password: 'secret' });
        (await expectRequest(backend, 'POST', `${API}/login?authenticator=password&strategy=jwt`)).flush(createJwtData());
        refuse(await expectRequest(backend, 'GET', `${API}/me`), 503, { name: 'ServiceUnavailableError' });
        expect(await loggedIn).toEqual({ type: 'loggedIn' });
        expect(authService.currentUser()).toBeUndefined();
        expect(authService.hasPlatformPermission('tenants.create')).toBe(false);

        const reloaded: Promise<unknown> = authService.reloadCurrentUser();
        await answerCurrentUser(backend);
        expect(await reloaded).toEqual(PROFILE);
        expect(authService.hasPlatformPermission('tenants.create')).toBe(true);
    });

    test('continues a login that waits for a second factor and then for a new password', async () => {
        const [authService, backend] = setup('jwt');

        const login: Promise<LoginResult> = authService.login({ email: 'ada@example.com', password: 'secret' });
        refuse(
            await expectRequest(backend, 'POST', `${API}/login?authenticator=password&strategy=jwt`),
            401,
            { name: 'SecondFactorRequiredError', ticket: 'ticket-1', methods: ['otp', 'email'] }
        );
        expect(await login).toEqual({ type: 'secondFactorRequired', ticket: 'ticket-1', methods: ['otp', 'email'] });

        const sent: Promise<void> = authService.requestSecondFactorAtLogin('ticket-1', 'email');
        const codeRequest: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/request?method=email`);
        expect(codeRequest.request.headers.get('x-login-ticket')).toBe('ticket-1');
        codeRequest.flush('', { status: 204, statusText: 'No Content' });
        await sent;

        const confirmed: Promise<LoginResult> = authService.confirmSecondFactorAtLogin('ticket-1', { method: 'otp', code: '123456' });
        const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/confirm?strategy=jwt`);
        expect(confirm.request.headers.get('x-login-ticket')).toBe('ticket-1');
        expect(confirm.request.headers.get('x-authorization-otp')).toBe('123456');
        refuse(confirm, 401, { name: 'PasswordChangeRequiredError', ticket: 'ticket-2' });
        expect(await confirmed).toEqual({ type: 'passwordChangeRequired', ticket: 'ticket-2' });

        const changed: Promise<LoginResult> = authService.changePasswordAtLogin('ticket-2', 'a new password');
        const change: TestRequest = await expectRequest(backend, 'POST', `${API}/login/change-password?strategy=jwt`);
        expect(change.request.body).toEqual({ newPassword: 'a new password' });
        expect(change.request.headers.get('x-login-ticket')).toBe('ticket-2');
        change.flush(createJwtData());
        await answerCurrentUser(backend);
        expect(await changed).toEqual({ type: 'loggedIn' });
        expect(authService.loggedIn()).toBe(true);
    });

    test('rejects a login the server refuses for anything but a missing step', async () => {
        const [authService, backend] = setup('jwt');

        const login: Promise<LoginResult> = authService.login({ email: 'ada@example.com', password: 'wrong' });
        refuse(await expectRequest(backend, 'POST', `${API}/login?authenticator=password&strategy=jwt`), 401, { name: 'UnauthorizedError' });

        await expect(login).rejects.toThrow();
        expect(authService.loggedIn()).toBe(false);
    });

    test('logs out at zibri, then on this browser, and sends the user to afterLogout', async () => {
        const [authService, backend] = setup('jwt', { routes: { afterLogout: '/goodbye' } });
        await loginWithJwt(authService, backend);

        const loggedOut: Promise<void> = authService.logout();
        expect(authService.loggedIn()).toBe(false);
        const request: TestRequest = await expectRequest(backend, 'POST', `${API}/logout?strategy=jwt`);
        expect(request.request.body).toEqual({ refreshToken: 'refresh-1' });
        request.flush({});
        await loggedOut;

        expect(TestBed.inject(Router).url).toBe('/goodbye');
        expect(localStorage.getItem('authData')).toBeNull();
    });

    test('shares one refresh between requests at the same time, and keeps the new tokens', async () => {
        const [authService, backend] = setup('jwt');
        await loginWithJwt(authService, backend);

        const first: Promise<void> = authService.refreshLogin();
        const second: Promise<void> = authService.refreshLogin();
        const refresh: TestRequest = await expectRequest(backend, 'POST', `${API}/refresh-login?strategy=jwt`);
        expect(refresh.request.body).toEqual({ refreshToken: 'refresh-1' });
        refresh.flush(createJwtData('access-2', 'refresh-2'));
        // the requests that waited go on before the user is loaded again
        await Promise.all([first, second]);

        expect(await authService.resolveAccessToken()).toBe('access-2');
        expect((await answerCurrentUser(backend)).request.headers.get('Authorization')).toBe('Bearer access-2');
    });

    test('answers permissions in a tenant and by the user\'s own roles from what GET /me answered', async () => {
        const [authService, backend] = setup('jwt');
        await loginWithJwt(authService, backend);
        expect(authService.activeTenantId()).toBeUndefined();
        expect(authService.hasPermission('invoices.read')).toBe(false);
        expect(authService.hasPlatformPermission('tenants.create')).toBe(true);

        authService.setActiveTenant('tenant-a');
        expect(authService.hasPermission('invoices.read')).toBe(true);
        expect(authService.hasPermission('invoices.export')).toBe(false);
        expect(authService.hasPermission('invoices.export', 'tenant-b')).toBe(true);

        // the tenant stays with the login, and the user is reloaded without asking for the tenant again
        TestBed.resetTestingModule();
        const [afterReload, afterReloadBackend] = setup('jwt');
        expect(afterReload.activeTenantId()).toBe('tenant-a');
        const reloaded: Promise<unknown> = afterReload.reloadCurrentUser();
        await answerCurrentUser(afterReloadBackend);
        await reloaded;
        expect(afterReload.activeTenantId()).toBe('tenant-a');
    });

    test('enrolls and removes two factor methods, also for a login that waits for its first one', async () => {
        const [authService, backend] = setup('jwt');
        await loginWithJwt(authService, backend);

        const otp: Promise<OtpRegistration | undefined> = authService.requestTwoFactorRegistration<OtpRegistration>('otp');
        const otpRequest: TestRequest = await expectRequest(backend, 'POST', `${API}/2fa/registration/request?method=otp`);
        expect(otpRequest.request.headers.get('Authorization')).toBe('Bearer access-1');
        otpRequest.flush({ qrCodeUrl: 'otpauth://totp/app:ada', secret: 'SECRET' });
        expect(await otp).toEqual({ qrCodeUrl: 'otpauth://totp/app:ada', secret: 'SECRET' });

        const email: Promise<unknown> = authService.requestTwoFactorRegistration('email');
        // a method that sends a code answers with no body
        HttpTestingUtilities.flushNoContent(await expectRequest(backend, 'POST', `${API}/2fa/registration/request?method=email`));
        expect(await email).toBeUndefined();

        const confirmed: Promise<void> = authService.confirmTwoFactorRegistration('otp', { token: '123456' });
        const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/2fa/registration/confirm?method=otp`);
        expect(confirm.request.body).toEqual({ token: '123456' });
        confirm.flush('', { status: 204, statusText: 'No Content' });
        await confirmed;

        const removed: Promise<void> = authService.removeTwoFactorRegistration('recovery-code');
        (await expectRequest(backend, 'DELETE', `${API}/2fa/registration/recovery-code`)).flush('', { status: 204, statusText: 'No Content' });
        await removed;

        const atLogin: Promise<unknown> = authService.requestTwoFactorRegistrationAtLogin('ticket-1', 'sms', { phoneNumber: '+4915112345678' });
        const loginRequest: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/registration/request?method=sms`);
        expect(loginRequest.request.headers.get('x-login-ticket')).toBe('ticket-1');
        // the ticket stands in for the login, which a request of a login doesn't have yet
        expect(loginRequest.request.headers.has('Authorization')).toBe(false);
        expect(loginRequest.request.body).toEqual({ phoneNumber: '+4915112345678' });
        loginRequest.flush('', { status: 204, statusText: 'No Content' });
        await atLogin;
        // zibri completes the login with the enrollment
        const completed: Promise<LoginResult> = authService.confirmTwoFactorRegistrationAtLogin('ticket-1', 'sms', { code: '654321' });
        const loginConfirm: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/registration/confirm?strategy=jwt&method=sms`);
        expect(loginConfirm.request.headers.get('x-login-ticket')).toBe('ticket-1');
        loginConfirm.flush(createJwtData('access-2', 'refresh-2'));
        await answerCurrentUser(backend);
        expect(await completed).toEqual({ type: 'loggedIn' });
        expect(await authService.resolveAccessToken()).toBe('access-2');

        // an auth service of the app's own in zibri only enrolls, and the login waits for the next code
        const enrolledOnly: Promise<LoginResult> = authService.confirmTwoFactorRegistrationAtLogin('ticket-2', 'otp', { token: '123456' });
        HttpTestingUtilities.flushNoContent(await expectRequest(backend, 'POST', `${API}/login/2fa/registration/confirm?strategy=jwt&method=otp`));
        expect(await enrolledOnly).toEqual({ type: 'secondFactorRequired', ticket: 'ticket-2', methods: ['otp'] });
    });

    test('logs in with a passkey, presents one as a second factor, and registers an account with one', async () => {
        const assertion: AuthenticationResponseJSON = {
            id: 'credential-1',
            rawId: 'credential-1',
            type: 'public-key',
            clientExtensionResults: {},
            response: { clientDataJSON: 'client-data', authenticatorData: 'authenticator-data', signature: 'signature' }
        };
        const attestation: RegistrationResponseJSON = {
            id: 'credential-2',
            rawId: 'credential-2',
            type: 'public-key',
            clientExtensionResults: {},
            response: {
                clientDataJSON: 'client-data',
                attestationObject: 'attestation-object',
                authenticatorData: 'authenticator-data',
                publicKeyAlgorithm: -7,
                transports: ['internal']
            }
        };
        const device: AddedPasskeyDevice = PasskeyTestingUtilities.addDevice({ assertion, attestation });
        try {
            const [authService, backend] = setup('jwt');

            const loggedIn: Promise<LoginResult> = authService.loginWithPasskey();
            (await expectRequest(backend, 'POST', `${API}/login-options?authenticator=passkey`)).flush({ challenge: 'challenge-1' });
            const login: TestRequest = await expectRequest(backend, 'POST', `${API}/login?authenticator=passkey&strategy=jwt`);
            expect(device.requests).toEqual([{ challenge: 'challenge-1' }]);
            expect(login.request.body).toEqual({ response: assertion });
            login.flush(createJwtData());
            await answerCurrentUser(backend);
            expect(await loggedIn).toEqual({ type: 'loggedIn' });

            const secondFactor: Promise<SecondFactor> = authService.resolvePasskeySecondFactor('passkey', 'ticket-1');
            const challenge: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/request?method=passkey`);
            expect(challenge.request.headers.get('x-login-ticket')).toBe('ticket-1');
            challenge.flush({ challenge: 'challenge-2' });
            // base64url encoded json, as zibri reads the header
            const presented: SecondFactor = await secondFactor;
            expect(presented.method).toBe('passkey');
            expect(JSON.parse(atob(presented.code.replaceAll('-', '+').replaceAll('_', '/')))).toEqual(assertion);

            const ticket: Promise<string> = authService.resolvePasskeyRegistrationTicket('ada@example.com');
            const registration: TestRequest = await expectRequest(backend, 'POST', `${API}/registration/request?authenticator=passkey`);
            expect(registration.request.body).toEqual({ name: 'ada@example.com' });
            registration.flush({ challenge: 'challenge-3' });
            const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/registration/confirm?authenticator=passkey`);
            expect(confirm.request.body).toEqual({ response: attestation });
            confirm.flush({ ticket: 'registration-1' });
            expect(await ticket).toBe('registration-1');
        }
        finally {
            device.remove();
        }
    });

    test('asks a provider login for the scopes of the provider\'s apis, separated by spaces like in OAuth', async () => {
        const [authService] = setup('jwt');

        const url: URL = new URL(await authService.resolveProviderLoginUrl('google', 'https://app.example.com/login', undefined, ['openid', 'calendar']));
        expect(url.searchParams.get('scopes')).toBe('openid calendar');
    });

    test('logs in at a provider with a code only this tab can use, and lists and unlinks identities', async () => {
        const [authService, backend] = setup('jwt');

        const url: URL = new URL(await authService.resolveProviderLoginUrl('google', 'https://app.example.com/login', '/account'));
        expect(`${url.origin}${url.pathname}`).toBe(`${API}/federated/login/request`);
        expect(url.searchParams.get('authenticator')).toBe('google');
        expect(url.searchParams.get('redirectTo')).toBe('https://app.example.com/login');
        const pending: PendingProviderLogin | undefined = authService.findPendingProviderLogin();
        expect(pending?.authenticator).toBe('google');
        expect(pending?.returnUrl).toBe('/account');
        expect(pending?.codeVerifier).toMatch(/^[\w-]{43}$/);
        // the challenge is what S256 makes of the verifier, which stays in the tab
        expect(url.searchParams.get('codeChallenge')).toBe(await PkceUtilities.resolveChallenge(pending?.codeVerifier ?? ''));
        expect(url.searchParams.has('codeVerifier')).toBe(false);
        expect(url.searchParams.has('scopes')).toBe(false);

        // the browser came back with the code
        const loggedIn: Promise<LoginResult> = authService.completeProviderLogin('code-1');
        const login: TestRequest = await expectRequest(backend, 'POST', `${API}/login?authenticator=google&strategy=jwt`);
        expect(login.request.body).toEqual({ code: 'code-1', codeVerifier: pending?.codeVerifier });
        login.flush(createJwtData());
        await answerCurrentUser(backend);
        expect(await loggedIn).toEqual({ type: 'loggedIn' });
        expect(authService.findPendingProviderLogin()).toBeUndefined();
        await expect(authService.completeProviderLogin('code-1')).rejects.toThrow();

        const linkUrl: Promise<string> = authService.resolveProviderLinkUrl('github', 'https://app.example.com/account');
        const link: TestRequest = await expectRequest(backend, 'POST', `${API}/link-identity/request?authenticator=github`);
        expect(link.request.body).toEqual({ redirectTo: 'https://app.example.com/account', forLogin: true, scopes: undefined });
        link.flush({ url: 'https://github.com/login/oauth/authorize?state=1' });
        expect(await linkUrl).toBe('https://github.com/login/oauth/authorize?state=1');

        const identities: Promise<LinkedIdentity[]> = authService.resolveIdentities();
        (await expectRequest(backend, 'GET', `${API}/identities`))
            .flush([{ authenticator: 'google', identity: { id: 'identity-1', forLogin: true } }]);
        expect(await identities).toEqual([{ authenticator: 'google', identity: { id: 'identity-1', forLogin: true } }]);
        const unlinked: Promise<void> = authService.unlinkIdentity('identity-1');
        HttpTestingUtilities.flushNoContent(await expectRequest(backend, 'DELETE', `${API}/identities/identity-1`));
        await unlinked;
    });

    test('rejects a passkey the user cancelled with an error that says so', async () => {
        const device: AddedPasskeyDevice = PasskeyTestingUtilities.addDevice({ cancels: true });
        try {
            const [authService, backend] = setup('jwt');

            const loggedIn: Promise<LoginResult> = authService.loginWithPasskey();
            (await expectRequest(backend, 'POST', `${API}/login-options?authenticator=passkey`)).flush({ challenge: 'challenge-1' });

            const error: unknown = await loggedIn.catch((error_: unknown) => error_);
            expect(PasskeyUtilities.isCancelled(error)).toBe(true);
            expect(authService.loggedIn()).toBe(false);
        }
        finally {
            device.remove();
        }
    });

    test('resets and changes passwords', async () => {
        const [authService, backend] = setup('jwt');

        const requested: Promise<void> = authService.requestPasswordReset('ada@example.com');
        (await expectRequest(backend, 'POST', `${API}/request-password-reset`)).flush('', { status: 204, statusText: 'No Content' });
        await requested;
        const verified: Promise<boolean> = authService.verifyPasswordResetToken('reset-1');
        const verify: TestRequest = await expectRequest(backend, 'POST', `${API}/verify-password-reset-token`);
        expect(verify.request.body).toEqual({ resetToken: 'reset-1' });
        verify.flush({ isValid: true });
        expect(await verified).toBe(true);
        const confirmed: Promise<void> = authService.confirmPasswordReset('reset-1', 'a new password');
        const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/confirm-password-reset`);
        expect(confirm.request.body).toEqual({ resetToken: 'reset-1', newPassword: 'a new password' });
        confirm.flush('', { status: 204, statusText: 'No Content' });
        await confirmed;

        await loginWithJwt(authService, backend);
        const changed: Promise<void> = authService.changePassword('secret', 'another password');
        const change: TestRequest = await expectRequest(backend, 'POST', `${API}/change-password`);
        expect(change.request.body).toEqual({ currentPassword: 'secret', newPassword: 'another password' });
        expect(change.request.headers.get('Authorization')).toBe('Bearer access-1');
        change.flush('', { status: 204, statusText: 'No Content' });
        await changed;
    });

    test('follows the login of another tab, and forgets a login that ran out', () => {
        const [authService] = setup('cookie');
        expect(authService.loggedIn()).toBe(false);

        // another tab logged in
        localStorage.setItem('authData', JSON.stringify({ strategy: 'cookie', userId: 'user-1', roles: ['admin'], expiresAt: inMs(HOUR) }));
        window.dispatchEvent(new StorageEvent('storage', { key: 'authData' }));
        expect(authService.roles()).toEqual(['admin']);

        localStorage.setItem('authData', JSON.stringify({ strategy: 'cookie', userId: 'user-1', roles: ['admin'], expiresAt: inMs(-1) }));
        TestBed.resetTestingModule();
        const [afterReload] = setup('cookie');
        expect(afterReload.loggedIn()).toBe(false);
    });

    test('logs in with cookies and keeps the csrf token of the answer', async () => {
        const [authService, backend] = setup('cookie');

        const loggedIn: Promise<LoginResult> = authService.login({ email: 'ada@example.com', password: 'secret' });
        const request: TestRequest = await expectRequest(backend, 'POST', `${API}/login?authenticator=password&strategy=cookie`);
        expect(request.request.withCredentials).toBe(true);
        request.flush(createCookieData('csrf-1'));
        expect((await answerCurrentUser(backend)).request.withCredentials).toBe(true);
        await loggedIn;

        expect(await authService.resolveCsrfToken()).toBe('csrf-1');
        const loggedOut: Promise<void> = authService.logout();
        (await expectRequest(backend, 'POST', `${API}/logout?strategy=cookie`)).flush({});
        await loggedOut;
    });
});