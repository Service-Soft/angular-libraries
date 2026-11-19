import { HttpContext } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { EntityOfflineWrites } from '@service-soft/ngx-entity/service';
import { CachedRequest, OFFLINE_REQUEST_METADATA, OfflineService } from '@service-soft/ngx-pwa/offline';
import { PaginationResult } from 'zibri-contract';

/**
 * Keeps the changes of every EntityService while the user is offline, with the OfflineService of
 * `@service-soft/ngx-pwa`, and applies them to the pages it loads. Set it up with provideOfflineEntities.
 */
@Service()
export class OfflineEntityWrites implements EntityOfflineWrites {
    private readonly offlineService: OfflineService = inject(OfflineService);

    /**
     * Resolves the context of a request that creates, changes or deletes an entity, which the offlineInterceptor keeps
     * while the user is offline.
     * @param type - The type of the entity, the baseUrl of its service.
     * @param displayValue - What the sync dialog shows of the change, the label of the entity.
     * @returns The context, with the OFFLINE_REQUEST_METADATA.
     */
    resolveWriteContext(type: string, displayValue: string): HttpContext {
        return new HttpContext().set(OFFLINE_REQUEST_METADATA, { type, displayValue });
    }

    /**
     * Applies the changes made offline to a page of entities: the changed and deleted ones on every page, the created
     * ones on the first, and to how many there are, every created one more and every deleted one less.
     * @param type - The type of the entities, the baseUrl of their service.
     * @param page - The page as the server answered it.
     * @param pageNumber - The number of the page, from 1 on.
     * @param findId - Finds the id of an entity.
     * @returns The page with the changes made offline.
     */
    applyToPage<T extends object>(
        type: string,
        page: PaginationResult<T>,
        pageNumber: number,
        findId: (entity: Partial<T>) => string | undefined
    ): PaginationResult<T> {
        const changes: CachedRequest[] = this.offlineService.findOfflineChanges(type);
        const applied: T[] = this.offlineService.applyOfflineData(type, page.items);
        // a created entity shows once, not on every page. A deleted one that was created offline counts for both.
        const loadedIds: Set<string | undefined> = new Set(page.items.map(item => findId(item)));
        const items: T[] = pageNumber === 1 ? applied : applied.filter(item => loadedIds.has(findId(item)));
        const created: number = changes.filter(change => change.method === 'POST').length;
        const deleted: number = changes.filter(change => change.method === 'DELETE').length;
        return { ...page, items, totalAmount: page.totalAmount + created - deleted };
    }
}