import { HttpInterceptorFn, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';

import { CachedRequest } from './cached-request.model';
import { CachedRequestUtilities } from './cached-request.utilities';
import { OfflineRequestMetadata } from './offline-request-metadata.model';
import { OFFLINE_REQUEST_METADATA } from './offline-request-metadata.provider';
import { OfflineService } from './offline.service';

/**
 * Keeps POST, PATCH and DELETE requests marked with OFFLINE_REQUEST_METADATA while the user is offline, instead of
 * sending them, and answers them with a success right away: a POST with its body and an offline id, a PATCH with its
 * body, a DELETE with null. Register it with `provideHttpClient(withInterceptors([offlineInterceptor]))`.
 * @param request - The request.
 * @param next - The next handler.
 * @returns The response of the server, or the success for a request that is kept.
 */
export const offlineInterceptor: HttpInterceptorFn = (request, next) => {
    const metadata: OfflineRequestMetadata | undefined = request.context.get(OFFLINE_REQUEST_METADATA);
    if (metadata == undefined) {
        return next(request);
    }
    const offlineService: OfflineService = inject(OfflineService);
    if (!offlineService.offline()) {
        return next(request);
    }
    const cachedRequest: CachedRequest | undefined = offlineService.cacheRequest(request, metadata);
    if (cachedRequest == undefined) {
        return next(request);
    }
    // the change is kept and sent later, so the app goes on as if the server took it. 202 says it isn't done yet.
    return of(new HttpResponse({
        status: HttpStatusCode.Accepted,
        url: cachedRequest.url,
        body: cachedRequest.method === 'POST' ? CachedRequestUtilities.resolveCreatedEntity(cachedRequest) : cachedRequest.body
    }));
};