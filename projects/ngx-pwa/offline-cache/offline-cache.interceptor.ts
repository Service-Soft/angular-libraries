import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpHeaders, HttpInterceptorFn, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { OfflineService } from '@service-soft/ngx-pwa/offline';
import { catchError, from, of, switchMap, tap, throwError } from 'rxjs';

import { CachedAnswer } from './cached-answer.model';
import { OfflineCacheConfig } from './offline-cache-config.model';
import { OFFLINE_CACHE_CONFIG } from './offline-cache-config.provider';
import { OfflineCacheService } from './offline-cache.service';

/**
 * Keeps the answers to the GET requests of the urls of provideOfflineCache, and gives the last one when a request
 * can't reach the server, like while the browser is offline. The server is always asked first, so nothing old shows
 * while it answers. An answer is kept for the scope and the headers of provideOfflineConfig, like the user and the
 * tenant, and only given to a request of the same ones. An answer of the cache has the status 200 and the header
 * `X-Offline-Cache-Loaded-At`, when it was loaded, as an ISO string; cachedSince of the OfflineService says how old the
 * oldest is. Register it with `provideHttpClient(withInterceptors([authInterceptor, offlineCacheInterceptor]))`.
 * @param request - The request.
 * @param next - The next handler.
 * @returns The answer of the server, or the one kept of it when the server can't be reached.
 */
export const offlineCacheInterceptor: HttpInterceptorFn = (request, next) => {
    const config: OfflineCacheConfig = inject(OFFLINE_CACHE_CONFIG);
    if (request.method !== 'GET' || !isPlatformBrowser(inject(PLATFORM_ID)) || !config.urls.some(url => request.url.startsWith(url))) {
        return next(request);
    }
    const cacheService: OfflineCacheService = inject(OfflineCacheService);
    const offlineService: OfflineService = inject(OfflineService);
    // who and where now: the user may switch the tenant before the request fails
    const key: string = cacheService.resolveKey(request);
    return next(request).pipe(
        tap(event => {
            if (event instanceof HttpResponse) {
                offlineService.noteServerAnswer();
                void saveAnswer(cacheService, key, event.body);
            }
        }),
        catchError((failure: unknown) => {
            if (!isUnreachable(failure)) {
                return throwError(() => failure);
            }
            return from(findAnswer(cacheService, key)).pipe(
                switchMap((answer: CachedAnswer | undefined) => {
                    if (answer == undefined) {
                        return throwError(() => failure);
                    }
                    offlineService.noteCachedAnswer(new Date(answer.loadedAt));
                    return of(new HttpResponse({
                        status: HttpStatusCode.Ok,
                        statusText: 'OK',
                        url: request.urlWithParams,
                        body: answer.body,
                        headers: new HttpHeaders({ 'X-Offline-Cache-Loaded-At': answer.loadedAt })
                    }));
                })
            );
        })
    );
};

/**
 * Keeps an answer of the server, unless the browser refuses it, like when its disk is full: the answer arrives all the
 * same, and the cache has an older one or none.
 * @param cacheService - The OfflineCacheService.
 * @param key - The key of the answer.
 * @param body - The body of the answer.
 */
async function saveAnswer(cacheService: OfflineCacheService, key: string, body: unknown): Promise<void> {
    try {
        await cacheService.saveAnswer(key, body);
    }
    catch {
        // see above
    }
}

/**
 * Finds the answer kept for a request that can't reach the server. A cache the browser can't read has none, and the
 * request fails like it did.
 * @param cacheService - The OfflineCacheService.
 * @param key - The key of the answer.
 * @returns The answer, or undefined.
 */
async function findAnswer(cacheService: OfflineCacheService, key: string): Promise<CachedAnswer | undefined> {
    try {
        return await cacheService.resolveAnswer(key);
    }
    catch {
        return undefined;
    }
}

/**
 * Whether a request failed for not reaching the server, rather than for its answer.
 * @param error - What the request failed with.
 * @returns True for no answer at all, and for the 504 the service worker of Angular answers when it couldn't reach it.
 */
function isUnreachable(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 0 || error.status === HttpStatusCode.GatewayTimeout);
}