// the DialogService renders the dialog into the body, so the tests find it there.
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { ApplicationRef, Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { firstValueFrom } from 'rxjs';
import { DialogTestingUtilities } from 'testing/dialog';
import { FormTestingUtilities } from 'testing/form';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { TwoFactorDialogPrompt } from './two-factor-dialog-prompt.service';

const API: string = 'https://api.example.com/auth';
const ACCOUNT: string = 'https://api.example.com/account';
const HOUR: number = 3_600_000;

@Service()
class AppAuthService extends AuthService {}

function inMs(ms: number): string {
    return new Date(Date.now() + ms).toISOString();
}

// a user who logged in with cookies on another visit, and a request that changes their account.
function setup(): [HttpClient, HttpTestingController] {
    localStorage.setItem('authData', JSON.stringify({ strategy: 'cookie', userId: 'user-1', roles: [], expiresAt: inMs(HOUR) }));
    TestBed.configureTestingModule({
        providers: [
            provideRouter([]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, {
                apiUrl: API,
                strategy: 'cookie',
                secondFactorPrompt: async () => await Promise.resolve(TwoFactorDialogPrompt)
            })
        ]
    });
    return [TestBed.inject(HttpClient), TestBed.inject(HttpTestingController)];
}

async function expectRequest(backend: HttpTestingController, method: string, url: string): Promise<TestRequest> {
    return await vi.waitFor(() => backend.expectOne({ method, url }));
}

async function findDialog(): Promise<HTMLDialogElement> {
    return await vi.waitFor(() => document.querySelector('dialog') ?? Promise.reject(new Error('no dialog yet')));
}

async function render(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
}

// a request zibri refuses for its second factor, which the interceptor answers by asking for it.
async function refuseForSecondFactor(backend: HttpTestingController, methods: string[]): Promise<void> {
    (await expectRequest(backend, 'GET', `${API}/csrf-token?strategy=cookie`)).flush({ csrfToken: 'csrf-1' });
    (await expectRequest(backend, 'PATCH', ACCOUNT)).flush(
        { status: 401, name: 'SecondFactorMissingError', message: 'Missing.', paragraphs: ['Missing.'] },
        { status: 401, statusText: 'Unauthorized' }
    );
    (await expectRequest(backend, 'GET', `${API}/2fa/registrations`)).flush({ methods });
}

describe('TwoFactorDialogPrompt', () => {
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
    });

    afterEach(() => {
        removeModalDialogs();
        for (const element of document.querySelectorAll('ui-dialog')) {
            element.remove();
        }
        localStorage.clear();
        TestBed.inject(HttpTestingController).verify();
    });

    test('asks for the code of a method that sends one, and sends the request again with it', async () => {
        const [http, backend] = setup();

        const changed: Promise<object> = firstValueFrom(http.patch(ACCOUNT, { name: 'Ada' }));
        await refuseForSecondFactor(backend, ['email', 'otp']);
        const dialog: HTMLDialogElement = await findDialog();
        expect(FormTestingUtilities.getText(dialog, 'h2')).toBe('Confirm it\'s you');
        // the first method sends its code, as soon as it shows
        (await expectRequest(backend, 'POST', `${API}/2fa/request?method=email`)).flush('', { status: 204, statusText: 'No Content' });
        await vi.waitFor(() => expect(FormTestingUtilities.getText(dialog, '[role="status"]')).toBe('We sent you a code.'));

        FormTestingUtilities.type(dialog, 'code', '123456');
        await render();
        FormTestingUtilities.click(dialog, 'Confirm');
        const retried: TestRequest = await expectRequest(backend, 'PATCH', ACCOUNT);
        expect(retried.request.headers.get('x-authorization-email-code')).toBe('123456');
        retried.flush({ name: 'Ada' });

        expect(await changed).toEqual({ name: 'Ada' });
        await vi.waitFor(() => expect(document.querySelector('dialog')).toBeNull());
    });

    test('lets the request fail when the user cancels', async () => {
        const [http, backend] = setup();

        const changed: Promise<object> = firstValueFrom(http.patch(ACCOUNT, { name: 'Ada' }));
        await refuseForSecondFactor(backend, ['otp']);
        FormTestingUtilities.click(await findDialog(), 'Cancel');

        await expect(changed).rejects.toThrow();
        expect(TestBed.inject(AppAuthService).loggedIn()).toBe(true);
    });
});