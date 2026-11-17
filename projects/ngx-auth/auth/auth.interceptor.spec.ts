import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component, Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { CookieAuthData, JwtAuthData } from 'zibri-contract';

import { AuthConfigChanges } from './auth-config-changes.model';
import { AuthStrategyName } from './auth-strategy-name.type';
import { authInterceptor } from './auth.interceptor';
import { provideAuth } from './auth.provider';
import { AuthService } from './auth.service';
import { LoginResult } from './login-result.model';
import { SecondFactorPrompt } from './second-factor-prompt.service';
import { SecondFactor } from './second-factor.model';

const API: string = 'https://api.example.com/auth';
const TASKS: string = 'https://api.example.com/tasks';
const HOUR: number = 3_600_000;

@Service()
class AppAuthService extends AuthService {}

// what the user answers when they are asked for a second factor. The real prompt is ui, in its own entry point.
@Service()
class CodePrompt extends SecondFactorPrompt {
    readonly askedFor: string[][] = [];

    override async resolveSecondFactor(methods: string[]): Promise<SecondFactor | undefined> {
        this.askedFor.push(methods);
        return await Promise.resolve({ method: 'otp', code: '654321' });
    }
}

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

function setup(strategy: AuthStrategyName, changes: Partial<AuthConfigChanges> = {}): [AppAuthService, HttpClient, HttpTestingController] {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([{ path: '**', component: PageComponent }]),
            provideHttpClient(withInterceptors([authInterceptor])),
            provideHttpClientTesting(),
            provideAuth(AppAuthService, { apiUrl: API, strategy, ...changes })
        ]
    });
    return [TestBed.inject(AppAuthService), TestBed.inject(HttpClient), TestBed.inject(HttpTestingController)];
}

function inMs(ms: number): string {
    return new Date(Date.now() + ms).toISOString();
}

function createJwtData(accessToken: string, accessExpiresInMs: number = HOUR): JwtAuthData<string> {
    return {
        userId: 'user-1',
        roles: ['user'],
        accessToken: { value: accessToken, expirationDate: inMs(accessExpiresInMs) },
        refreshToken: { value: `refresh-of-${accessToken}`, expirationDate: inMs(30 * 24 * HOUR) }
    };
}

function createCookieData(csrfToken: string): CookieAuthData<string> {
    return { userId: 'user-1', roles: ['user'], csrfToken, sessionExpirationDate: inMs(HOUR), refreshSessionExpirationDate: inMs(24 * HOUR) };
}

// what zibri answers a refused request with.
function refuse(request: TestRequest, status: number, name: string): void {
    request.flush({ status, name, message: 'Refused', paragraphs: ['Refused'] }, { status, statusText: 'Refused' });
}

async function expectRequest(backend: HttpTestingController, method: string, url: string): Promise<TestRequest> {
    return await vi.waitFor(() => backend.expectOne({ method, url }));
}

async function login(authService: AppAuthService, backend: HttpTestingController, data: JwtAuthData<string> | CookieAuthData<string>): Promise<void> {
    const loggedIn: Promise<LoginResult> = authService.login({ email: 'ada@example.com', password: 'secret' });
    const strategy: string = 'accessToken' in data ? 'jwt' : 'cookie';
    (await expectRequest(backend, 'POST', `${API}/login?authenticator=password&strategy=${strategy}`)).flush(data);
    await answerCurrentUser(backend);
    await loggedIn;
}

// a login and a refresh load the user right after.
async function answerCurrentUser(backend: HttpTestingController): Promise<void> {
    (await expectRequest(backend, 'GET', `${API}/me`))
        .flush({ id: 'user-1', email: 'ada@example.com', memberships: [{ tenantId: 'tenant-a', permissions: [] }], platformPermissions: [] });
}

/**
 * A DPoP proof, as zibri reads it.
 */
type DecodedProof = {
    header: { typ: string, alg: string, jwk: JsonWebKey },
    payload: Record<string, unknown>
};

function decodeBase64Url(text: string): Uint8Array<ArrayBuffer> {
    const binary: string = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    return Uint8Array.from(binary, character => character.codePointAt(0) ?? 0);
}

function decodeJson(text: string): unknown {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(text)));
}

// checks the signature of a proof with the key in its header, like zibri does, and answers what it says.
async function verifyProof(proof: string | null): Promise<DecodedProof> {
    const [header, payload, signature] = proof?.split('.') ?? [];
    if (header == undefined || payload == undefined || signature == undefined) {
        throw new Error(`No DPoP proof: ${proof}`);
    }
    const decoded: DecodedProof = { header: decodeJson(header) as DecodedProof['header'], payload: decodeJson(payload) as DecodedProof['payload'] };
    const key: CryptoKey = await crypto.subtle.importKey('jwk', decoded.header.jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    const valid: boolean = await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        key,
        decodeBase64Url(signature),
        new TextEncoder().encode(`${header}.${payload}`)
    );
    expect(valid).toBe(true);
    expect(decoded.header.alg).toBe('ES256');
    return decoded;
}

async function hashToken(token: string): Promise<string> {
    const hash: Uint8Array = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token)));
    return btoa(String.fromCodePoint(...hash)).replaceAll('+', '-')
        .replaceAll('/', '_')
        .replaceAll('=', '');
}

describe('authInterceptor', () => {
    afterEach(() => {
        localStorage.clear();
        TestBed.inject(HttpTestingController).verify();
    });

    test('sends the access token to the api, and to no other origin', async () => {
        const [authService, http, backend] = setup('jwt');
        await login(authService, backend, createJwtData('access-1'));

        void firstValueFrom(http.get(TASKS));
        void firstValueFrom(http.get('https://tracker.example.org/pixel'));

        expect((await expectRequest(backend, 'GET', TASKS)).request.headers.get('Authorization')).toBe('Bearer access-1');
        expect((await expectRequest(backend, 'GET', 'https://tracker.example.org/pixel')).request.headers.has('Authorization')).toBe(false);
    });

    test('refreshes an access token that runs out soon before the request', async () => {
        const [authService, http, backend] = setup('jwt');
        await login(authService, backend, createJwtData('access-1', 10_000));

        const tasks: Promise<object> = firstValueFrom(http.get(TASKS));
        (await expectRequest(backend, 'POST', `${API}/refresh-login?strategy=jwt`)).flush(createJwtData('access-2'));
        const request: TestRequest = await expectRequest(backend, 'GET', TASKS);
        expect(request.request.headers.get('Authorization')).toBe('Bearer access-2');
        request.flush([]);

        expect(await tasks).toEqual([]);
        await answerCurrentUser(backend);
    });

    test('sends the active tenant to the api, unless a request names its own', async () => {
        const [authService, http, backend] = setup('cookie');
        await login(authService, backend, createCookieData('csrf-1'));
        void firstValueFrom(http.get(TASKS));
        expect((await expectRequest(backend, 'GET', TASKS)).request.headers.has('x-tenant-id')).toBe(false);

        authService.setActiveTenant('tenant-a');
        void firstValueFrom(http.get(TASKS));
        void firstValueFrom(http.get(`${TASKS}/shared`, { headers: { 'x-tenant-id': 'tenant-b' } }));
        void firstValueFrom(http.get('https://tracker.example.org/pixel'));

        expect((await expectRequest(backend, 'GET', TASKS)).request.headers.get('x-tenant-id')).toBe('tenant-a');
        expect((await expectRequest(backend, 'GET', `${TASKS}/shared`)).request.headers.get('x-tenant-id')).toBe('tenant-b');
        expect((await expectRequest(backend, 'GET', 'https://tracker.example.org/pixel')).request.headers.has('x-tenant-id')).toBe(false);
    });

    test('refreshes and tries once more when the token is refused, and forgets a login it can\'t refresh', async () => {
        const [authService, http, backend] = setup('jwt');
        await login(authService, backend, createJwtData('access-1'));

        const tasks: Promise<object> = firstValueFrom(http.get(TASKS));
        refuse(await expectRequest(backend, 'GET', TASKS), 401, 'UnauthorizedError');
        (await expectRequest(backend, 'POST', `${API}/refresh-login?strategy=jwt`)).flush(createJwtData('access-2'));
        const retried: TestRequest = await expectRequest(backend, 'GET', TASKS);
        expect(retried.request.headers.get('Authorization')).toBe('Bearer access-2');
        retried.flush([]);
        expect(await tasks).toEqual([]);
        await answerCurrentUser(backend);

        const refused: Promise<object> = firstValueFrom(http.get(TASKS));
        refuse(await expectRequest(backend, 'GET', TASKS), 401, 'UnauthorizedError');
        refuse(await expectRequest(backend, 'POST', `${API}/refresh-login?strategy=jwt`), 401, 'UnauthorizedError');
        await expect(refused).rejects.toThrow();
        expect(authService.loggedIn()).toBe(false);
        expect(TestBed.inject(Router).url).toBe('/login');
    });

    test('keeps the login when a request is refused for its second factor', async () => {
        const [authService, http, backend] = setup('jwt');
        await login(authService, backend, createJwtData('access-1'));

        const account: Promise<object> = firstValueFrom(http.delete(TASKS));
        refuse(await expectRequest(backend, 'DELETE', TASKS), 401, 'InvalidTwoFactorCodeError');

        await expect(account).rejects.toThrow();
        expect(authService.loggedIn()).toBe(true);
    });

    test('asks for a second factor when a request needs one, and sends it again with it', async () => {
        const [authService, http, backend] = setup('jwt', { secondFactorPrompt: async () => await Promise.resolve(CodePrompt) });
        await login(authService, backend, createJwtData('access-1'));

        const deleted: Promise<object> = firstValueFrom(http.delete(TASKS));
        refuse(await expectRequest(backend, 'DELETE', TASKS), 401, 'SecondFactorMissingError');
        (await expectRequest(backend, 'GET', `${API}/2fa/registrations`)).flush({ methods: ['otp'] });
        const retried: TestRequest = await expectRequest(backend, 'DELETE', TASKS);
        expect(retried.request.headers.get('x-authorization-otp')).toBe('654321');
        retried.flush({});

        expect(await deleted).toEqual({});
        expect(TestBed.inject(CodePrompt).askedFor).toEqual([['otp']]);
        expect(authService.loggedIn()).toBe(true);
    });

    test('sends the cookies, the csrf token with changes only, and keeps the token a response renews', async () => {
        const [authService, http, backend] = setup('cookie');
        await login(authService, backend, createCookieData('csrf-1'));

        void firstValueFrom(http.get(TASKS));
        const read: TestRequest = await expectRequest(backend, 'GET', TASKS);
        expect(read.request.withCredentials).toBe(true);
        expect(read.request.headers.has('x-csrf-token')).toBe(false);
        // zibri renewed the session on the way, with a new token
        read.flush([], { headers: { 'x-csrf-token': 'csrf-2' } });

        void firstValueFrom(http.post(TASKS, { title: 'Water plants' }));
        const write: TestRequest = await expectRequest(backend, 'POST', TASKS);
        expect(write.request.headers.get('x-csrf-token')).toBe('csrf-2');
        write.flush({});
    });

    test('gets the csrf token from the server after a reload, and again when the server refuses it', async () => {
        const [authService, , backend] = setup('cookie');
        await login(authService, backend, createCookieData('csrf-1'));
        TestBed.resetTestingModule();
        const [, http, afterReload] = setup('cookie');

        const created: Promise<object> = firstValueFrom(http.post(TASKS, { title: 'Water plants' }));
        (await expectRequest(afterReload, 'GET', `${API}/csrf-token?strategy=cookie`)).flush({ csrfToken: 'csrf-2' });
        const write: TestRequest = await expectRequest(afterReload, 'POST', TASKS);
        expect(write.request.headers.get('x-csrf-token')).toBe('csrf-2');
        // another tab renewed the session meanwhile
        refuse(write, 403, 'CsrfTokenRefusedError');
        (await expectRequest(afterReload, 'GET', `${API}/csrf-token?strategy=cookie`)).flush({ csrfToken: 'csrf-3' });
        const retried: TestRequest = await expectRequest(afterReload, 'POST', TASKS);
        expect(retried.request.headers.get('x-csrf-token')).toBe('csrf-3');
        retried.flush({});

        expect(await created).toEqual({});
    });

    test('proves the key of the browser with every request of a DPoP login, the access token with its scheme', async () => {
        const [authService, http, backend] = setup('jwt', { dpop: true });
        const loggedIn: Promise<LoginResult> = authService.login({ email: 'ada@example.com', password: 'secret' });
        const loginRequest: TestRequest = await expectRequest(backend, 'POST', `${API}/login?authenticator=password&strategy=jwt`);
        const loginProof: DecodedProof = await verifyProof(loginRequest.request.headers.get('DPoP'));
        expect(loginProof.header.typ).toBe('dpop+jwt');
        expect(loginProof.payload).toMatchObject({ htm: 'POST', htu: `${API}/login` });
        expect(loginProof.payload['ath']).toBeUndefined();
        loginRequest.flush(createJwtData('access-1'));
        await answerCurrentUser(backend);
        await loggedIn;

        void firstValueFrom(http.get(`${TASKS}?page=2#top`));
        const tasks: TestRequest = await expectRequest(backend, 'GET', `${TASKS}?page=2#top`);
        expect(tasks.request.headers.get('Authorization')).toBe('DPoP access-1');
        const tasksProof: DecodedProof = await verifyProof(tasks.request.headers.get('DPoP'));
        // the url without its query and fragment, the hash of the token, and the same key with a proof of its own
        expect(tasksProof.payload).toMatchObject({ htm: 'GET', htu: TASKS, ath: await hashToken('access-1') });
        expect(tasksProof.header.jwk).toEqual(loginProof.header.jwk);
        expect(tasksProof.payload['jti']).not.toBe(loginProof.payload['jti']);
        tasks.flush([]);
    });

    test('sends a request once more with the nonce zibri wants, and signs the next ones with it', async () => {
        const [authService, http, backend] = setup('jwt', { dpop: true });
        await login(authService, backend, createJwtData('access-1'));

        const tasks: Promise<object> = firstValueFrom(http.get(TASKS));
        (await expectRequest(backend, 'GET', TASKS)).flush(
            { error: 'use_dpop_nonce', error_description: 'The DPoP proof carries no nonce the application issued.' },
            { status: 401, statusText: 'Unauthorized', headers: { 'DPoP-Nonce': 'nonce-1' } }
        );
        const retried: TestRequest = await expectRequest(backend, 'GET', TASKS);
        expect((await verifyProof(retried.request.headers.get('DPoP'))).payload['nonce']).toBe('nonce-1');
        retried.flush([], { headers: { 'DPoP-Nonce': 'nonce-2' } });
        expect(await tasks).toEqual([]);

        void firstValueFrom(http.get(TASKS));
        const next: TestRequest = await expectRequest(backend, 'GET', TASKS);
        expect((await verifyProof(next.request.headers.get('DPoP'))).payload['nonce']).toBe('nonce-2');
        next.flush([]);
        // the login stays: the nonce was all that was missing
        expect(authService.loggedIn()).toBe(true);
    });

    test('binds the next login to a new key', async () => {
        const [authService, http, backend] = setup('jwt', { dpop: true });
        await login(authService, backend, createJwtData('access-1'));
        void firstValueFrom(http.get(TASKS));
        const before: TestRequest = await expectRequest(backend, 'GET', TASKS);
        const firstKey: JsonWebKey = (await verifyProof(before.request.headers.get('DPoP'))).header.jwk;
        before.flush([]);

        await authService.forgetLogin();
        await login(authService, backend, createJwtData('access-2'));
        void firstValueFrom(http.get(TASKS));
        const after: TestRequest = await expectRequest(backend, 'GET', TASKS);
        expect((await verifyProof(after.request.headers.get('DPoP'))).header.jwk).not.toEqual(firstKey);
        after.flush([]);
    });

    test('ends the login on a status of logoutStatuses', async () => {
        const [authService, http, backend] = setup('jwt', { logoutStatuses: [401, 403] });
        await login(authService, backend, createJwtData('access-1'));

        const refused: Promise<object> = firstValueFrom(http.get(TASKS));
        refuse(await expectRequest(backend, 'GET', TASKS), 403, 'AccountDeactivatedError');

        await expect(refused).rejects.toThrow();
        expect(authService.loggedIn()).toBe(false);
    });
});
describe('provideAuth with DPoP', () => {
    test('refuses DPoP without the jwt strategy, which has no tokens to bind', () => {
        expect(() => provideAuth(AppAuthService, { apiUrl: API, strategy: 'cookie', dpop: true }))
            .toThrow('DPoP binds the tokens of a jwt login to a key, so it needs the strategy \'jwt\'.');
    });
});