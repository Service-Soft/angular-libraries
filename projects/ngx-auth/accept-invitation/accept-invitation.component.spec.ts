import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component, Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthData, authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { FormTestingUtilities } from 'testing/form';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CurrentUserProfile, InvitationTokenValidity } from 'zibri-contract';

import { AcceptInvitationComponent } from './accept-invitation.component';

const API: string = 'https://api.example.com/auth';
const HOUR: number = 3_600_000;

@Service()
class AppAuthService extends AuthService {}

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

// a link of an invitation that works, to tenant-b.
const VALID: InvitationTokenValidity = { isValid: true, renewed: false, email: 'ada@example.com', tenantId: 'tenant-b', requiresLogin: true, declinable: true };

const ADA: CurrentUserProfile = { id: 'user-1', email: 'Ada@example.com', memberships: [{ tenantId: 'tenant-a', permissions: [] }], platformPermissions: [] };

// a jwt login of another visit, which the AuthService finds in the browser.
function storeLogin(user: CurrentUserProfile): void {
    const expirationDate: string = new Date(Date.now() + HOUR).toISOString();
    const login: AuthData<string> = {
        strategy: 'jwt',
        userId: user.id,
        roles: ['user'],
        expiresAt: expirationDate,
        user,
        activeTenantId: 'tenant-a',
        accessToken: { value: 'access-1', expirationDate },
        refreshToken: { value: 'refresh-1', expirationDate }
    };
    localStorage.setItem('authData', JSON.stringify(login));
}

// opens the link of the email, which zibri ends with the token.
async function open(validity: InvitationTokenValidity): Promise<[HTMLElement, RouterTestingHarness, HttpTestingController]> {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([
                { path: 'accept-invitation/:token', component: AcceptInvitationComponent },
                { path: '**', component: PageComponent }
            ]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy: 'jwt' })
        ]
    });
    const harness: RouterTestingHarness = await RouterTestingHarness.create('/accept-invitation/invitation-1');
    const backend: HttpTestingController = TestBed.inject(HttpTestingController);
    const verify: TestRequest = await expectRequest(backend, 'verify-invitation-token');
    expect(verify.request.body).toEqual({ token: 'invitation-1' });
    // zibri finds the invitation in every tenant, so the link names none, and needs no login
    expect(verify.request.headers.has('x-tenant-id')).toBe(false);
    expect(verify.request.headers.has('Authorization')).toBe(false);
    verify.flush(validity);
    await harness.fixture.whenStable();
    return [harness.fixture.nativeElement as HTMLElement, harness, backend];
}

async function expectRequest(backend: HttpTestingController, path: string): Promise<TestRequest> {
    return await vi.waitFor(() => backend.expectOne({ method: 'POST', url: `${API}/${path}` }));
}

describe('AcceptInvitationComponent', () => {
    afterEach(() => {
        localStorage.clear();
        TestBed.inject(HttpTestingController).verify();
    });

    test('accepts with the password of the account the invitation creates, and leads on to the login', async () => {
        const [root, harness, backend] = await open({ ...VALID, requiresLogin: false });
        await vi.waitFor(() => expect(root.textContent).toContain('You are invited as ada@example.com'));

        await vi.waitFor(() => expect(FormTestingUtilities.findInput(root, 'password')).not.toBeNull());
        FormTestingUtilities.type(root, 'password', 'correct horse battery staple');
        await harness.fixture.whenStable();
        FormTestingUtilities.click(root, 'Accept invitation');
        const accept: TestRequest = await expectRequest(backend, 'accept-invitation');
        expect(accept.request.body).toEqual({ token: 'invitation-1', password: 'correct horse battery staple' });
        accept.flush('', { status: 204, statusText: 'No Content' });

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('Your account is ready. Log in with your password.'));
        expect(FormTestingUtilities.findInput(root, 'password')).toBeNull();
        // the button the user pressed is gone, so the focus moves on to the login
        await vi.waitFor(() => expect(document.activeElement?.getAttribute('href')).toBe('/login'));
    });

    test('says that a link doesn\'t work, and that a new one was mailed when it was renewed', async () => {
        const [invalid] = await open({ isValid: false, renewed: false, requiresLogin: false, declinable: false });
        await vi.waitFor(() => expect(invalid.textContent).toContain('This link doesn\'t work.'));
        expect(invalid.querySelector('button')).toBeNull();

        TestBed.resetTestingModule();
        const [renewed] = await open({ isValid: false, renewed: true, requiresLogin: false, declinable: false });
        await vi.waitFor(() => expect(renewed.textContent).toContain('A new one was mailed to the invited address.'));
    });

    test('leads to the login and back while nobody is logged in, and declines without a login', async () => {
        const [root, harness, backend] = await open(VALID);

        await vi.waitFor(() => expect(root.textContent).toContain('Log in as the invited account to accept the invitation.'));
        const login: HTMLAnchorElement | null = root.querySelector('a');
        expect(decodeURIComponent(login?.getAttribute('href') ?? '')).toBe('/login?returnUrl=/accept-invitation/invitation-1');

        FormTestingUtilities.click(root, 'Decline');
        const decline: TestRequest = await expectRequest(backend, 'decline-invitation');
        expect(decline.request.body).toEqual({ token: 'invitation-1' });
        decline.flush('', { status: 204, statusText: 'No Content' });
        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('The invitation was declined.'));
        await harness.fixture.whenStable();
        // nothing to go on with, so the focus goes to the heading
        await vi.waitFor(() => expect(document.activeElement?.tagName).toBe('H1'));
    });

    test('accepts with one button as the invited account, which then acts in the tenant of the invitation', async () => {
        storeLogin(ADA);
        const [root, harness, backend] = await open({ ...VALID, declinable: false });
        await vi.waitFor(() => expect(root.textContent).toContain('Accept invitation'));
        expect(root.textContent).not.toContain('Decline');

        FormTestingUtilities.click(root, 'Accept invitation');
        const accept: TestRequest = await expectRequest(backend, 'accept-invitation');
        expect(accept.request.body).toEqual({ token: 'invitation-1' });
        // with the login, but without the active tenant
        expect(accept.request.headers.get('Authorization')).toBe('Bearer access-1');
        expect(accept.request.headers.has('x-tenant-id')).toBe(false);
        accept.flush('', { status: 204, statusText: 'No Content' });
        const member: CurrentUserProfile = { ...ADA, memberships: [...ADA.memberships, { tenantId: 'tenant-b', permissions: ['invoices.read'] }] };
        (await vi.waitFor(() => backend.expectOne(`${API}/me`))).flush(member);

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('The invitation was accepted.'));
        const authService: AppAuthService = TestBed.inject(AppAuthService);
        expect(authService.activeTenantId()).toBe('tenant-b');
        expect(authService.hasPermission('invoices.read')).toBe(true);
        await harness.fixture.whenStable();
        await vi.waitFor(() => expect(document.activeElement?.getAttribute('href')).toBe('/'));
    });

    test('shows what zibri refused accepting for, and keeps the login', async () => {
        storeLogin(ADA);
        const [root, , backend] = await open(VALID);

        await vi.waitFor(() => expect(root.textContent).toContain('Accept invitation'));
        FormTestingUtilities.click(root, 'Accept invitation');
        (await expectRequest(backend, 'accept-invitation')).flush(
            { status: 401, name: 'UnauthorizedError', message: 'Link expired', paragraphs: ['Link expired'] },
            { status: 401, statusText: 'Unauthorized' }
        );

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="alert"]')).toBe('Link expired'));
        expect(TestBed.inject(AppAuthService).loggedIn()).toBe(true);
    });

    test('offers logging out to an account of another email, and leads to the login and back', async () => {
        storeLogin({ ...ADA, email: 'grace@example.com' });
        const [root, , backend] = await open(VALID);
        await vi.waitFor(() => expect(root.textContent).toContain('You are logged in with another account.'));
        expect(root.textContent).not.toContain('Accept invitation');

        FormTestingUtilities.click(root, 'Log out');
        (await expectRequest(backend, 'logout?strategy=jwt')).flush({});

        await vi.waitFor(() => expect(decodeURIComponent(TestBed.inject(Router).url)).toBe('/login?returnUrl=/accept-invitation/invitation-1'));
        expect(TestBed.inject(AppAuthService).loggedIn()).toBe(false);
    });
});