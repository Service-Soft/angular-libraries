import { CachedRequestMethod } from './cached-request-method.type';
import { CachedRequest } from './cached-request.model';
import { CachedRequestUtilities } from './cached-request.utilities';
import { LegacyCachedRequest } from './legacy-cached-request.model';

/**
 * Utilities for the requests the package before @service-soft/ngx-pwa kept in the browser.
 */
export abstract class LegacyCachedRequestUtilities {
    /**
     * Converts the requests the package before kept in the browser, with their offline ids, so the changes of a user
     * who updates aren't lost. Requests it would never sync, like GET, are left out.
     * @param stored - What is stored under the key of the package before.
     * @returns The requests, oldest first, or undefined when the value isn't from the package before.
     */
    static resolveCachedRequests(stored: string): CachedRequest[] | undefined {
        let value: unknown;
        try {
            value = JSON.parse(stored);
        }
        catch {
            return undefined;
        }
        // the key is a common word, so anything else stored under it belongs to someone else.
        return Array.isArray(value) && value.every((item: unknown) => this.isLegacyCachedRequest(item))
            ? value.flatMap((legacy: LegacyCachedRequest) => this.toCachedRequests(legacy))
            : undefined;
    }

    private static toCachedRequests(legacy: LegacyCachedRequest): CachedRequest[] {
        const method: CachedRequestMethod | undefined = CachedRequestUtilities.findMethod(legacy.request.method);
        if (method == undefined) {
            return [];
        }
        const { idKey } = legacy.metadata;
        const body: unknown = legacy.request.body ?? undefined;
        const createdEntity: object | undefined = method === 'POST' && typeof body === 'object' && body != undefined ? body : undefined;
        // the package before kept the offline id of a POST in its body, and later requests use it like any other id.
        const offlineId: unknown = createdEntity == undefined ? undefined : Reflect.get(createdEntity, idKey);
        const cachedRequest: CachedRequest = {
            id: typeof offlineId === 'string' ? offlineId : CachedRequestUtilities.createOfflineId(),
            method,
            url: legacy.request.urlWithParams,
            // it sent a POST without the offline id.
            body: createdEntity == undefined ? body : Object.fromEntries(Object.entries(createdEntity).filter(([key]) => key !== idKey)),
            type: legacy.metadata.type,
            idKey,
            displayValue: this.resolveText(legacy.metadata.displayValue)
        };
        return [cachedRequest];
    }

    // the display value was html, it is plain text now. Parsing it runs nothing, the text is all that is used.
    private static resolveText(html: string): string {
        return new DOMParser().parseFromString(html, 'text/html').body.textContent.replaceAll(/\s+/g, ' ').trim();
    }

    private static isLegacyCachedRequest(value: unknown): value is LegacyCachedRequest {
        if (typeof value !== 'object' || value == undefined) {
            return false;
        }
        const request: unknown = Reflect.get(value, 'request');
        const metadata: unknown = Reflect.get(value, 'metadata');
        return typeof request === 'object' && request != undefined
            && typeof Reflect.get(request, 'method') === 'string'
            && typeof Reflect.get(request, 'urlWithParams') === 'string'
            && typeof metadata === 'object' && metadata != undefined
            && typeof Reflect.get(metadata, 'type') === 'string'
            && typeof Reflect.get(metadata, 'idKey') === 'string'
            && typeof Reflect.get(metadata, 'displayValue') === 'string';
    }
}