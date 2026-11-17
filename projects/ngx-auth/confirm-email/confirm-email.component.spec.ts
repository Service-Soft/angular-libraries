import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { FormTestingUtilities } from 'testing/form';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { EmailConfirmation } from 'zibri-contract';

import { ConfirmEmailComponent } from './confirm-email.component';

const API: string = 'https://api.example.com/auth';

@Service()
class AppAuthService extends AuthService {}

// opens the link of the email, which zibri ends with the token, and answers it.
async function open(confirmation: EmailConfirmation): Promise<HTMLElement> {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([{ path: 'verify-email/:token', component: ConfirmEmailComponent }]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy: 'cookie' })
        ]
    });
    const harness: RouterTestingHarness = await RouterTestingHarness.create('/verify-email/token-1');
    const request: TestRequest = await vi.waitFor(() => TestBed.inject(HttpTestingController).expectOne({ method: 'POST', url: `${API}/confirm-email` }));
    expect(request.request.body).toEqual({ token: 'token-1' });
    request.flush(confirmation);
    const root: HTMLElement = harness.fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).not.toBe(''));
    return root;
}

describe('ConfirmEmailComponent', () => {
    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
    });

    test('verifies the email of the link, and leads on to the login', async () => {
        const root: HTMLElement = await open({ purpose: 'verification', completed: true });

        expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('Your email address is verified.');
        expect(root.querySelector('a')?.getAttribute('href')).toBe('/login');
    });

    test('says when a change waits for the link to the other email', async () => {
        const root: HTMLElement = await open({ purpose: 'change', completed: false });

        expect(FormTestingUtilities.getText(root, '[role="status"]')).toContain('waits for you to follow the link we sent to your other email');
    });
});