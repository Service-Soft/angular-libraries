import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { FormTestingUtilities } from 'testing/form';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { RequestPasswordResetComponent } from './request-password-reset.component';

const API: string = 'https://api.example.com/auth';

@Service()
class AppAuthService extends AuthService {}

async function setup(): Promise<[HTMLElement, RouterTestingHarness, HttpTestingController]> {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([{ path: 'request-password-reset', component: RequestPasswordResetComponent }]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy: 'cookie' })
        ]
    });
    const harness: RouterTestingHarness = await RouterTestingHarness.create('/request-password-reset');
    return [harness.fixture.nativeElement as HTMLElement, harness, TestBed.inject(HttpTestingController)];
}

async function requestLink(root: HTMLElement, harness: RouterTestingHarness, backend: HttpTestingController): Promise<TestRequest> {
    FormTestingUtilities.type(root, 'email', 'ada@example.com');
    await harness.fixture.whenStable();
    FormTestingUtilities.click(root, 'Send link');
    return await vi.waitFor(() => backend.expectOne({ method: 'POST', url: `${API}/request-password-reset` }));
}

describe('RequestPasswordResetComponent', () => {
    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
    });

    test('has zibri mail a link, and says so without telling whether the email has an account', async () => {
        const [root, harness, backend] = await setup();
        expect(root.querySelector('a')?.getAttribute('href')).toBe('/login');

        const request: TestRequest = await requestLink(root, harness, backend);
        expect(request.request.body).toEqual({ email: 'ada@example.com' });
        request.flush('', { status: 204, statusText: 'No Content' });

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="status"]')).toContain('If an account belongs to this email'));
    });

    test('shows what zibri answered a refused request with, like too many of them', async () => {
        const [root, harness, backend] = await setup();

        (await requestLink(root, harness, backend)).flush(
            { status: 429, name: 'TooManyRequestsError', message: 'Too many requests.', paragraphs: ['Too many requests. Try again in a minute.'] },
            { status: 429, statusText: 'Too Many Requests' }
        );

        await vi.waitFor(() => expect(FormTestingUtilities.getText(root, '[role="alert"]')).toBe('Too many requests. Try again in a minute.'));
        expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('');
    });
});