import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Service } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { FormTestingUtilities } from 'testing/form';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { ChangePasswordComponent } from './change-password.component';

const API: string = 'https://api.example.com/auth';
const HOUR: number = 3_600_000;

@Service()
class AppAuthService extends AuthService {}

function inMs(ms: number): string {
    return new Date(Date.now() + ms).toISOString();
}

// the user logged in on another visit, which the AuthService finds in the browser.
async function setup(): Promise<[HTMLElement, ComponentFixture<ChangePasswordComponent>, HttpTestingController]> {
    localStorage.setItem('authData', JSON.stringify({
        strategy: 'jwt',
        userId: 'user-1',
        roles: [],
        expiresAt: inMs(24 * HOUR),
        accessToken: { value: 'access-1', expirationDate: inMs(HOUR) },
        refreshToken: { value: 'refresh-1', expirationDate: inMs(24 * HOUR) }
    }));
    TestBed.configureTestingModule({
        providers: [
            provideRouter([]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy: 'jwt' })
        ]
    });
    const fixture: ComponentFixture<ChangePasswordComponent> = TestBed.createComponent(ChangePasswordComponent);
    await fixture.whenStable();
    return [fixture.nativeElement as HTMLElement, fixture, TestBed.inject(HttpTestingController)];
}

async function change(root: HTMLElement, fixture: ComponentFixture<ChangePasswordComponent>, backend: HttpTestingController): Promise<TestRequest> {
    FormTestingUtilities.type(root, 'current-password', 'secret');
    FormTestingUtilities.type(root, 'new-password', 'a new password');
    // the user left both inputs, which shows their errors from now on
    for (const input of root.querySelectorAll('input')) {
        input.dispatchEvent(new Event('blur'));
    }
    await fixture.whenStable();
    FormTestingUtilities.click(root, 'Change password');
    return await vi.waitFor(() => backend.expectOne({ method: 'POST', url: `${API}/change-password` }));
}

describe('ChangePasswordComponent', () => {
    afterEach(() => {
        localStorage.clear();
        TestBed.inject(HttpTestingController).verify();
    });

    test('changes the password with the login, then empties the inputs without showing their errors', async () => {
        const [root, fixture, backend] = await setup();
        expect(FormTestingUtilities.getText(root, 'h2')).toBe('Change your password');

        const request: TestRequest = await change(root, fixture, backend);
        expect(request.request.body).toEqual({ currentPassword: 'secret', newPassword: 'a new password' });
        expect(request.request.headers.get('Authorization')).toBe('Bearer access-1');
        request.flush('', { status: 204, statusText: 'No Content' });

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toContain('Your password was changed.'));
        await fixture.whenStable();
        expect([...root.querySelectorAll('input')].map(input => [input.value, input.hasAttribute('aria-invalid')])).toEqual([['', false], ['', false]]);
    });

    test('shows what zibri refused the change for, and keeps what the user typed', async () => {
        const [root, fixture, backend] = await setup();

        (await change(root, fixture, backend)).flush(
            { status: 403, name: 'ForbiddenError', message: 'Wrong password.', paragraphs: ['The current password is wrong.'] },
            { status: 403, statusText: 'Forbidden' }
        );

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="alert"]')).toBe('The current password is wrong.'));
        expect(FormTestingUtilities.findInput(root, 'current-password')?.value).toBe('secret');
        expect(TestBed.inject(AppAuthService).loggedIn()).toBe(true);
    });
});