import { HttpClient, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { inject, InjectionToken, signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OfflineService, provideOfflineConfig } from '@service-soft/ngx-pwa/offline';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { provideOfflineCache } from './offline-cache-config.provider';
import { offlineCacheInterceptor } from './offline-cache.interceptor';
import { OfflineCacheService } from './offline-cache.service';

const USERS: string = 'https://api.example.com/users';
const DAY: number = 24 * 60 * 60 * 1000;

// who is logged in and the tenant they act in, like the AuthService of ngx-auth tells them.
const USER: InjectionToken<WritableSignal<string | undefined>> = new InjectionToken('USER', { providedIn: 'root', factory: () => signal('ada') });
const TENANT: InjectionToken<WritableSignal<string | undefined>> = new InjectionToken('TENANT', { providedIn: 'root', factory: () => signal('tenant-a') });

function setup(): [HttpClient, HttpTestingController] {
    TestBed.configureTestingModule({
        providers: [
            provideHttpClient(withInterceptors([offlineCacheInterceptor])),
            provideHttpClientTesting(),
            provideOfflineConfig({ headers: { 'x-tenant-id': () => inject(TENANT)() }, scope: () => inject(USER)() }),
            provideOfflineCache({ urls: ['https://api.example.com/'], maxAgeInMs: 7 * DAY })
        ]
    });
    return [TestBed.inject(HttpClient), TestBed.inject(HttpTestingController)];
}

// a GET request of the app, answered by the server, or failing like without a connection.
async function load(
    http: HttpClient,
    backend: HttpTestingController,
    answer: string[] | 'unreachable',
    headers: Record<string, string> = {}
): Promise<HttpResponse<unknown>> {
    const response: Promise<HttpResponse<unknown>> = firstValueFrom(http.get(USERS, { observe: 'response', headers }));
    const request: TestRequest = backend.expectOne(USERS);
    if (answer === 'unreachable') {
        request.error(new ProgressEvent('error'));
    }
    else {
        request.flush(answer);
    }
    return await response;
}

describe('offlineCacheInterceptor', () => {
    afterEach(() => {
        vi.useRealTimers();
        TestBed.inject(HttpTestingController).verify();
    });

    test('asks the server first, always, and gives the last answer only while it can\'t be reached', async () => {
        const [http, backend] = setup();
        const offlineService: OfflineService = TestBed.inject(OfflineService);
        await load(http, backend, ['Ada']);
        // nothing old while the server answers
        expect((await load(http, backend, ['Ada', 'Grace'])).body).toEqual(['Ada', 'Grace']);
        expect(offlineService.cachedSince()).toBeUndefined();

        const cached: HttpResponse<unknown> = await load(http, backend, 'unreachable');
        expect(cached.status).toBe(200);
        expect(cached.body).toEqual(['Ada', 'Grace']);
        const loadedAt: string | null = cached.headers.get('X-Offline-Cache-Loaded-At');
        expect(Date.parse(loadedAt ?? '')).toBeLessThanOrEqual(Date.now());
        expect(offlineService.cachedSince()?.toISOString()).toBe(loadedAt);

        // the answer of the service worker of Angular when it can't reach the server
        const fromWorker: Promise<unknown> = firstValueFrom(http.get(USERS));
        backend.expectOne(USERS).flush('', { status: 504, statusText: 'Gateway Timeout' });
        expect(await fromWorker).toEqual(['Ada', 'Grace']);
        // the server refused it: that is its answer
        const refused: Promise<unknown> = firstValueFrom(http.get(USERS));
        backend.expectOne(USERS).flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
        await expect(refused).rejects.toThrow();

        await load(http, backend, ['Ada', 'Grace']);
        expect(offlineService.cachedSince()).toBeUndefined();
    });

    test('gives an answer only to the user and the tenant it was loaded for', async () => {
        const [http, backend] = setup();
        await load(http, backend, ['Ada of A']);

        TestBed.inject(TENANT).set('tenant-b');
        await expect(load(http, backend, 'unreachable')).rejects.toThrow();
        await load(http, backend, ['Ada of B']);
        TestBed.inject(TENANT).set('tenant-a');
        expect((await load(http, backend, 'unreachable')).body).toEqual(['Ada of A']);
        // a request that names its tenant itself
        expect((await load(http, backend, 'unreachable', { 'x-tenant-id': 'tenant-b' })).body).toEqual(['Ada of B']);

        // somebody else logged in on the same device
        TestBed.inject(USER).set('grace');
        await expect(load(http, backend, 'unreachable')).rejects.toThrow();
    });

    test('keeps nothing of other urls and methods, gives no answer older than maxAgeInMs, and deletes every answer with clearCache', async () => {
        const [http, backend] = setup();
        const other: Promise<unknown> = firstValueFrom(http.get('https://tracker.example.org/pixel'));
        backend.expectOne('https://tracker.example.org/pixel').flush({});
        await other;
        const failedOther: Promise<unknown> = firstValueFrom(http.get('https://tracker.example.org/pixel'));
        backend.expectOne('https://tracker.example.org/pixel').error(new ProgressEvent('error'));
        await expect(failedOther).rejects.toThrow();
        const created: Promise<unknown> = firstValueFrom(http.post(USERS, { name: 'Ada' }));
        backend.expectOne(USERS).error(new ProgressEvent('error'));
        await expect(created).rejects.toThrow();

        vi.useFakeTimers({ toFake: ['Date'] });
        await load(http, backend, ['Ada']);
        vi.setSystemTime(Date.now() + (7 * DAY) - 1);
        expect((await load(http, backend, 'unreachable')).body).toEqual(['Ada']);
        vi.setSystemTime(Date.now() + 1);
        await expect(load(http, backend, 'unreachable')).rejects.toThrow();

        await load(http, backend, ['Ada']);
        // like at a logout
        await TestBed.inject(OfflineCacheService).clearCache();
        await expect(load(http, backend, 'unreachable')).rejects.toThrow();
    });
});