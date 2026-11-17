// the DialogService renders the question into the body, so the tests find it there.
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Service } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { DialogTestingUtilities } from 'testing/dialog';
import { FormTestingUtilities } from 'testing/form';
import { HttpTestingUtilities } from 'testing/http';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { TwoFactorSettingsComponent } from './two-factor-settings.component';

const API: string = 'https://api.example.com/auth';
const HOUR: number = 3_600_000;

@Service()
class AppAuthService extends AuthService {}

function inMs(ms: number): string {
    return new Date(Date.now() + ms).toISOString();
}

// a user who logged in with tokens on another visit, and enrolled the given methods.
async function setup(enrolled: string[]): Promise<[HTMLElement, ComponentFixture<TwoFactorSettingsComponent>, HttpTestingController]> {
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
    const fixture: ComponentFixture<TwoFactorSettingsComponent> = TestBed.createComponent(TwoFactorSettingsComponent);
    await fixture.whenStable();
    const backend: HttpTestingController = TestBed.inject(HttpTestingController);
    (await vi.waitFor(() => backend.expectOne(`${API}/2fa/registrations`))).flush({ methods: enrolled });
    const root: HTMLElement = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(root.querySelectorAll('li').length).toBeGreaterThan(0));
    return [root, fixture, backend];
}

// each method as the settings show it: its name, whether it is on, and its buttons.
function getRows(root: HTMLElement): string[] {
    return [...root.querySelectorAll('li')].map(item => item.textContent.replaceAll(/\s+/g, ' ').trim());
}

describe('TwoFactorSettingsComponent', () => {
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

    test('shows which methods are on, and what can be done with each', async () => {
        const [root] = await setup(['otp', 'recovery-code']);

        expect(FormTestingUtilities.getText(root, 'h2')).toBe('Two-factor authentication');
        expect(getRows(root)).toEqual([
            'Authenticator app On Turn off',
            'Codes by email Off Set up',
            'Codes by text message Off Set up',
            'Recovery codes On Get new codes Turn off',
            'Passkeys Off Set up'
        ]);
        // the buttons of every method say the same, so each is described by the name of its method
        const setUp: HTMLButtonElement | null = root.querySelector('[data-method="email"] button');
        expect(root.querySelector(`#${setUp?.getAttribute('aria-describedby') ?? ''}`)?.textContent).toBe('Codes by email');
    });

    test('sets a method up, and shows it on once it is', async () => {
        const [root, fixture, backend] = await setup([]);

        FormTestingUtilities.click(root.querySelector('[data-method="email"]') ?? root, 'Set up');
        await fixture.whenStable();
        HttpTestingUtilities.flushNoContent(await vi.waitFor(() => backend.expectOne(`${API}/2fa/registration/request?method=email`)));
        await vi.waitFor(() => expect(FormTestingUtilities.findInput(root, 'code')).not.toBeNull());
        FormTestingUtilities.type(root, 'code', '123456');
        await fixture.whenStable();
        FormTestingUtilities.click(root, 'Turn on');
        (await vi.waitFor(() => backend.expectOne(`${API}/2fa/registration/confirm?method=email`))).flush('', { status: 204, statusText: 'No Content' });

        (await vi.waitFor(() => backend.expectOne(`${API}/2fa/registrations`))).flush({ methods: ['email'] });
        await vi.waitFor(() => expect(getRows(root)[1]).toBe('Codes by email On Turn off'));
        expect(FormTestingUtilities.findInput(root, 'code')).toBeNull();
        expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('Turned on.');
    });

    test('turns a method off once the user confirmed it', async () => {
        const [root, fixture, backend] = await setup(['otp']);

        FormTestingUtilities.click(root, 'Turn off');
        const question: HTMLDialogElement = await vi.waitFor(() => document.querySelector('dialog') ?? Promise.reject(new Error('no question yet')));
        expect(FormTestingUtilities.getText(question, 'h2')).toBe('Turn off this second factor?');
        FormTestingUtilities.click(question, 'Turn off');

        const removal: TestRequest = await vi.waitFor(() => backend.expectOne({ method: 'DELETE', url: `${API}/2fa/registration/otp` }));
        removal.flush('', { status: 204, statusText: 'No Content' });
        (await vi.waitFor(() => backend.expectOne(`${API}/2fa/registrations`))).flush({ methods: [] });
        await fixture.whenStable();

        await vi.waitFor(() => expect(getRows(root)[0]).toBe('Authenticator app Off Set up'));
        expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('Turned off.');
    });
});