import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { EntityClass, EntityUtilities } from '@service-soft/ngx-entity/entity';
import { firstValueFrom } from 'rxjs';
import { FilterConfig, OrderConfig, PaginationResult } from 'zibri-contract';

import { EntityOfflineWrites } from './entity-offline-writes.model';
import { ENTITY_OFFLINE_WRITES } from './entity-offline-writes.provider';
import { EntityPageQuery } from './entity-page-query.model';

/**
 * Reads and writes the entities of one class at the routes of a CrudController of zibri. Extend it once per entity,
 * with the same filter and order config the controller takes:
 * ```ts
 * const taskFilter = { title: 'iLike', status: 'oneOf' } as const satisfies FilterConfig<Task>;
 *
 * @Injectable({ providedIn: 'root' })
 * export class TaskService extends EntityService<Task, typeof taskFilter> {
 *     readonly entity = Task;
 *     readonly baseUrl = '/api/tasks';
 *     override readonly filter = taskFilter;
 * }
 * ```
 * Override a method for routes of your own. It needs HttpClient, from provideHttpClient.
 */
export abstract class EntityService<
    T extends object,
    F extends FilterConfig<T> = FilterConfig<T>,
    O extends OrderConfig<T> = OrderConfig<T>
> {
    /**
     * Sends the requests of the default methods.
     */
    protected readonly http: HttpClient = inject(HttpClient);

    // only with provideOfflineEntities, which brings ngx-pwa: without it, the requests go like any other.
    private readonly offlineWrites: EntityOfflineWrites | undefined = inject(ENTITY_OFFLINE_WRITES);

    /**
     * The class of the entities, whose decorators describe them.
     */
    abstract readonly entity: EntityClass<T>;

    /**
     * The url of the controller, like '/api/tasks'.
     */
    abstract readonly baseUrl: string;

    /**
     * What the list may be filtered by, the filter of the controller. None by default.
     */
    readonly filter: F | undefined = undefined;

    /**
     * What the list may be ordered by, the order of the controller: undefined for zibri's default, every string,
     * number, boolean and date of the entity and the objects inside it, false for nothing.
     */
    readonly order: O | false | undefined = undefined;

    /**
     * Resolves a page of the entities, with how many there are on all pages together.
     * By default it sends a GET request to the baseUrl with `page`, `limit`, and `filter` and `order` as json. With
     * provideOfflineEntities, the changes made offline are applied to the page and to how many there are.
     * @param query - The page, its size, and what the list is filtered and ordered by.
     * @returns The entities of the page and how many there are.
     */
    async resolvePage(query: EntityPageQuery<T, F, O>): Promise<PaginationResult<T>> {
        let params: HttpParams = new HttpParams().set('page', query.page)
            .set('limit', query.limit);
        if (query.filter != undefined && Object.keys(query.filter).length > 0) {
            params = params.set('filter', JSON.stringify(query.filter));
        }
        if (query.order != undefined && Object.keys(query.order).length > 0) {
            params = params.set('order', JSON.stringify(query.order));
        }
        const answer: PaginationResult<T> = await firstValueFrom(this.http.get<PaginationResult<T>>(this.baseUrl, { params }));
        // the changes made offline are json like the answer, so they are applied before it becomes entities
        const result: PaginationResult<T> = this.offlineWrites?.applyToPage(this.baseUrl, answer, query.page, entity => this.findId(entity))
            ?? answer;
        return { ...result, items: result.items.map(item => EntityUtilities.resolveFromJson(this.entity, item)) };
    }

    /**
     * Resolves one entity.
     * By default it sends a GET request to `${baseUrl}/${id}`.
     * @param id - The id of the entity.
     * @returns The entity.
     */
    async resolveById(id: string): Promise<T> {
        const json: T = await firstValueFrom(this.http.get<T>(`${this.baseUrl}/${id}`));
        return EntityUtilities.resolveFromJson(this.entity, json);
    }

    /**
     * Creates an entity.
     * By default it sends a POST request to the baseUrl with the values, without the relations, which zibri takes by
     * their joinColumns. With provideOfflineEntities, it is kept while the user is offline, and answered with the
     * entity and an offline id.
     * @param values - The values of the new entity.
     * @returns The entity the server created.
     */
    async create(values: Partial<T>): Promise<T> {
        const body: Partial<T> = EntityUtilities.resolveWritableValues(this.entity, values);
        const json: T = await firstValueFrom(this.http.post<T>(this.baseUrl, body, { context: this.resolveWriteContext(values) }));
        return EntityUtilities.resolveFromJson(this.entity, json);
    }

    /**
     * Changes an entity, sending only the values that changed, without the relations, which zibri takes by their
     * joinColumns.
     * By default it sends a PATCH request to `${baseUrl}/${id}` with them. With provideOfflineEntities, it is kept while
     * the user is offline, and answered with the changes.
     * @param original - The entity as it was loaded.
     * @param current - The entity with the user's changes.
     * @returns The entity as the server saved it.
     */
    async update(original: T, current: Partial<T>): Promise<T> {
        const changes: Partial<T> = EntityUtilities.resolveChanges(this.entity, original, current);
        const json: T = await firstValueFrom(this.http.patch<T>(
            `${this.baseUrl}/${this.getId(original)}`,
            changes,
            { context: this.resolveWriteContext({ ...original, ...current }) }
        ));
        return EntityUtilities.resolveFromJson(this.entity, json);
    }

    /**
     * Imports entities from a json file, like one the table exported.
     * By default it sends a POST request to `${baseUrl}/import` with the file in the multipart field `import`, and
     * expects the entities it created as the answer. Zibri's CrudController has no such route: add it to your
     * controller, or override this method.
     * @param file - The json file.
     * @returns The entities the server created.
     */
    async import(file: File): Promise<T[]> {
        const body: FormData = new FormData();
        body.append('import', file);
        const json: T[] = await firstValueFrom(this.http.post<T[]>(`${this.baseUrl}/import`, body));
        return json.map(entity => EntityUtilities.resolveFromJson(this.entity, entity));
    }

    /**
     * Deletes an entity.
     * By default it sends a DELETE request to `${baseUrl}/${id}`. With provideOfflineEntities, it is kept while the user
     * is offline.
     * @param entity - The entity.
     */
    async delete(entity: T): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.baseUrl}/${this.getId(entity)}`, { context: this.resolveWriteContext(entity) }));
    }

    /**
     * Gets what names an entity for the user, like the sync dialog of `@service-soft/ngx-pwa` shows a change made
     * offline with it. The url of the entity by default, or the baseUrl for one that has no id yet. Override it, like
     * `override getLabel(user: Partial<User>): string { return \`${user.firstName} ${user.lastName}\`; }`.
     * @param entity - The entity, or the values of one that may not be created yet.
     * @returns The label.
     */
    getLabel(entity: Partial<T>): string {
        const id: string | undefined = this.findId(entity);
        return id == undefined ? this.baseUrl : `${this.baseUrl}/${id}`;
    }

    /**
     * Finds the id of an entity, which its routes end with. Override it for an entity whose id is named differently.
     * @param entity - The entity, or the values of one that may not be created yet.
     * @returns Its `id` by default, or undefined when it has none, like a new entity.
     */
    findId(entity: Partial<T>): string | undefined {
        const id: unknown = Reflect.get(entity, 'id');
        return typeof id === 'string' ? id : undefined;
    }

    /**
     * Gets the id of an entity, which its routes end with, by findId.
     * @param entity - The entity.
     * @returns Its id.
     * @throws {Error} When it has none. Override findId for an entity whose id is named differently.
     */
    getId(entity: T): string {
        const id: string | undefined = this.findId(entity);
        if (id == undefined) {
            throw new TypeError(`An entity of ${this.baseUrl} has no string id. Override findId for an id of another name.`);
        }
        return id;
    }

    // the baseUrl is the type of the entities: unlike the name of their class, it survives minifying, and the changes
    // of a type are the ones of its url.
    private resolveWriteContext(entity: Partial<T>): HttpContext | undefined {
        return this.offlineWrites?.resolveWriteContext(this.baseUrl, this.getLabel(entity));
    }
}