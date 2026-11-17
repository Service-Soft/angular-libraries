import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component, Provider, Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { FormTestingUtilities } from 'testing/form';
import { HttpTestingUtilities } from 'testing/http';
import { AddedPasskeyDevice, PasskeyTestingUtilities } from 'testing/passkey';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { JwtAuthData } from 'zibri-contract';

import { provideLoginConfig } from './login-config.provider';
import { LoginProvider } from './login-provider.model';
import { LoginComponent } from './login.component';

const API: string = 'https://api.example.com/auth';
const HOUR: number = 3_600_000;

// what a device answers when the user picks a passkey.
const ASSERTION: AuthenticationResponseJSON = {
    id: 'credential-1',
    rawId: 'credential-1',
    type: 'public-key',
    clientExtensionResults: {},
    response: { clientDataJSON: 'client-data', authenticatorData: 'authenticator-data', signature: 'signature' }
};

@Service()
class AppAuthService extends AuthService {}

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

function inMs(ms: number): string {
    return new Date(Date.now() + ms).toISOString();
}

function createJwtData(): JwtAuthData<string> {
    return {
        userId: 'user-1',
        roles: ['user'],
        accessToken: { value: 'access-1', expirationDate: inMs(HOUR) },
        refreshToken: { value: 'refresh-1', expirationDate: inMs(30 * 24 * HOUR) }
    };
}

async function setup(url: string, providers: Provider[] = []): Promise<[RouterTestingHarness, HttpTestingController]> {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([
                { path: 'login', component: LoginComponent },
                { path: '**', component: PageComponent }
            ]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy: 'jwt' }),
            ...providers
        ]
    });
    const harness: RouterTestingHarness = await RouterTestingHarness.create();
    await harness.navigateByUrl(url);
    return [harness, TestBed.inject(HttpTestingController)];
}

function getRoot(harness: RouterTestingHarness): HTMLElement {
    return harness.fixture.nativeElement as HTMLElement;
}

function findInput(harness: RouterTestingHarness, name: string): HTMLInputElement | null {
    return FormTestingUtilities.findInput(getRoot(harness), name);
}

async function type(harness: RouterTestingHarness, name: string, value: string): Promise<void> {
    FormTestingUtilities.type(getRoot(harness), name, value);
    await harness.fixture.whenStable();
}

async function click(harness: RouterTestingHarness, text: string): Promise<void> {
    FormTestingUtilities.click(getRoot(harness), text);
    await harness.fixture.whenStable();
}

function getText(harness: RouterTestingHarness, selector: string): string {
    return FormTestingUtilities.getText(getRoot(harness), selector);
}

async function expectRequest(backend: HttpTestingController, method: string, url: string): Promise<TestRequest> {
    return await vi.waitFor(() => backend.expectOne({ method, url }));
}

// what zibri answers a refused request with.
function refuse(request: TestRequest, body: object): void {
    request.flush({ status: 401, message: 'Refused', ...body }, { status: 401, statusText: 'Unauthorized' });
}

async function answerCurrentUser(backend: HttpTestingController): Promise<void> {
    (await expectRequest(backend, 'GET', `${API}/me`)).flush({ id: 'user-1', email: 'ada@example.com', memberships: [], platformPermissions: [] });
}

async function submitCredentials(harness: RouterTestingHarness, backend: HttpTestingController): Promise<TestRequest> {
    await type(harness, 'email', 'ada@example.com');
    await type(harness, 'password', 'secret');
    await click(harness, 'Log in');
    return await expectRequest(backend, 'POST', `${API}/login?authenticator=password&strategy=jwt`);
}

// a user without a second factor, whose account needs one, enrolls an authenticator app.
async function enrollAuthenticatorApp(harness: RouterTestingHarness, backend: HttpTestingController): Promise<TestRequest> {
    refuse(await submitCredentials(harness, backend), { name: 'SecondFactorRequiredError', ticket: 'ticket-1', methods: [] });
    await vi.waitFor(() => expect(getText(harness, 'h1')).toBe('Set up a second factor'));
    // recovery codes are no first factor
    expect([...getRoot(harness).querySelectorAll('li')].map(item => item.textContent.trim()))
        .toEqual(['Authenticator app', 'Codes by email', 'Codes by text message', 'Passkeys']);

    await click(harness, 'Authenticator app');
    const request: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/registration/request?method=otp`);
    expect(request.request.headers.get('x-login-ticket')).toBe('ticket-1');
    request.flush({ qrCodeUrl: 'otpauth://totp/Example:ada', secret: 'SECRET' });
    await vi.waitFor(() => expect(findInput(harness, 'code')).not.toBeNull());
    await type(harness, 'code', '111111');
    await click(harness, 'Turn on');
    return await expectRequest(backend, 'POST', `${API}/login/2fa/registration/confirm?strategy=jwt&method=otp`);
}

describe('LoginComponent', () => {
    afterEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        TestBed.inject(HttpTestingController).verify();
    });

    test('logs in with the email and the password, and opens the page the user wanted', async () => {
        const [harness, backend] = await setup('/login?returnUrl=/account');
        expect(getText(harness, 'h1')).toBe('Log in');

        const login: TestRequest = await submitCredentials(harness, backend);
        expect(login.request.body).toEqual({ email: 'ada@example.com', password: 'secret' });
        login.flush(createJwtData());
        await answerCurrentUser(backend);

        await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/account'));
    });

    test('shows what zibri answered a refused login with, and keeps what the user typed', async () => {
        const [harness, backend] = await setup('/login');

        refuse(await submitCredentials(harness, backend), { name: 'UnauthorizedError', paragraphs: ['Wrong email or password.'] });

        await vi.waitFor(() => expect(getText(harness, '[role="alert"]')).toBe('Wrong email or password.'));
        expect(findInput(harness, 'email')?.value).toBe('ada@example.com');
        expect(findInput(harness, 'password')?.value).toBe('secret');
        expect(TestBed.inject(AppAuthService).loggedIn()).toBe(false);
    });

    test('asks for a code, switches to a method that sends one, then asks for a new password and logs in', async () => {
        const [harness, backend] = await setup('/login');

        refuse(await submitCredentials(harness, backend), { name: 'SecondFactorRequiredError', ticket: 'ticket-1', methods: ['otp', 'email', 'hardware-token'] });
        await vi.waitFor(() => expect(getText(harness, 'h1')).toBe('Confirm it\'s you'));
        expect(document.activeElement).toBe(findInput(harness, 'code'));
        expect(findInput(harness, 'code')?.getAttribute('inputmode')).toBe('numeric');
        // a method the app configured nothing for isn't offered
        expect(getText(harness, 'ul')).toBe('Get a code by email');

        await click(harness, 'Get a code by email');
        const sent: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/request?method=email`);
        expect(sent.request.headers.get('x-login-ticket')).toBe('ticket-1');
        sent.flush('', { status: 204, statusText: 'No Content' });
        await vi.waitFor(() => expect(getText(harness, '[role="status"]')).toBe('We sent you a code.'));
        expect(getText(harness, 'ul')).toBe('Use your authenticator app');
        await click(harness, 'Send a new code');
        (await expectRequest(backend, 'POST', `${API}/login/2fa/request?method=email`)).flush('', { status: 204, statusText: 'No Content' });
        await vi.waitFor(() => expect(getText(harness, '[role="status"]')).toBe('We sent you a new code.'));

        await type(harness, 'code', '123456');
        await click(harness, 'Confirm');
        const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/confirm?strategy=jwt`);
        expect(confirm.request.headers.get('x-authorization-email-code')).toBe('123456');
        refuse(confirm, { name: 'PasswordChangeRequiredError', ticket: 'ticket-2' });

        await vi.waitFor(() => expect(getText(harness, 'h1')).toBe('Choose a new password'));
        expect(document.activeElement).toBe(findInput(harness, 'new-password'));
        await type(harness, 'new-password', 'a new password');
        await click(harness, 'Change password');
        const change: TestRequest = await expectRequest(backend, 'POST', `${API}/login/change-password?strategy=jwt`);
        expect(change.request.body).toEqual({ newPassword: 'a new password' });
        change.flush(createJwtData());
        await answerCurrentUser(backend);

        await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/'));
    });

    test('enrolls the first second factor of a user without one, which completes the login', async () => {
        const [harness, backend] = await setup('/login');

        const enroll: TestRequest = await enrollAuthenticatorApp(harness, backend);
        expect(enroll.request.body).toEqual({ token: '111111' });
        enroll.flush(createJwtData());
        await answerCurrentUser(backend);

        await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/'));
    });

    test('asks for the next code when zibri only enrolled the first second factor', async () => {
        const [harness, backend] = await setup('/login');

        // like an auth service of the app's own, which doesn't complete the login
        HttpTestingUtilities.flushNoContent(await enrollAuthenticatorApp(harness, backend));

        await vi.waitFor(() => expect(getText(harness, 'h1')).toBe('Confirm it\'s you'));
        expect(getText(harness, 'h1 + p')).toContain('Confirm it once more');
        await type(harness, 'code', '222222');
        await click(harness, 'Confirm');
        const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/confirm?strategy=jwt`);
        expect(confirm.request.headers.get('x-authorization-otp')).toBe('222222');
        confirm.flush(createJwtData());
        await answerCurrentUser(backend);

        await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/'));
    });

    test('logs in with a passkey, and with one as the second factor', async () => {
        const device: AddedPasskeyDevice = PasskeyTestingUtilities.addDevice({ assertion: ASSERTION });
        try {
            const [harness, backend] = await setup('/login', [provideLoginConfig({ passkeyAuthenticator: 'passkey' })]);

            await click(harness, 'Log in with a passkey');
            (await expectRequest(backend, 'POST', `${API}/login-options?authenticator=passkey`)).flush({ challenge: 'challenge-1' });
            const login: TestRequest = await expectRequest(backend, 'POST', `${API}/login?authenticator=passkey&strategy=jwt`);
            expect(login.request.body).toEqual({ response: ASSERTION });
            // the account asks for a second factor, which a passkey is as well
            refuse(login, { name: 'SecondFactorRequiredError', ticket: 'ticket-1', methods: ['passkey', 'otp'] });

            await vi.waitFor(() => expect(getText(harness, 'h1')).toBe('Confirm it\'s you'));
            expect(document.activeElement?.textContent.trim()).toBe('Use passkey');
            await click(harness, 'Use passkey');
            const challenge: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/request?method=passkey`);
            expect(challenge.request.headers.get('x-login-ticket')).toBe('ticket-1');
            challenge.flush({ challenge: 'challenge-2' });
            const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/confirm?strategy=jwt`);
            expect(confirm.request.headers.get('x-authorization-passkey')).toMatch(/^[\w-]+$/);
            confirm.flush(createJwtData());
            await answerCurrentUser(backend);

            await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/'));
            expect(device.requests).toEqual([{ challenge: 'challenge-1' }, { challenge: 'challenge-2' }]);
        }
        finally {
            device.remove();
        }
    });

    test('offers the passkeys in the autofill of the email, and logs in with the one the user picks there', async () => {
        const device: AddedPasskeyDevice = PasskeyTestingUtilities.addDevice({ assertion: ASSERTION, autofill: true });
        try {
            const [harness, backend] = await setup('/login', [provideLoginConfig({ passkeyAuthenticator: 'passkey' })]);
            expect(getRoot(harness).querySelector('input[name="email"]')
                ?.getAttribute('autocomplete')).toBe('username webauthn');

            (await expectRequest(backend, 'POST', `${API}/login-options?authenticator=passkey`)).flush({ challenge: 'challenge-1' });
            await vi.waitFor(() => expect(device.isWaitingInAutofill()).toBe(true));
            device.pickFromAutofill();
            const login: TestRequest = await expectRequest(backend, 'POST', `${API}/login?authenticator=passkey&strategy=jwt`);
            expect(login.request.body).toEqual({ response: ASSERTION });
            login.flush(createJwtData());
            await answerCurrentUser(backend);

            await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/'));
        }
        finally {
            device.remove();
        }
    });

    test('stops waiting in the autofill before the button of the passkey asks, which the browser refuses otherwise', async () => {
        const device: AddedPasskeyDevice = PasskeyTestingUtilities.addDevice({ assertion: ASSERTION, autofill: true });
        try {
            const [harness, backend] = await setup('/login', [provideLoginConfig({ passkeyAuthenticator: 'passkey' })]);
            (await expectRequest(backend, 'POST', `${API}/login-options?authenticator=passkey`)).flush({ challenge: 'challenge-1' });
            await vi.waitFor(() => expect(device.isWaitingInAutofill()).toBe(true));

            await click(harness, 'Log in with a passkey');
            expect(device.isWaitingInAutofill()).toBe(false);
            (await expectRequest(backend, 'POST', `${API}/login-options?authenticator=passkey`)).flush({ challenge: 'challenge-2' });
            const login: TestRequest = await expectRequest(backend, 'POST', `${API}/login?authenticator=passkey&strategy=jwt`);
            // the aborted request shows nothing
            expect(getRoot(harness).querySelector('[role="alert"]')?.textContent.trim()).toBe('');
            login.flush(createJwtData());
            await answerCurrentUser(backend);

            await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/'));
        }
        finally {
            device.remove();
        }
    });

    test('offers the providers, and completes the login the browser comes back with from one', async () => {
        const providers: LoginProvider[] = [{ authenticator: 'google', label: 'Log in with Google' }];
        const [harness, backend] = await setup('/login', [provideLoginConfig({ providers })]);
        expect([...getRoot(harness).querySelectorAll('ul button')].map(button => button.textContent.trim())).toEqual(['Log in with Google']);

        // the login this tab started at the provider, which sent the browser back with a code
        const authService: AppAuthService = TestBed.inject(AppAuthService);
        await authService.resolveProviderLoginUrl('google', 'https://app.example.com/login', '/account');
        const codeVerifier: string | undefined = authService.findPendingProviderLogin()?.codeVerifier;
        await harness.navigateByUrl('/');
        await harness.navigateByUrl('/login?code=code-1');
        const login: TestRequest = await expectRequest(backend, 'POST', `${API}/login?authenticator=google&strategy=jwt`);
        expect(login.request.body).toEqual({ code: 'code-1', codeVerifier });
        // the code works once, so it leaves the url before a reload sends it again
        expect(TestBed.inject(Router).url).toBe('/login');
        login.flush(createJwtData());
        await answerCurrentUser(backend);

        await vi.waitFor(() => expect(TestBed.inject(Router).url).toBe('/account'));
    });

    test('shows nothing when the user cancels a passkey, which they do on purpose', async () => {
        const device: AddedPasskeyDevice = PasskeyTestingUtilities.addDevice({ cancels: true });
        try {
            const [harness, backend] = await setup('/login', [provideLoginConfig({ passkeyAuthenticator: 'passkey' })]);

            await click(harness, 'Log in with a passkey');
            (await expectRequest(backend, 'POST', `${API}/login-options?authenticator=passkey`)).flush({ challenge: 'challenge-1' });
            await vi.waitFor(() => expect(device.requests).toHaveLength(1));
            await harness.fixture.whenStable();

            expect(getText(harness, '[role="alert"]')).toBe('');
            expect(getText(harness, 'h1')).toBe('Log in');
        }
        finally {
            device.remove();
        }
    });

    test('goes back to the email and the password, like after the ticket ran out', async () => {
        const [harness, backend] = await setup('/login');
        refuse(await submitCredentials(harness, backend), { name: 'SecondFactorRequiredError', ticket: 'ticket-1', methods: ['otp'] });
        await vi.waitFor(() => expect(findInput(harness, 'code')).not.toBeNull());

        await type(harness, 'code', '123456');
        await click(harness, 'Confirm');
        refuse(await expectRequest(backend, 'POST', `${API}/login/2fa/confirm?strategy=jwt`), {
            name: 'UnauthorizedError',
            paragraphs: ['This login ticket is unknown, spent or expired. Log in again.']
        });
        await vi.waitFor(() => expect(getText(harness, '[role="alert"]')).toContain('Log in again.'));

        await click(harness, 'Back');
        expect(getText(harness, 'h1')).toBe('Log in');
        expect(getText(harness, '[role="alert"]')).toBe('');
        expect(findInput(harness, 'email')?.value).toBe('ada@example.com');
    });

    test('links to the password reset, unless the app has none', async () => {
        const [harness] = await setup('/login');
        const link: HTMLAnchorElement | null = getRoot(harness).querySelector('a');
        expect(link?.getAttribute('href')).toBe('/request-password-reset');

        TestBed.resetTestingModule();
        const [withoutReset] = await setup('/login', [provideLoginConfig({ requestPasswordResetRoute: undefined })]);
        expect(getRoot(withoutReset).querySelector('a')).toBeNull();
    });
});