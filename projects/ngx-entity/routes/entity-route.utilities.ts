import { Provider, Type } from '@angular/core';
import { Route, Routes } from '@angular/router';
import { ENTITY_SERVICE, EntityService } from '@service-soft/ngx-entity/service';
import { unsavedChangesGuard } from '@service-soft/ngx-entity/unsaved-changes';

import { EntityRouteOptions } from './entity-route-options.model';

/**
 * Builds the routes of the pages that create and edit entities.
 */
export abstract class EntityRouteUtilities {
    /**
     * Resolves the routes of the pages that create an entity, at `new`, and edit one, at `:id`, which an entity table
     * with `edit="page"` navigates to. Put them next to the route of the table:
     * ```ts
     * { path: 'tasks', children: [{ path: '', component: TasksComponent }, ...EntityRouteUtilities.resolveRoutes(TaskService)] }
     * ```
     * The pages are loaded when they are first opened, and ask before the user leaves them with changes they didn't
     * save.
     * @param service - Your class that extends EntityService.
     * @param options - The titles of the pages.
     * @returns The routes.
     */
    static resolveRoutes<T extends object>(service: Type<EntityService<T>>, options: EntityRouteOptions = {}): Routes {
        const providers: Provider[] = [{ provide: ENTITY_SERVICE, useExisting: service }];
        return [
            { ...this.resolvePageRoute('new', providers), title: options.createTitle },
            { ...this.resolvePageRoute(':id', providers), title: options.editTitle }
        ];
    }

    private static resolvePageRoute(path: string, providers: Provider[]): Route {
        return {
            path,
            providers,
            loadComponent: async () => (await import('@service-soft/ngx-entity/page')).EntityPageComponent,
            canDeactivate: [unsavedChangesGuard]
        };
    }
}