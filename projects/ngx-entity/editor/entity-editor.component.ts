import { Component, computed, inject, input, InputSignal, linkedSignal, output, OutputEmitterRef, Signal, signal, WritableSignal } from '@angular/core';
import { EntityClass, EntityUtilities } from '@service-soft/ngx-entity/entity';
import { ENTITY_FORM_CONFIG, EntityFormComponent, EntityFormConfig, EntityFormMode } from '@service-soft/ngx-entity/form';
import { ENTITY_SERVICE, EntityService } from '@service-soft/ngx-entity/service';
import { ErrorResponseUtilities } from '@service-soft/ngx-error-handling/error-response';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { ErrorResponseBody, ValidationProblem } from 'zibri-contract';

import { EntityEditorHeadingLevel } from './entity-editor-heading-level.type';

/**
 * Creates or edits an entity: a heading, its form, and the buttons that save and cancel. Saving sends the values with
 * the service and emits the entity the server saved; the problems of values the server refused show at their fields,
 * any other error goes on to the ErrorHandler. The dialogs and pages of ngx-entity are built on it; use it for a page
 * of your own.
 */
@Component({
    selector: 'ngx-entity-editor',
    templateUrl: './entity-editor.component.html',
    imports: [FormComponent, EntityFormComponent, ButtonComponent],
    // the fields inside, like the table of a has-many relation, find the service of the entity they belong to.
    providers: [{ provide: ENTITY_SERVICE, useFactory: (): EntityService<object> => inject(EntityEditorComponent).service() }],
    host: { class: 'block' }
})
export class EntityEditorComponent<T extends object> {
    /**
     * The service that saves the entity.
     */
    readonly service: InputSignal<EntityService<T>> = input.required<EntityService<T>>();

    /**
     * The entity to edit, undefined to create one.
     */
    readonly entity: InputSignal<T | undefined> = input<T>();

    /**
     * The values a new entity starts with, on top of the defaults of its properties, like the joinColumn of the entity it
     * belongs to.
     */
    readonly createValues: InputSignal<Partial<T>> = input<Partial<T>>({});

    /**
     * The heading, the createTitle or editTitle of provideEntityFormConfig by default.
     */
    readonly title: InputSignal<string | undefined> = input<string>();

    /**
     * The level of the heading: 2 inside a dialog or below the heading of a page, 1 when it is the heading of the page.
     */
    readonly headingLevel: InputSignal<EntityEditorHeadingLevel> = input<EntityEditorHeadingLevel>(2);

    /**
     * Emits the entity the server saved.
     */
    readonly saved: OutputEmitterRef<T> = output<T>();

    /**
     * Emits when the user cancels. Ask whether to lose the changes before you leave, see hasUnsavedChanges.
     */
    readonly cancelled: OutputEmitterRef<void> = output();

    /**
     * The texts of the editor.
     */
    protected readonly labels: EntityFormConfig = inject(ENTITY_FORM_CONFIG);

    /**
     * The class of the entity.
     */
    protected readonly entityClass: Signal<EntityClass<T>> = computed(() => this.service().entity);

    /**
     * Whether it creates an entity or edits one.
     */
    protected readonly mode: Signal<EntityFormMode> = computed(() => this.entity() == undefined ? 'create' : 'update');

    /**
     * The heading.
     */
    protected readonly heading: Signal<string> = computed(() => {
        return this.title() ?? (this.mode() === 'create' ? this.labels.createTitle : this.labels.editTitle);
    });

    /**
     * The values the form started with: the entity, or the defaults of a new one.
     */
    private readonly original: Signal<Partial<T>> = computed(() => {
        return this.entity() ?? { ...EntityUtilities.resolveDefaults(this.entityClass()), ...this.createValues() };
    });

    /**
     * The values of the form, which start again with every entity it gets.
     */
    protected readonly value: WritableSignal<Partial<T>> = linkedSignal(() => this.original());

    /**
     * The problems of the values the server refused.
     */
    protected readonly problems: WritableSignal<ValidationProblem[]> = signal([]);

    /**
     * Whether the entity is being saved, which the buttons wait for.
     */
    protected readonly saving: WritableSignal<boolean> = signal(false);

    // set once saved, so leaving afterwards asks nothing.
    private readonly savedValue: WritableSignal<Partial<T> | undefined> = signal(undefined);

    /**
     * Whether the user changed a value they didn't save.
     * @returns True when they did.
     */
    hasUnsavedChanges(): boolean {
        const saved: Partial<T> = this.savedValue() ?? this.original();
        return Object.keys(EntityUtilities.resolveChanges(this.entityClass(), saved, this.value())).length > 0;
    }

    /**
     * Saves the entity and emits it. The problems of values the server refused show at their fields; any other error
     * goes on to the ErrorHandler.
     */
    protected async save(): Promise<void> {
        const service: EntityService<T> = this.service();
        const entity: T | undefined = this.entity();
        this.saving.set(true);
        try {
            const saved: T = entity == undefined ? await service.create(this.value()) : await service.update(entity, this.value());
            this.savedValue.set(this.value());
            this.saved.emit(saved);
        }
        catch (error) {
            const body: ErrorResponseBody | undefined = ErrorResponseUtilities.findErrorResponseBody(error);
            if (body?.problems == undefined || body.problems.length === 0) {
                throw error;
            }
            this.problems.set(body.problems);
        }
        finally {
            this.saving.set(false);
        }
    }
}