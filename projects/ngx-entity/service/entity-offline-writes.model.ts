import { HttpContext } from '@angular/common/http';
import { PaginationResult } from 'zibri-contract';

/**
 * What lets the EntityService keep its changes while the user is offline. It comes with provideOfflineEntities of
 * `@service-soft/ngx-entity/offline`, which uses `@service-soft/ngx-pwa`.
 */
export type EntityOfflineWrites = {
    /**
     * Resolves the context of a request that creates, changes or deletes an entity, which keeps it while offline.
     * @param type - The type of the entity, the baseUrl of its service.
     * @param displayValue - What the user sees of the change, the label of the entity.
     * @returns The context of the request.
     */
    resolveWriteContext: (type: string, displayValue: string) => HttpContext,
    /**
     * Applies the changes made offline to a page of entities, as json, and to how many there are.
     * @param type - The type of the entities, the baseUrl of their service.
     * @param page - The page as the server answered it.
     * @param pageNumber - The number of the page, from 1 on.
     * @param findId - Finds the id of an entity.
     * @returns The page with the changes made offline.
     */
    applyToPage: <T extends object>(
        type: string,
        page: PaginationResult<T>,
        pageNumber: number,
        findId: (entity: Partial<T>) => string | undefined
    ) => PaginationResult<T>
};