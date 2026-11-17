// the DialogService renders the question into the body, so the tests find it there.
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Service } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, LinkedIdentity, provideAuth } from '@service-soft/ngx-auth/auth';
import { DialogTestingUtilities } from 'testing/dialog';
import { FormTestingUtilities } from 'testing/form';
import { HttpTestingUtilities } from 'testing/http';
import { AddedPasskeyDevice, PasskeyTestingUtilities } from 'testing/passkey';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { provideIdentitiesConfig } from './identities-config.provider';
import { IdentitiesComponent } from './identities.component';
import { IdentityProvider } from './identity-provider.model';

const API: string = 'https://api.example.com/auth';
const HOUR: number = 3_600_000;

@Service()
class AppAuthService extends AuthService {}

// an account at google, and a passkey.
const IDENTITIES: LinkedIdentity[] = [
    { authenticator: 'google', identity: { id: 'identity-1', forLogin: true } },
    { authenticator: 'passkey', identity: { id: 'identity-2', createdAt: '2026-11-11T10:00:00.000Z' } }
];

function inMs(ms: number): string {
    return new Date(Date.now() + ms).toISOString();
}

// a user who logged in with tokens on another visit, and has the given identities.
async function setup(
    identities: LinkedIdentity[],
    providers: IdentityProvider[] = [{ authenticator: 'google', name: 'Google' }, { authenticator: 'github', name: 'GitHub' }]
): Promise<[HTMLElement, ComponentFixture<IdentitiesComponent>, HttpTestingController]> {
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
            provideAuth(AppAuthService, { apiUrl: API, strategy: 'jwt' }),
            provideIdentitiesConfig({ providers, passkeyAuthenticator: 'passkey' })
        ]
    });
    const fixture: ComponentFixture<IdentitiesComponent> = TestBed.createComponent(IdentitiesComponent);
    await fixture.whenStable();
    const backend: HttpTestingController = TestBed.inject(HttpTestingController);
    (await vi.waitFor(() => backend.expectOne(`${API}/identities`))).flush(identities);
    const root: HTMLElement = fixture.nativeElement as HTMLElement;
    // the providers to connect only show once zibri answered which ones the user has
    await vi.waitFor(() => expect(root.textContent).toContain('Connect'));
    return [root, fixture, backend];
}

// each way to log in as the user reads it: its name, more about it, and its button.
function getRows(root: HTMLElement): string[] {
    return [...root.querySelectorAll('li')].map(item => item.textContent.replaceAll(/\s+/g, ' ').trim());
}

describe('IdentitiesComponent', () => {
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

    test('lists the ways to log in, and offers to connect the providers the user hasn\'t yet', async () => {
        const [root] = await setup(IDENTITIES);

        expect(FormTestingUtilities.getText(root, 'h2')).toBe('Ways to log in');
        expect(getRows(root)).toEqual(['Google Remove', 'Passkey added on Nov 11, 2026 Remove']);
        expect([...root.querySelectorAll('div > button')].map(button => button.textContent.trim())).toEqual(['Connect GitHub', 'Add a passkey']);
    });

    test('adds a passkey under the email of the user', async () => {
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
            const [root, , backend] = await setup([]);

            FormTestingUtilities.click(root, 'Add a passkey');
            const request: TestRequest = await vi.waitFor(() => backend.expectOne(`${API}/link-identity/request?authenticator=passkey`));
            expect(request.request.body).toEqual({ name: 'ada@example.com' });
            request.flush({ challenge: 'challenge-1' });
            const confirm: TestRequest = await vi.waitFor(() => backend.expectOne(`${API}/link-identity/confirm?authenticator=passkey`));
            expect(confirm.request.body).toEqual({ response: attestation });
            HttpTestingUtilities.flushNoContent(confirm);
            (await vi.waitFor(() => backend.expectOne(`${API}/identities`))).flush([IDENTITIES[1]]);

            await vi.waitFor(() => expect(getRows(root)).toEqual(['Passkey added on Nov 11, 2026 Remove']));
            expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('Passkey added.');
        }
        finally {
            device.remove();
        }
    });

    test('removes a way to log in once the user confirmed it', async () => {
        const [root, fixture, backend] = await setup(IDENTITIES);

        FormTestingUtilities.click(root.querySelectorAll('li')[0] ?? root, 'Remove');
        const question: HTMLDialogElement = await vi.waitFor(() => document.querySelector('dialog') ?? Promise.reject(new Error('no question yet')));
        expect(FormTestingUtilities.getText(question, 'h2')).toBe('Remove this way to log in?');
        FormTestingUtilities.click(question, 'Remove');

        HttpTestingUtilities.flushNoContent(await vi.waitFor(() => backend.expectOne({ method: 'DELETE', url: `${API}/identities/identity-1` })));
        (await vi.waitFor(() => backend.expectOne(`${API}/identities`))).flush([IDENTITIES[1]]);
        await fixture.whenStable();

        await vi.waitFor(() => expect(getRows(root)).toEqual(['Passkey added on Nov 11, 2026 Remove']));
        expect(FormTestingUtilities.getText(root, '[role="status"]')).toBe('Removed.');
        // google is not connected anymore, so it can be again
        expect(FormTestingUtilities.getText(root, 'div > button')).toBe('Connect Google');
    });

    test('asks a connected provider for access to its apis it hasn\'t granted, and connects others with their scopes', async () => {
        const calendar: string = 'https://www.googleapis.com/auth/calendar.readonly';
        const [root, , backend] = await setup(
            [{ authenticator: 'google', identity: { id: 'identity-1', forLogin: false, grantedScopes: ['openid'] } }],
            [
                { authenticator: 'google', name: 'Google', apiAccess: [{ label: 'Allow access to your calendar', scopes: [calendar] }] },
                { authenticator: 'github', name: 'GitHub', apiScopes: ['repo'] }
            ]
        );
        expect(getRows(root)).toEqual(['Google for its apis only Allow access to your calendar Remove']);

        FormTestingUtilities.click(root.querySelectorAll('li')[0] ?? root, 'Allow access to your calendar');
        const grant: TestRequest = await vi.waitFor(() => backend.expectOne(`${API}/link-identity/request?authenticator=google`));
        // the scopes it granted stay, and so does whether the user logs in with it
        expect(grant.request.body).toEqual({ redirectTo: document.location.href, forLogin: false, scopes: ['openid', calendar] });
        grant.flush({ url: '#at-google' });

        await vi.waitFor(() => expect(document.location.hash).toBe('#at-google'));
        FormTestingUtilities.click(root, 'Connect GitHub');
        const connect: TestRequest = await vi.waitFor(() => backend.expectOne(`${API}/link-identity/request?authenticator=github`));
        expect(connect.request.body).toEqual({ redirectTo: document.location.href, forLogin: true, scopes: ['repo'] });
        connect.flush({ url: '#at-github' });
        await vi.waitFor(() => expect(document.location.hash).toBe('#at-github'));
    });
});