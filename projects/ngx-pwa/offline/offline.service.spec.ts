import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { CachedRequest } from './cached-request.model';
import { OFFLINE_REQUEST_METADATA } from './offline-request-metadata.provider';
import { offlineInterceptor } from './offline.interceptor';
import { OfflineService } from './offline.service';

/**
 * A todo, as the server has it.
 */
type Todo = {
    id: number | string,
    title: string,
    done?: boolean
};

const TODO_CONTEXT: HttpContext = new HttpContext().set(OFFLINE_REQUEST_METADATA, { type: 'todo' });
const ITEM_CONTEXT: HttpContext = new HttpContext().set(OFFLINE_REQUEST_METADATA, { type: 'item' });

function setConnection(online: boolean): void {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

function setup(online: boolean = false): [OfflineService, HttpClient, HttpTestingController] {
    setConnection(online);
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([offlineInterceptor])), provideHttpClientTesting()] });
    return [TestBed.inject(OfflineService), TestBed.inject(HttpClient), TestBed.inject(HttpTestingController)];
}

// the app makes its requests while offline, through the interceptor like in a real app.
async function createTodoOffline(http: HttpClient, title: string): Promise<Todo> {
    return await firstValueFrom(http.post<Todo>('/api/todos', { title }, { context: TODO_CONTEXT }));
}

// the next request of a sync is sent once the one before was answered.
async function expectRequest(backend: HttpTestingController, method: string, url: string): Promise<TestRequest> {
    return await vi.waitFor(() => backend.expectOne({ method, url }));
}

describe('OfflineService', () => {
    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        TestBed.inject(HttpTestingController).verify();
    });

    test('follows the connection of the browser', () => {
        const [offlineService] = setup(true);
        expect(offlineService.offline()).toBe(false);

        setConnection(false);
        expect(offlineService.offline()).toBe(true);
        setConnection(true);
        expect(offlineService.offline()).toBe(false);
    });

    test('keeps the requests in the browser, so they are still there after a reload, and sees the ones of other tabs', async () => {
        const [, http] = setup();
        await createTodoOffline(http, 'Buy milk');

        TestBed.resetTestingModule();
        const [afterReload] = setup();
        expect(afterReload.cachedRequests().map(request => request.body)).toEqual([{ title: 'Buy milk' }]);

        // another tab of the app kept a second one
        const otherTab: CachedRequest = { ...afterReload.cachedRequests()[0], id: 'offline-other', body: { title: 'Call mom' } };
        localStorage.setItem('offlineRequests', JSON.stringify([...afterReload.cachedRequests(), otherTab]));
        window.dispatchEvent(new StorageEvent('storage', { key: 'offlineRequests' }));
        expect(afterReload.cachedRequests().map(request => request.body)).toEqual([{ title: 'Buy milk' }, { title: 'Call mom' }]);
    });

    test('applies the changes made offline to the entities of their type, matching the id exactly', async () => {
        const [offlineService, http] = setup();
        const loaded: Todo[] = [{ id: 1, title: 'Water plants' }, { id: 11, title: 'Pay rent' }, { id: 12, title: 'Clean up' }];
        const created: Todo = await createTodoOffline(http, 'Buy milk');
        await firstValueFrom(http.patch(`/api/todos/${created.id}`, { done: true }, { context: TODO_CONTEXT }));
        await firstValueFrom(http.patch('/api/todos/11', { done: true }, { context: TODO_CONTEXT }));
        await firstValueFrom(http.delete('/api/todos/12', { context: TODO_CONTEXT }));
        // an entity that isn't loaded, like one of another page, changes nothing
        await firstValueFrom(http.delete('/api/todos/99', { context: TODO_CONTEXT }));
        await firstValueFrom(http.post('/api/items', { name: 'Milk' }, { context: ITEM_CONTEXT }));

        expect(offlineService.applyOfflineData('todo', loaded)).toEqual([
            { id: 1, title: 'Water plants' },
            { id: 11, title: 'Pay rent', done: true },
            { id: created.id, title: 'Buy milk', done: true }
        ]);
        expect(loaded).toEqual([{ id: 1, title: 'Water plants' }, { id: 11, title: 'Pay rent' }, { id: 12, title: 'Clean up' }]);
    });

    test('syncs every request once, oldest first, and gives the later ones the id the server created', async () => {
        const [offlineService, http, backend] = setup();
        const created: Todo = await createTodoOffline(http, 'Buy milk');
        await firstValueFrom(http.patch(`/api/todos/${created.id}`, { done: true }, { context: TODO_CONTEXT }));
        await firstValueFrom(http.post('/api/items', { todoId: created.id, name: 'Milk' }, { context: ITEM_CONTEXT }));
        await firstValueFrom(http.delete('/api/todos/3', { context: TODO_CONTEXT }));
        setConnection(true);

        const synced: Promise<void> = offlineService.syncAll();
        const post: TestRequest = await expectRequest(backend, 'POST', '/api/todos');
        expect(post.request.body).toEqual({ title: 'Buy milk' });
        post.flush({ id: 7, title: 'Buy milk' });
        (await expectRequest(backend, 'PATCH', '/api/todos/7')).flush({ id: 7, title: 'Buy milk', done: true });
        const item: TestRequest = await expectRequest(backend, 'POST', '/api/items');
        // the id keeps the type the server gave it
        expect(item.request.body).toEqual({ todoId: 7, name: 'Milk' });
        item.flush({ id: 1, todoId: 7, name: 'Milk' });
        (await expectRequest(backend, 'DELETE', '/api/todos/3')).flush({});
        await synced;

        expect(offlineService.cachedRequests()).toEqual([]);
        expect(localStorage.getItem('offlineRequests')).toBe('[]');
    });

    test('stops at the first request that fails, keeps it and every later one, and never sends one twice', async () => {
        const [offlineService, http, backend] = setup();
        await createTodoOffline(http, 'Buy milk');
        await createTodoOffline(http, 'Pay rent');
        await createTodoOffline(http, 'Call mom');
        setConnection(true);

        const synced: Promise<void> = offlineService.syncAll();
        (await expectRequest(backend, 'POST', '/api/todos')).flush({ id: 1, title: 'Buy milk' });
        (await expectRequest(backend, 'POST', '/api/todos')).flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
        await expect(synced).rejects.toThrow();
        expect(offlineService.cachedRequests().map(request => request.body)).toEqual([{ title: 'Pay rent' }, { title: 'Call mom' }]);

        // the retry starts with the one that failed
        const retried: Promise<void> = offlineService.syncAll();
        const payRent: TestRequest = await expectRequest(backend, 'POST', '/api/todos');
        expect(payRent.request.body).toEqual({ title: 'Pay rent' });
        payRent.flush({ id: 2, title: 'Pay rent' });
        (await expectRequest(backend, 'POST', '/api/todos')).flush({ id: 3, title: 'Call mom' });
        await retried;
        expect(offlineService.cachedRequests()).toEqual([]);
    });

    test('syncs a single request only once the entity it uses was synced', async () => {
        const [offlineService, http, backend] = setup();
        const created: Todo = await createTodoOffline(http, 'Buy milk');
        await firstValueFrom(http.patch(`/api/todos/${created.id}`, { done: true }, { context: TODO_CONTEXT }));
        setConnection(true);
        const [post, patch] = offlineService.cachedRequests();

        expect(offlineService.hasUnresolvedDependency(post)).toBe(false);
        expect(offlineService.hasUnresolvedDependency(patch)).toBe(true);
        await expect(offlineService.sync(patch)).rejects.toThrow('Sync the request that creates it first');
        backend.expectNone({ method: 'PATCH' });

        const synced: Promise<void> = offlineService.sync(post);
        (await expectRequest(backend, 'POST', '/api/todos')).flush({ id: 7, title: 'Buy milk' });
        await synced;
        const [patchWithId] = offlineService.cachedRequests();
        expect(patchWithId.url).toBe('/api/todos/7');
        expect(offlineService.hasUnresolvedDependency(patchWithId)).toBe(false);
    });

    test('takes over the changes the package before kept, with their offline ids, and syncs them', async () => {
        // what the package before stored: serialized HttpRequests, a POST with its offline id in the body, html to show
        localStorage.setItem('requests', JSON.stringify([
            {
                request: { method: 'POST', url: '/api/todos', urlWithParams: '/api/todos', body: { title: 'Buy milk', id: 'offline 1b2c' }, headers: {} },
                metadata: { idKey: 'id', type: 'todo', displayValue: '<b style="color: green;">POST</b> /api/todos' }
            },
            {
                request: { method: 'PATCH', url: '/api/todos/offline 1b2c', urlWithParams: '/api/todos/offline 1b2c', body: { done: true } },
                metadata: { idKey: 'id', type: 'todo', displayValue: 'Buy milk is <i>done</i>' }
            }
        ]));
        const [offlineService, , backend] = setup(true);

        expect(localStorage.getItem('requests')).toBeNull();
        expect(offlineService.cachedRequests().map(request => [request.method, request.url, request.body, request.displayValue])).toEqual([
            ['POST', '/api/todos', { title: 'Buy milk' }, 'POST /api/todos'],
            ['PATCH', '/api/todos/offline 1b2c', { done: true }, 'Buy milk is done']
        ]);
        expect(offlineService.hasUnresolvedDependency(offlineService.cachedRequests()[1])).toBe(true);

        const synced: Promise<void> = offlineService.syncAll();
        (await expectRequest(backend, 'POST', '/api/todos')).flush({ id: 7, title: 'Buy milk' });
        (await expectRequest(backend, 'PATCH', '/api/todos/7')).flush({});
        await synced;
    });

    test('leaves what someone else stored under the key of the package before', () => {
        localStorage.setItem('requests', JSON.stringify({ pending: 3 }));
        const [offlineService] = setup(true);

        expect(offlineService.cachedRequests()).toEqual([]);
        expect(localStorage.getItem('requests')).toBe('{"pending":3}');
    });

    test('discards requests without sending them', async () => {
        const [offlineService, http] = setup();
        await createTodoOffline(http, 'Buy milk');
        await createTodoOffline(http, 'Pay rent');

        offlineService.remove(offlineService.cachedRequests()[0]);
        expect(offlineService.cachedRequests().map(request => request.body)).toEqual([{ title: 'Pay rent' }]);
        offlineService.removeAll();
        expect(offlineService.cachedRequests()).toEqual([]);
        expect(localStorage.getItem('offlineRequests')).toBe('[]');
    });
});