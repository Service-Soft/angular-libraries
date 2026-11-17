import { HttpClient, HttpContext, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { CachedRequest } from './cached-request.model';
import { OFFLINE_REQUEST_METADATA } from './offline-request-metadata.provider';
import { offlineInterceptor } from './offline.interceptor';
import { OfflineService } from './offline.service';

const TODO_CONTEXT: HttpContext = new HttpContext().set(OFFLINE_REQUEST_METADATA, { type: 'todo', displayValue: 'New todo' });

function setup(online: boolean): [HttpClient, HttpTestingController, OfflineService] {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([offlineInterceptor])), provideHttpClientTesting()] });
    return [TestBed.inject(HttpClient), TestBed.inject(HttpTestingController), TestBed.inject(OfflineService)];
}

describe('offlineInterceptor', () => {
    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        TestBed.inject(HttpTestingController).verify();
    });

    test('sends marked requests while online', async () => {
        const [http, backend, offlineService] = setup(true);

        const response: Promise<unknown> = firstValueFrom(http.post('/api/todos', { title: 'Buy milk' }, { context: TODO_CONTEXT }));
        backend.expectOne({ method: 'POST', url: '/api/todos' }).flush({ id: 1, title: 'Buy milk' });

        expect(await response).toEqual({ id: 1, title: 'Buy milk' });
        expect(offlineService.cachedRequests()).toEqual([]);
    });

    test('keeps a marked request while offline and answers it with the created entity right away', async () => {
        const [http, , offlineService] = setup(false);
        const todo: { title: string, dueAt: Date } = { title: 'Buy milk', dueAt: new Date('2026-11-12T09:00:00.000Z') };

        const response: HttpResponse<unknown> = await firstValueFrom(http.post('/api/todos', todo, { context: TODO_CONTEXT, observe: 'response' }));

        const [cached] = offlineService.cachedRequests();
        expect(response.status).toBe(202);
        expect(response.body).toEqual({ title: 'Buy milk', dueAt: '2026-11-12T09:00:00.000Z', id: cached.id });
        expect(cached).toEqual<CachedRequest>({
            id: expect.stringMatching(/^offline-/) as string,
            method: 'POST',
            url: '/api/todos',
            // the body the server gets, without the offline id
            body: { title: 'Buy milk', dueAt: '2026-11-12T09:00:00.000Z' },
            type: 'todo',
            idKey: 'id',
            displayValue: 'New todo'
        });
        // the object of the caller stays as it was
        expect(todo).toEqual({ title: 'Buy milk', dueAt: new Date('2026-11-12T09:00:00.000Z') });
    });

    test('answers a PATCH with its body and a DELETE with null', async () => {
        const [http, , offlineService] = setup(false);

        expect(await firstValueFrom(http.patch('/api/todos/5', { done: true }, { context: TODO_CONTEXT }))).toEqual({ done: true });
        expect(await firstValueFrom(http.delete('/api/todos/6', { context: TODO_CONTEXT }))).toBeNull();
        expect(offlineService.cachedRequests().map(request => `${request.method} ${request.url}`)).toEqual(['PATCH /api/todos/5', 'DELETE /api/todos/6']);
    });

    test('sends requests without metadata and GET requests while offline, which fail like without the library', () => {
        const [http, backend, offlineService] = setup(false);

        http.post('/api/login', { password: 'secret' }).subscribe({ error: () => undefined });
        http.get('/api/todos', { context: TODO_CONTEXT }).subscribe({ error: () => undefined });

        backend.expectOne({ method: 'POST', url: '/api/login' }).error(new ProgressEvent('error'));
        backend.expectOne({ method: 'GET', url: '/api/todos' }).error(new ProgressEvent('error'));
        expect(offlineService.cachedRequests()).toEqual([]);
    });
});