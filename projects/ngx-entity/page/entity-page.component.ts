import { Component, computed, effect, ErrorHandler, inject, resource, ResourceRef, Signal, viewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityEditorComponent } from '@service-soft/ngx-entity/editor';
import { ENTITY_SERVICE, EntityService } from '@service-soft/ngx-entity/service';
import { UnsavedChanges } from '@service-soft/ngx-entity/unsaved-changes';

/**
 * The page that creates an entity, at the route `new`, or edits the one of the `id` of its route. It gets the service
 * from the providers of its route, its heading from the title of the route, and goes back to the route above once
 * saved or cancelled. Its routes come from EntityRouteUtilities.
 */
@Component({
    selector: 'ngx-entity-page',
    templateUrl: './entity-page.component.html',
    imports: [EntityEditorComponent],
    host: { class: 'block', '(window:beforeunload)': 'warnBeforeUnload($event)' }
})
export class EntityPageComponent implements UnsavedChanges {
    private readonly router: Router = inject(Router);

    private readonly route: ActivatedRoute = inject(ActivatedRoute);

    private readonly editor: Signal<EntityEditorComponent<object> | undefined> = viewChild<EntityEditorComponent<object>>('editor');

    /**
     * The service of the entity.
     */
    protected readonly service: EntityService<object> = inject(ENTITY_SERVICE);

    /**
     * The heading, the title of the route.
     */
    protected readonly title: string | undefined = this.route.snapshot.title;

    // the id of the entity to edit, none on the page that creates one.
    private readonly id: string | undefined = this.route.snapshot.paramMap.get('id') ?? undefined;

    /**
     * The entity to edit, once it is loaded.
     */
    protected readonly entity: ResourceRef<object | undefined> = resource({
        params: () => this.id,
        loader: async ({ params }) => await this.service.resolveById(params)
    });

    /**
     * Whether the editor shows: right away to create, once the entity is loaded to edit.
     */
    protected readonly ready: Signal<boolean> = computed(() => this.id == undefined || this.entity.hasValue());

    constructor() {
        // an entity that couldn't be loaded goes where every other error goes, like a dialog of ngx-error-handling.
        const errorHandler: ErrorHandler = inject(ErrorHandler);
        effect(() => {
            const error: Error | undefined = this.entity.error();
            if (error != undefined) {
                errorHandler.handleError(error);
            }
        });
    }

    /**
     * Whether the user changed a value they didn't save.
     * @returns True when they did.
     */
    hasUnsavedChanges(): boolean {
        return this.editor()?.hasUnsavedChanges() ?? false;
    }

    /**
     * Goes back to the route above, like the table of the entities. UnsavedChangesGuard asks first, if there are
     * changes.
     */
    protected async leave(): Promise<void> {
        await this.router.navigate(['..'], { relativeTo: this.route });
    }

    /**
     * Has the browser ask before the page is closed or reloaded while it has changes.
     * @param event - The event the browser fires before it leaves the page.
     */
    protected warnBeforeUnload(event: BeforeUnloadEvent): void {
        if (this.hasUnsavedChanges()) {
            event.preventDefault();
        }
    }
}