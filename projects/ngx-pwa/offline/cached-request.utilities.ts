import { CachedRequestMethod } from './cached-request-method.type';
import { CachedRequest } from './cached-request.model';
import { EntityId } from './entity-id.type';

// ids of entities created offline start with it, so they can't be mistaken for an id of the server.
const OFFLINE_ID_PREFIX: string = 'offline-';
const CACHED_METHODS: CachedRequestMethod[] = ['POST', 'PATCH', 'DELETE'];

/**
 * Utilities for requests the OfflineService keeps while the user is offline.
 */
export abstract class CachedRequestUtilities {
    /**
     * Finds the method of a request among the ones that are kept offline.
     * @param method - The method of a request, like 'POST'.
     * @returns The method, or undefined for one that isn't kept, like 'GET'.
     */
    static findMethod(method: string): CachedRequestMethod | undefined {
        return CACHED_METHODS.find(cachedMethod => cachedMethod === method);
    }

    /**
     * Creates a new id for a request, which an entity created offline has until the server gave it a real one.
     * @returns The id, like 'offline-0b6e…'.
     */
    static createOfflineId(): string {
        return `${OFFLINE_ID_PREFIX}${crypto.randomUUID()}`;
    }

    /**
     * Resolves the id of the entity a PATCH or DELETE request changes, which is the last segment of its path, like
     * '5' of '/todos/5?force=true'.
     * @param request - The request.
     * @returns The id, as a string.
     */
    static resolveTargetId(request: CachedRequest): string {
        const path: string = request.url.split(/[?#]/)[0];
        return decodeURIComponent(path.split('/').at(-1) ?? '');
    }

    /**
     * Whether a request uses an id anywhere in its url or body.
     * @param request - The request.
     * @param id - The id, like the one of an entity created offline.
     * @returns Whether the request contains it.
     */
    static containsId(request: CachedRequest, id: string): boolean {
        return request.url.includes(id) || (request.body !== undefined && JSON.stringify(request.body).includes(id));
    }

    /**
     * Replaces the id of an entity created offline with the one the server gave it, in the url and the body of a
     * request. A value that is only the id becomes the new id with its type, so a number stays a number.
     * @param request - The request that may use the offline id.
     * @param offlineId - The id the entity had offline.
     * @param id - The id the server gave it.
     * @returns The request with the new id.
     */
    static replaceId(request: CachedRequest, offlineId: string, id: EntityId): CachedRequest {
        return {
            ...request,
            url: request.url.replaceAll(offlineId, String(id)),
            body: this.replaceIdInValue(request.body, offlineId, id)
        };
    }

    /**
     * Resolves the entity a POST request creates, which is its body with the offline id of the request until the
     * server gave it a real one.
     * @param request - The POST request.
     * @returns The entity.
     */
    static resolveCreatedEntity(request: CachedRequest): object {
        const body: object = typeof request.body === 'object' && request.body != undefined ? request.body : {};
        return { ...body, [request.idKey]: request.id };
    }

    /**
     * Gets the id of an entity, as a string.
     * @param entity - The entity.
     * @param idKey - The property that holds its id.
     * @returns The id, as a string, the way it appears in urls.
     */
    static getEntityId(entity: object, idKey: string): string {
        const id: unknown = Reflect.get(entity, idKey);
        return String(id);
    }

    private static replaceIdInValue(value: unknown, offlineId: string, id: EntityId): unknown {
        if (value === offlineId) {
            return id;
        }
        if (typeof value === 'string') {
            return value.replaceAll(offlineId, String(id));
        }
        if (Array.isArray(value)) {
            return value.map((item: unknown) => this.replaceIdInValue(item, offlineId, id));
        }
        return typeof value === 'object' && value != undefined
            ? Object.fromEntries(Object.entries(value).map(([key, item]) => [key, this.replaceIdInValue(item, offlineId, id)]))
            : value;
    }
}