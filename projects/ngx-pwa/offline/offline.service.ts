import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { computed, DestroyRef, inject, Injector, PLATFORM_ID, runInInjectionContext, Service, Signal, signal, WritableSignal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { CachedRequestMethod } from './cached-request-method.type';
import { CachedRequest } from './cached-request.model';
import { CachedRequestUtilities } from './cached-request.utilities';
import { LegacyCachedRequestUtilities } from './legacy-cached-request.utilities';
import { OfflineConfig } from './offline-config.model';
import { OFFLINE_CONFIG } from './offline-config.provider';
import { OfflineContext } from './offline-context.model';
import { OfflineRequestMetadata } from './offline-request-metadata.model';

const STORAGE_KEY: string = 'offlineRequests';
// where the package before @service-soft/ngx-pwa kept its requests.
const LEGACY_STORAGE_KEY: string = 'requests';
const DEFAULT_ID_KEY: string = 'id';

/**
 * Keeps the requests the user makes while offline in the browser, shows their changes in the data of the app and
 * sends them once the user syncs. Register the offlineInterceptor, and mark the requests to keep with
 * OFFLINE_REQUEST_METADATA.
 */
@Service()
export class OfflineService {
    private readonly http: HttpClient = inject(HttpClient);

    private readonly config: OfflineConfig = inject(OFFLINE_CONFIG);

    private readonly injector: Injector = inject(Injector);

    private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

    private readonly offlineState: WritableSignal<boolean> = signal(this.isBrowser && !navigator.onLine);

    // every request of the browser, also the ones of other users, which the signals of the service leave out.
    private readonly requests: WritableSignal<CachedRequest[]> = signal(this.findStoredRequests());

    private readonly cachedSinceState: WritableSignal<Date | undefined> = signal(undefined);

    /**
     * Whether the browser has no network connection. Always false on the server.
     */
    readonly offline: Signal<boolean> = this.offlineState.asReadonly();

    /**
     * The requests made while offline that aren't synced yet, oldest first: the ones of the scope of the OfflineConfig,
     * like the logged in user, wherever they were made.
     */
    readonly cachedRequests: Signal<CachedRequest[]> = computed(() => {
        const scope: string | undefined = this.resolveScope();
        return this.requests().filter(request => request.scope == undefined || request.scope === scope);
    });

    /**
     * When the oldest answer the offline cache gave in place of the server was loaded, since the server last answered:
     * the data the app shows may be that old. Undefined while the server answers.
     */
    readonly cachedSince: Signal<Date | undefined> = this.cachedSinceState.asReadonly();

    constructor() {
        if (!this.isBrowser) {
            return;
        }
        this.convertLegacyRequests();
        const listeners: AbortController = new AbortController();
        inject(DestroyRef).onDestroy(() => listeners.abort());
        window.addEventListener('online', () => this.offlineState.set(false), { signal: listeners.signal });
        window.addEventListener('offline', () => this.offlineState.set(true), { signal: listeners.signal });
        // other tabs of the app keep their requests in the same storage. Without this, the next change in this tab
        // would overwrite the requests they kept.
        window.addEventListener(
            'storage',
            event => {
                if (event.key === STORAGE_KEY) {
                    this.requests.set(this.findStoredRequests());
                }
            },
            { signal: listeners.signal }
        );
    }

    /**
     * Keeps a request to send it later. The offlineInterceptor calls it for marked requests while the user is offline.
     * @param request - The request.
     * @param metadata - What the service needs to know about it.
     * @returns The request as it is kept, or undefined for a method that isn't kept, like GET.
     */
    cacheRequest(request: HttpRequest<unknown>, metadata: OfflineRequestMetadata): CachedRequest | undefined {
        const method: CachedRequestMethod | undefined = CachedRequestUtilities.findMethod(request.method);
        if (method == undefined) {
            return undefined;
        }
        const cachedRequest: CachedRequest = {
            id: CachedRequestUtilities.createOfflineId(),
            method,
            url: request.urlWithParams,
            // a copy as json, which is how the browser keeps it and how HttpClient sends it: later changes of the
            // caller's object don't change the request, and dates are the strings the server gets.
            body: request.body == undefined ? undefined : JSON.parse(JSON.stringify(request.body)),
            type: metadata.type,
            idKey: metadata.idKey ?? DEFAULT_ID_KEY,
            displayValue: metadata.displayValue ?? request.urlWithParams,
            // where it was made and by whom, which it is synced with even when the user switched by then
            ...this.resolveContext(request)
        };
        this.updateRequests(requests => [...requests, cachedRequest]);
        return cachedRequest;
    }

    /**
     * Resolves who a request belongs to and where it is made, by the OfflineConfig: its scope, and the values of its
     * headers, the ones the request sets itself first.
     * @param request - The request, or undefined for one that sets no header itself.
     * @returns The scope and the values of the headers.
     */
    resolveContext(request?: HttpRequest<unknown>): OfflineContext {
        const headers: Record<string, string> = {};
        for (const [name, resolveValue] of Object.entries(this.config.headers)) {
            const value: string | undefined = request?.headers.get(name) ?? runInInjectionContext(this.injector, resolveValue);
            if (value != undefined) {
                headers[name] = value;
            }
        }
        return { scope: this.resolveScope(), headers };
    }

    /**
     * Applies the changes made offline to entities loaded from the server: adds the ones created offline, changes the
     * changed ones and removes the deleted ones. A PATCH or DELETE request changes the entity whose id is the last
     * segment of its url, like '/todos/5'. Only the changes of the current scope and headers of the OfflineConfig count,
     * like the ones of the logged in user in the active tenant.
     * @param type - The type of the entities, as in OFFLINE_REQUEST_METADATA.
     * @param entities - The entities loaded from the server. They aren't changed.
     * @returns The entities with the changes made offline.
     */
    applyOfflineData<Entity extends object>(type: string, entities: Entity[]): Entity[] {
        let result: Entity[] = [...entities];
        for (const request of this.findOfflineChanges(type)) {
            switch (request.method) {
                case 'POST': {
                    // the server creates the entity from this body, so it has the shape of the other entities of its type.
                    result = [...result, CachedRequestUtilities.resolveCreatedEntity(request) as Entity];
                    break;
                }
                case 'PATCH': {
                    const id: string = CachedRequestUtilities.resolveTargetId(request);
                    const changes: object = typeof request.body === 'object' && request.body != undefined ? request.body : {};
                    result = result.map(entity => {
                        return CachedRequestUtilities.getEntityId(entity, request.idKey) === id ? { ...entity, ...changes } : entity;
                    });
                    break;
                }
                case 'DELETE': {
                    const id: string = CachedRequestUtilities.resolveTargetId(request);
                    result = result.filter(entity => CachedRequestUtilities.getEntityId(entity, request.idKey) !== id);
                    break;
                }
            }
        }
        return result;
    }

    /**
     * Finds the changes made offline that applyOfflineData applies to the entities of a type: the ones of the current
     * scope and headers of the OfflineConfig, oldest first. Like to count how many entities were created and deleted.
     * @param type - The type of the entities, as in OFFLINE_REQUEST_METADATA.
     * @returns The requests of the changes.
     */
    findOfflineChanges(type: string): CachedRequest[] {
        const context: OfflineContext = this.resolveContext();
        return this.cachedRequests().filter(request => request.type === type && this.isMadeIn(request, context));
    }

    /**
     * Whether a request uses an entity that was created offline and isn't synced yet, so it can't be synced before
     * the request that creates it.
     * @param request - The request.
     * @returns Whether it has to wait for another request.
     */
    hasUnresolvedDependency(request: CachedRequest): boolean {
        return this.requests().some(other => {
            return other.method === 'POST' && other.id !== request.id && CachedRequestUtilities.containsId(request, other.id);
        });
    }

    /**
     * Sends a request to the server with the headers it was made with, and removes it once the server accepted it. When
     * it created an entity, the other requests get the id the server gave it.
     * @param request - The request.
     * @throws {Error} When the request uses an entity created offline that isn't synced yet, or belongs to another scope.
     */
    async sync(request: CachedRequest): Promise<void> {
        if (request.scope != undefined && request.scope !== this.resolveScope()) {
            throw new Error(`The request to ${request.url} was made by somebody else, and is only sent with their login.`);
        }
        if (this.hasUnresolvedDependency(request)) {
            throw new Error(`The request to ${request.url} uses an entity that was created offline. `
                + 'Sync the request that creates it first.');
        }
        // an interceptor that adds a header, like the active tenant, leaves the ones the request sets alone
        const response: unknown = await firstValueFrom(
            this.http.request<unknown>(request.method, request.url, { body: request.body, headers: request.headers ?? {} })
        );
        const id: unknown = request.method === 'POST' && typeof response === 'object' && response != undefined
            ? Reflect.get(response, request.idKey)
            : undefined;
        this.updateRequests(requests => {
            const others: CachedRequest[] = requests.filter(cachedRequest => cachedRequest.id !== request.id);
            return typeof id === 'string' || typeof id === 'number'
                ? others.map(other => CachedRequestUtilities.replaceId(other, request.id, id))
                : others;
        });
    }

    /**
     * Sends every request of cachedRequests to the server, oldest first, and removes each once the server accepted it.
     * Stops at the first one that fails, which stays with every one after it.
     */
    async syncAll(): Promise<void> {
        // oldest first: a request that uses an entity created offline was made after the request that creates it,
        // which gave it the real id by then.
        let next: CachedRequest | undefined = this.cachedRequests().at(0);
        while (next) {
            await this.sync(next);
            next = this.cachedRequests().at(0);
        }
    }

    /**
     * Removes a request without sending it, which discards its change.
     * @param request - The request.
     */
    remove(request: CachedRequest): void {
        this.updateRequests(requests => requests.filter(cachedRequest => cachedRequest.id !== request.id));
    }

    /**
     * Removes every request of cachedRequests without sending it, which discards every change made offline. The ones
     * of other scopes stay.
     */
    removeAll(): void {
        const removed: Set<string> = new Set(this.cachedRequests().map(request => request.id));
        this.updateRequests(requests => requests.filter(request => !removed.has(request.id)));
    }

    /**
     * Notes that the offline cache answered a request in place of the server, for cachedSince. The
     * offlineCacheInterceptor calls it.
     * @param loadedAt - When the answer was loaded from the server.
     */
    noteCachedAnswer(loadedAt: Date): void {
        this.cachedSinceState.update(since => since == undefined || loadedAt < since ? loadedAt : since);
    }

    /**
     * Notes that the server answered again, for cachedSince. The offlineCacheInterceptor calls it.
     */
    noteServerAnswer(): void {
        this.cachedSinceState.set(undefined);
    }

    // a request kept before headers were kept shows everywhere, like it did then.
    private isMadeIn(request: CachedRequest, context: OfflineContext): boolean {
        const headers: Record<string, string> | undefined = request.headers;
        return headers == undefined || Object.keys(this.config.headers).every(name => headers[name] === context.headers[name]);
    }

    private resolveScope(): string | undefined {
        return runInInjectionContext(this.injector, this.config.scope);
    }

    private updateRequests(update: (requests: CachedRequest[]) => CachedRequest[]): void {
        this.requests.update(update);
        if (this.isBrowser) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.requests()));
        }
    }

    // users who update with changes that aren't synced keep them. They are older than any change kept since.
    private convertLegacyRequests(): void {
        const stored: string | null = localStorage.getItem(LEGACY_STORAGE_KEY);
        const converted: CachedRequest[] | undefined = stored == undefined
            ? undefined
            : LegacyCachedRequestUtilities.resolveCachedRequests(stored);
        if (converted == undefined) {
            return;
        }
        this.updateRequests(requests => [...converted, ...requests]);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
    }

    private findStoredRequests(): CachedRequest[] {
        if (!this.isBrowser) {
            return [];
        }
        const stored: string | null = localStorage.getItem(STORAGE_KEY);
        if (stored == undefined) {
            return [];
        }
        try {
            return JSON.parse(stored) as CachedRequest[];
        }
        catch {
            return [];
        }
    }
}