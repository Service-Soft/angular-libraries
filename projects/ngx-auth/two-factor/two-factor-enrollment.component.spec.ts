import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Service } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { FormTestingUtilities } from 'testing/form';
import { HttpTestingUtilities } from 'testing/http';
import { AddedPasskeyDevice, PasskeyTestingUtilities } from 'testing/passkey';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { TwoFactorEnrollmentResult } from './two-factor-enrollment-result.model';
import { TwoFactorEnrollmentComponent } from './two-factor-enrollment.component';

const API: string = 'https://api.example.com/auth';
const HOUR: number = 3_600_000;

@Service()
class AppAuthService extends AuthService {}

function inMs(ms: number): string {
    return new Date(Date.now() + ms).toISOString();
}

// a user who logged in with tokens on another visit, enrolling a method.
async function setup(
    method: string,
    ticket?: string,
    passkeyName?: string
): Promise<[HTMLElement, ComponentFixture<TwoFactorEnrollmentComponent>, HttpTestingController, TwoFactorEnrollmentResult[]]> {
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
    const fixture: ComponentFixture<TwoFactorEnrollmentComponent> = TestBed.createComponent(TwoFactorEnrollmentComponent);
    fixture.componentRef.setInput('method', method);
    fixture.componentRef.setInput('ticket', ticket);
    fixture.componentRef.setInput('passkeyName', passkeyName);
    const enrolled: TwoFactorEnrollmentResult[] = [];
    fixture.componentInstance.enrolled.subscribe(result => enrolled.push(result));
    await fixture.whenStable();
    return [fixture.nativeElement as HTMLElement, fixture, TestBed.inject(HttpTestingController), enrolled];
}

async function expectRequest(backend: HttpTestingController, method: string, url: string): Promise<TestRequest> {
    return await vi.waitFor(() => backend.expectOne({ method, url }));
}

async function turnOn(root: HTMLElement, fixture: ComponentFixture<TwoFactorEnrollmentComponent>, code: string): Promise<void> {
    await vi.waitFor(() => expect(FormTestingUtilities.findInput(root, 'code')).not.toBeNull());
    FormTestingUtilities.type(root, 'code', code);
    await fixture.whenStable();
    FormTestingUtilities.click(root, 'Turn on');
}

describe('TwoFactorEnrollmentComponent', () => {
    afterEach(() => {
        localStorage.clear();
        TestBed.inject(HttpTestingController).verify();
    });

    test('shows the qr code and the secret of an authenticator app, and turns it on with its first code', async () => {
        const [root, fixture, backend, enrolled] = await setup('otp');

        const request: TestRequest = await expectRequest(backend, 'POST', `${API}/2fa/registration/request?method=otp`);
        expect(request.request.headers.get('Authorization')).toBe('Bearer access-1');
        request.flush({ qrCodeUrl: 'otpauth://totp/Example:ada%40example.com?secret=SECRET', secret: 'SECRET' });
        await vi.waitFor(() => expect(root.querySelector('svg')?.getAttribute('aria-label')).toBe('QR code for your authenticator app'));
        expect(root.querySelector('svg path')?.getAttribute('d')).toMatch(/^M\d+ \d+h1v1h-1z/);
        expect(root.textContent).toContain('SECRET');
        // the button that started the enrollment may be gone, so the focus goes on to the code
        await vi.waitFor(() => expect(document.activeElement).toBe(FormTestingUtilities.findInput(root, 'code')));

        await turnOn(root, fixture, '123456');
        const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/2fa/registration/confirm?method=otp`);
        expect(confirm.request.body).toEqual({ token: '123456' });
        confirm.flush('', { status: 204, statusText: 'No Content' });

        await vi.waitFor(() => expect(enrolled).toEqual([{ method: 'otp', loginResult: undefined }]));
    });

    test('asks for the phone number of codes by text message, sends one and turns it on with it', async () => {
        const [root, fixture, backend, enrolled] = await setup('sms');

        await vi.waitFor(() => expect(FormTestingUtilities.findInput(root, 'phone-number')?.type).toBe('tel'));
        FormTestingUtilities.type(root, 'phone-number', '+4915112345678');
        await fixture.whenStable();
        FormTestingUtilities.click(root, 'Send code');
        const request: TestRequest = await expectRequest(backend, 'POST', `${API}/2fa/registration/request?method=sms`);
        expect(request.request.body).toEqual({ phoneNumber: '+4915112345678' });
        HttpTestingUtilities.flushNoContent(request);
        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('We sent you a code.'));

        FormTestingUtilities.click(root, 'Send a new code');
        HttpTestingUtilities.flushNoContent(await expectRequest(backend, 'POST', `${API}/2fa/registration/request?method=sms`));
        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('We sent you a new code.'));

        await turnOn(root, fixture, '654321');
        const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/2fa/registration/confirm?method=sms`);
        expect(confirm.request.body).toEqual({ code: '654321' });
        confirm.flush('', { status: 204, statusText: 'No Content' });
        await vi.waitFor(() => expect(enrolled).toEqual([{ method: 'sms', loginResult: undefined }]));
    });

    test('shows the recovery codes to save, and keeps the enrollment when zibri refuses the code', async () => {
        const [root, fixture, backend, enrolled] = await setup('recovery-code');

        (await expectRequest(backend, 'POST', `${API}/2fa/registration/request?method=recovery-code`))
            .flush({ codes: ['FIRST-CODE', 'SECOND-CODE'] });
        await vi.waitFor(() => expect([...root.querySelectorAll('li')].map(item => item.textContent.trim())).toEqual(['FIRST-CODE', 'SECOND-CODE']));

        await turnOn(root, fixture, 'WRONG-CODE');
        (await expectRequest(backend, 'POST', `${API}/2fa/registration/confirm?method=recovery-code`)).flush(
            { status: 401, name: 'InvalidTwoFactorCodeError', message: 'Wrong.', paragraphs: ['This code is wrong.'] },
            { status: 401, statusText: 'Unauthorized' }
        );

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="alert"]')).toBe('This code is wrong.'));
        expect(root.querySelectorAll('li')).toHaveLength(2);
        expect(enrolled).toEqual([]);
    });

    test('has the device create a passkey once the user presses the button, and turns it on with it', async () => {
        const attestation: RegistrationResponseJSON = {
            id: 'credential-1',
            rawId: 'credential-1',
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
        const device: AddedPasskeyDevice = PasskeyTestingUtilities.addDevice({ attestation });
        try {
            const [root, fixture, backend, enrolled] = await setup('passkey', undefined, 'ada@example.com');

            const request: TestRequest = await expectRequest(backend, 'POST', `${API}/2fa/registration/request?method=passkey`);
            expect(request.request.body).toEqual({ name: 'ada@example.com' });
            request.flush({ challenge: 'challenge-1' });
            // the device only creates a passkey right after the user pressed something
            await vi.waitFor(() => expect(document.activeElement?.textContent.trim()).toBe('Create passkey'));
            expect(device.creations).toEqual([]);

            FormTestingUtilities.click(root, 'Create passkey');
            await fixture.whenStable();
            const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/2fa/registration/confirm?method=passkey`);
            expect(device.creations).toEqual([{ challenge: 'challenge-1' }]);
            expect(confirm.request.body).toEqual({ response: attestation });
            HttpTestingUtilities.flushNoContent(confirm);
            await vi.waitFor(() => expect(enrolled).toEqual([{ method: 'passkey', loginResult: undefined }]));
        }
        finally {
            device.remove();
        }
    });

    test('enrolls the first method of a login with its ticket', async () => {
        const [root, fixture, backend, enrolled] = await setup('email', 'ticket-1');

        const request: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/registration/request?method=email`);
        expect(request.request.headers.get('x-login-ticket')).toBe('ticket-1');
        HttpTestingUtilities.flushNoContent(request);

        await turnOn(root, fixture, '123456');
        const confirm: TestRequest = await expectRequest(backend, 'POST', `${API}/login/2fa/registration/confirm?strategy=jwt&method=email`);
        expect(confirm.request.headers.get('x-login-ticket')).toBe('ticket-1');
        // only enrolled, like by an auth service of the app's own in zibri
        HttpTestingUtilities.flushNoContent(confirm);
        const onlyEnrolled: TwoFactorEnrollmentResult = {
            method: 'email',
            loginResult: { type: 'secondFactorRequired', ticket: 'ticket-1', methods: ['email'] }
        };
        await vi.waitFor(() => expect(enrolled).toEqual([onlyEnrolled]));
    });
});