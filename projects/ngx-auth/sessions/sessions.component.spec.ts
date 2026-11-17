// the DialogService renders the question into the body, so the tests find it there.
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, Service } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { DialogTestingUtilities } from 'testing/dialog';
import { FormTestingUtilities } from 'testing/form';
import { HttpTestingUtilities } from 'testing/http';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { UserLogin } from 'zibri-contract';

import { SessionsComponent } from './sessions.component';

const API: string = 'https://api.example.com/auth';
const HOUR: number = 3_600_000;

@Service()
class AppAuthService extends AuthService {}

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

// this browser, and a phone the user lost.
const LOGINS: UserLogin[] = [
    {
        id: 'login-1',
        strategy: 'jwt',
        current: true,
        lastUsedAt: '2026-11-11T10:00:00.000Z',
        expiresAt: '2026-12-11T10:00:00.000Z',
        userAgent: 'Firefox on Linux',
        ipAddress: '203.0.113.1'
    },
    { id: 'login-2', strategy: 'jwt', current: false, expiresAt: '2026-12-01T10:00:00.000Z' }
];

function inMs(ms: number): string {
    return new Date(Date.now() + ms).toISOString();
}

// a user who logged in with tokens on another visit.
async function setup(): Promise<[HTMLElement, ComponentFixture<SessionsComponent>, HttpTestingController]> {
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
            provideRouter([{ path: '**', component: PageComponent }]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy: 'jwt' })
        ]
    });
    const fixture: ComponentFixture<SessionsComponent> = TestBed.createComponent(SessionsComponent);
    await fixture.whenStable();
    const backend: HttpTestingController = TestBed.inject(HttpTestingController);
    (await vi.waitFor(() => backend.expectOne(`${API}/logins`))).flush(LOGINS);
    const root: HTMLElement = fixture.nativeElement as HTMLElement;
    await vi.waitFor(() => expect(root.querySelectorAll('li')).toHaveLength(2));
    return [root, fixture, backend];
}

// each login as the user reads it: its browser, more about it, and its button.
function getRows(root: HTMLElement): string[] {
    return [...root.querySelectorAll('li')].map(item => [...item.querySelectorAll('p, button')].map(element => element.textContent.trim()).join(' | '));
}

describe('SessionsComponent', () => {
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

    test('lists where the user is logged in, and ends the login of another device', async () => {
        const [root, , backend] = await setup();
        // in the time zone of the browser
        const lastUsed: string = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date('2026-11-11T10:00:00.000Z'));
        expect(getRows(root)).toEqual([
            `Firefox on Linux | this device · last used on ${lastUsed} · 203.0.113.1 | Log out`,
            'Unknown browser |  | Log out'
        ]);

        FormTestingUtilities.click(root.querySelectorAll('li')[1] ?? root, 'Log out');
        HttpTestingUtilities.flushNoContent(await vi.waitFor(() => backend.expectOne({ method: 'DELETE', url: `${API}/logins/login-2` })));
        (await vi.waitFor(() => backend.expectOne(`${API}/logins`))).flush([LOGINS[0]]);

        await vi.waitFor(() => expect(root.querySelectorAll('li')).toHaveLength(1));
        expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('Logged out there.');
        expect(TestBed.inject(AppAuthService).loggedIn()).toBe(true);
    });

    test('logs out everywhere once the user confirmed it, this browser too', async () => {
        const [root, , backend] = await setup();

        FormTestingUtilities.click(root, 'Log out everywhere');
        const question: HTMLDialogElement = await vi.waitFor(() => document.querySelector('dialog') ?? Promise.reject(new Error('no question yet')));
        expect(FormTestingUtilities.getText(question, 'h2')).toBe('Log out everywhere?');
        FormTestingUtilities.click(question, 'Log out everywhere');
        HttpTestingUtilities.flushNoContent(await vi.waitFor(() => backend.expectOne({ method: 'POST', url: `${API}/logout-everywhere` })));

        await vi.waitFor(() => expect(TestBed.inject(AppAuthService).loggedIn()).toBe(false));
        expect(TestBed.inject(Router).url).toBe('/login');
    });
});