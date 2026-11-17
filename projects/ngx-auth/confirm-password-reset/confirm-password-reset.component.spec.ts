import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { FormTestingUtilities } from 'testing/form';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ConfirmPasswordResetComponent } from './confirm-password-reset.component';

const API: string = 'https://api.example.com/auth';

@Service()
class AppAuthService extends AuthService {}

// opens the link of the email, which zibri ends with the token.
async function open(isValid: boolean): Promise<[HTMLElement, RouterTestingHarness, HttpTestingController]> {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([{ path: 'reset-password/:token', component: ConfirmPasswordResetComponent }]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy: 'cookie' })
        ]
    });
    const harness: RouterTestingHarness = await RouterTestingHarness.create('/reset-password/reset-1');
    const backend: HttpTestingController = TestBed.inject(HttpTestingController);
    const verify: TestRequest = await vi.waitFor(() => backend.expectOne({ method: 'POST', url: `${API}/verify-password-reset-token` }));
    expect(verify.request.body).toEqual({ resetToken: 'reset-1' });
    verify.flush({ isValid });
    await harness.fixture.whenStable();
    return [harness.fixture.nativeElement as HTMLElement, harness, backend];
}

async function save(root: HTMLElement, harness: RouterTestingHarness, backend: HttpTestingController): Promise<TestRequest> {
    await vi.waitFor(() => expect(FormTestingUtilities.findInput(root, 'new-password')).not.toBeNull());
    FormTestingUtilities.type(root, 'new-password', 'a new password');
    await harness.fixture.whenStable();
    FormTestingUtilities.click(root, 'Save password');
    return await vi.waitFor(() => backend.expectOne({ method: 'POST', url: `${API}/confirm-password-reset` }));
}

describe('ConfirmPasswordResetComponent', () => {
    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
    });

    test('sets the new password with the token of the link, and leads on to the login', async () => {
        const [root, harness, backend] = await open(true);

        const confirm: TestRequest = await save(root, harness, backend);
        expect(confirm.request.body).toEqual({ resetToken: 'reset-1', newPassword: 'a new password' });
        confirm.flush('', { status: 204, statusText: 'No Content' });

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toContain('Your password was changed.'));
        expect(FormTestingUtilities.findInput(root, 'new-password')).toBeNull();
        // the button the user pressed is gone, so the focus moves on to the login
        await vi.waitFor(() => expect(document.activeElement?.getAttribute('href')).toBe('/login'));
    });

    test('shows what zibri refused a password for, and keeps the form', async () => {
        const [root, harness, backend] = await open(true);

        (await save(root, harness, backend)).flush(
            { status: 400, name: 'PasswordRefusedError', message: 'Too short.', paragraphs: ['A password needs at least 15 characters.'] },
            { status: 400, statusText: 'Bad Request' }
        );

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="alert"]')).toBe('A password needs at least 15 characters.'));
        expect(FormTestingUtilities.findInput(root, 'new-password')?.value).toBe('a new password');
    });

    test('offers a new link when the link doesn\'t work anymore', async () => {
        const [root] = await open(false);

        await vi.waitFor(() => expect(root.textContent).toContain('This link doesn\'t work anymore.'));
        expect(FormTestingUtilities.findInput(root, 'new-password')).toBeNull();
        expect(root.querySelector('a')?.getAttribute('href')).toBe('/request-password-reset');
    });
});