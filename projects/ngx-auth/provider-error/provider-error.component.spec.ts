import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { FormTestingUtilities } from 'testing/form';
import { afterEach, describe, expect, test } from 'vitest';

import { ProviderErrorComponent } from './provider-error.component';

@Service()
class AppAuthService extends AuthService {}

async function open(url: string): Promise<HTMLElement> {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([{ path: 'login-failed', component: ProviderErrorComponent }]),
            provideHttpClient(),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: 'https://api.example.com/auth', strategy: 'cookie' })
        ]
    });
    const harness: RouterTestingHarness = await RouterTestingHarness.create(url);
    return harness.fixture.nativeElement as HTMLElement;
}

describe('ProviderErrorComponent', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('says what went wrong by the error of zibri, and leads back to the login', async () => {
        const root: HTMLElement = await open('/login-failed?error=cancelled');

        expect(FormTestingUtilities.getText(root, 'p')).toBe('You didn\'t allow the login at the provider.');
        expect(root.querySelector('a')?.getAttribute('href')).toBe('/login');
    });

    test('answers an error it has no text for with the one of failed, and leads a logged in user into the app', async () => {
        localStorage.setItem('authData', JSON.stringify({
            strategy: 'cookie',
            userId: 'user-1',
            roles: [],
            expiresAt: new Date(Date.now() + 3_600_000).toISOString()
        }));
        const root: HTMLElement = await open('/login-failed?error=something_new');

        expect(FormTestingUtilities.getText(root, 'p')).toBe('Logging in didn\'t work. Please try again later.');
        expect(root.querySelector('a')?.getAttribute('href')).toBe('/');
    });
});