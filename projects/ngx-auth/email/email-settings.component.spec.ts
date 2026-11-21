import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Service } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { clearTranslations, loadTranslations } from '@angular/localize';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { FormTestingUtilities } from 'testing/form';
import { HttpTestingUtilities } from 'testing/http';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { EmailSettingsComponent } from './email-settings.component';

const API: string = 'https://api.example.com/auth';
const HOUR: number = 3_600_000;

@Service()
class AppAuthService extends AuthService {}

function inMs(ms: number): string {
    return new Date(Date.now() + ms).toISOString();
}

// a user who logged in with tokens on another visit, and hasn't verified their email.
async function setup(): Promise<[HTMLElement, ComponentFixture<EmailSettingsComponent>, HttpTestingController]> {
    localStorage.setItem('authData', JSON.stringify({
        strategy: 'jwt',
        userId: 'user-1',
        roles: [],
        expiresAt: inMs(24 * HOUR),
        accessToken: { value: 'access-1', expirationDate: inMs(HOUR) },
        refreshToken: { value: 'refresh-1', expirationDate: inMs(24 * HOUR) },
        user: { id: 'user-1', email: 'ada@example.com', memberships: [], platformPermissions: [] }
    }));
    TestBed.configureTestingModule({
        providers: [
            provideRouter([]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy: 'jwt' })
        ]
    });
    const fixture: ComponentFixture<EmailSettingsComponent> = TestBed.createComponent(EmailSettingsComponent);
    await fixture.whenStable();
    return [fixture.nativeElement as HTMLElement, fixture, TestBed.inject(HttpTestingController)];
}

describe('EmailSettingsComponent', () => {
    afterEach(() => {
        localStorage.clear();
        clearTranslations();
        TestBed.inject(HttpTestingController).verify();
    });

    test('shows the email of the user, and mails a link to verify it while it isn\'t', async () => {
        const [root, , backend] = await setup();
        expect(root.querySelector('p')?.textContent.replaceAll(/\s+/g, ' ').trim()).toBe('ada@example.com not verified yet');

        FormTestingUtilities.click(root, 'Send a link to verify it');
        HttpTestingUtilities.flushNoContent(await vi.waitFor(() => backend.expectOne({ method: 'POST', url: `${API}/request-email-verification` })));

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('We sent you a link to verify your email address.'));
    });

    test('mails the link of a change to the new email, and empties the input', async () => {
        const [root, fixture, backend] = await setup();

        FormTestingUtilities.type(root, 'new-email', 'ada@example.org');
        await fixture.whenStable();
        FormTestingUtilities.click(root, 'Change email address');
        const request: TestRequest = await vi.waitFor(() => backend.expectOne({ method: 'POST', url: `${API}/request-email-change` }));
        expect(request.request.body).toEqual({ newEmail: 'ada@example.org' });
        HttpTestingUtilities.flushNoContent(request);

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toContain('We sent a link to ada@example.org.'));
        expect(FormTestingUtilities.findInput(root, 'new-email')?.value).toBe('');
    });

    test('shows the translations an app loaded at runtime, with the new email in its place', async () => {
        loadTranslations({
            'ngx-auth.email.change': 'E-Mail-Adresse ändern',
            'ngx-auth.email.changeRequested': 'Wir haben einen Link an {$newEmail} geschickt.'
        });
        const [root, fixture, backend] = await setup();

        FormTestingUtilities.type(root, 'new-email', 'ada@example.org');
        await fixture.whenStable();
        FormTestingUtilities.click(root, 'E-Mail-Adresse ändern');
        HttpTestingUtilities.flushNoContent(await vi.waitFor(() => backend.expectOne({ method: 'POST', url: `${API}/request-email-change` })));

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('Wir haben einen Link an ada@example.org geschickt.'));
    });
});