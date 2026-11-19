import { HttpRequest } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { OfflineContext, OfflineService } from '@service-soft/ngx-pwa/offline';

import { CachedAnswer } from './cached-answer.model';
import { OfflineCacheConfig } from './offline-cache-config.model';
import { OFFLINE_CACHE_CONFIG } from './offline-cache-config.provider';

// a database of its own, which clearCache can empty without touching anything else of the app.
const DATABASE_NAME: string = 'ngx-pwa-offline-cache';
const STORE_NAME: string = 'answers';

/**
 * Keeps the answers of the server that the offlineCacheInterceptor gives while the server can't be reached, in
 * IndexedDB, so they are there after a reload and in every tab. Without IndexedDB, they are kept as long as the page.
 * Call clearCache when the user logs out.
 */
@Service()
export class OfflineCacheService {
    private readonly config: OfflineCacheConfig = inject(OFFLINE_CACHE_CONFIG);

    private readonly offlineService: OfflineService = inject(OfflineService);

    private readonly memory: Map<string, CachedAnswer> = new Map();

    private database: Promise<IDBDatabase | undefined> | undefined;

    /**
     * Resolves what the answer to a request is kept under: who and where it is made, by the OfflineConfig, and its url
     * with its query. So the answer for one user or tenant is never given to another.
     * @param request - The request.
     * @returns The key of its answer.
     */
    resolveKey(request: HttpRequest<unknown>): string {
        const context: OfflineContext = this.offlineService.resolveContext(request);
        // the headers in the order of the config, which is the same for every request
        return JSON.stringify([context.scope, Object.entries(context.headers), request.responseType, request.urlWithParams]);
    }

    /**
     * Resolves the answer kept under a key, unless it is older than the maxAgeInMs of the config, which is deleted.
     * @param key - The key of the answer, see resolveKey.
     * @returns The answer, or undefined when there is none that is young enough.
     */
    async resolveAnswer(key: string): Promise<CachedAnswer | undefined> {
        const answer: CachedAnswer | undefined = await this.findStoredAnswer(key);
        if (answer == undefined) {
            return undefined;
        }
        if (this.isExpired(answer)) {
            await this.deleteAnswer(key);
            return undefined;
        }
        return answer;
    }

    /**
     * Keeps an answer of the server under a key, as loaded now, in place of the one before.
     * @param key - The key of the answer, see resolveKey.
     * @param body - The body of the answer.
     */
    async saveAnswer(key: string, body: unknown): Promise<void> {
        const answer: CachedAnswer = { key, body, loadedAt: new Date().toISOString() };
        const database: IDBDatabase | undefined = await this.resolveDatabase();
        if (database == undefined) {
            this.memory.set(key, answer);
            return;
        }
        await this.request(this.getStore(database, 'readwrite').put(answer));
    }

    /**
     * Deletes every answer, of every user. Call it when the user logs out, like with the onLogout of provideAuth of
     * `@service-soft/ngx-auth`.
     */
    async clearCache(): Promise<void> {
        this.memory.clear();
        const database: IDBDatabase | undefined = await this.resolveDatabase();
        if (database != undefined) {
            await this.request(this.getStore(database, 'readwrite').clear());
        }
    }

    private async findStoredAnswer(key: string): Promise<CachedAnswer | undefined> {
        const database: IDBDatabase | undefined = await this.resolveDatabase();
        if (database == undefined) {
            return this.memory.get(key);
        }
        const stored: unknown = await this.request(this.getStore(database, 'readonly').get(key));
        return this.isCachedAnswer(stored) ? stored : undefined;
    }

    private async deleteAnswer(key: string): Promise<void> {
        this.memory.delete(key);
        const database: IDBDatabase | undefined = await this.resolveDatabase();
        if (database != undefined) {
            await this.request(this.getStore(database, 'readwrite').delete(key));
        }
    }

    private getStore(database: IDBDatabase, mode: IDBTransactionMode): IDBObjectStore {
        return database.transaction(STORE_NAME, mode).objectStore(STORE_NAME);
    }

    // opened once and kept open: every GET request of the urls of the config reads or writes it.
    private async resolveDatabase(): Promise<IDBDatabase | undefined> {
        this.database ??= this.openDatabase();
        return await this.database;
    }

    private async openDatabase(): Promise<IDBDatabase | undefined> {
        if (typeof indexedDB === 'undefined') {
            return undefined;
        }
        let database: IDBDatabase;
        try {
            const opening: IDBOpenDBRequest = indexedDB.open(DATABASE_NAME, 1);
            opening.addEventListener('upgradeneeded', () => opening.result.createObjectStore(STORE_NAME, { keyPath: 'key' }));
            database = await this.request(opening);
        }
        catch {
            // a browser that refuses IndexedDB, like for a page whose site data is blocked: the page keeps the answers
            return undefined;
        }
        // an answer is only deleted on its own when it is asked for again, which the one of a query nobody repeats
        // never is: without this, the cache would only grow until the browser evicts all storage of the site.
        try {
            await this.deleteExpiredAnswers(database);
        }
        catch {
            // the cache works all the same, and the next start of the app tries again
        }
        return database;
    }

    private async deleteExpiredAnswers(database: IDBDatabase): Promise<void> {
        // a cursor rather than getAll, which would read every body at once
        const reading: IDBRequest<IDBCursorWithValue | null> = this.getStore(database, 'readwrite').openCursor();
        await new Promise<void>((resolve, reject) => {
            reading.addEventListener('success', () => {
                const cursor: IDBCursorWithValue | null = reading.result;
                if (cursor == undefined) {
                    resolve();
                    return;
                }
                const answer: unknown = cursor.value;
                if (!this.isCachedAnswer(answer) || this.isExpired(answer)) {
                    cursor.delete();
                }
                cursor.continue();
            });
            reading.addEventListener('error', () => reject(reading.error ?? new Error('IndexedDB refused the request.')));
        });
    }

    private isExpired(answer: CachedAnswer): boolean {
        return Date.parse(answer.loadedAt) + this.config.maxAgeInMs <= Date.now();
    }

    private async request<T>(request: IDBRequest<T>): Promise<T> {
        return await new Promise((resolve, reject) => {
            request.addEventListener('success', () => resolve(request.result));
            request.addEventListener('error', () => reject(request.error ?? new Error('IndexedDB refused the request.')));
        });
    }

    private isCachedAnswer(value: unknown): value is CachedAnswer {
        return typeof value === 'object' && value != undefined
            && typeof Reflect.get(value, 'key') === 'string' && typeof Reflect.get(value, 'loadedAt') === 'string';
    }
}