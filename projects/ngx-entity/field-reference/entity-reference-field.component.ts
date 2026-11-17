import { Component, computed, effect, ErrorHandler, inject, Injector, resource, ResourceRef, Signal, signal, WritableSignal } from '@angular/core';
import { EntityUtilities, PropertyMetadata, ToOnePropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { EntityService } from '@service-soft/ngx-entity/service';
import { InputOption } from '@service-soft/ui/input';
import { InputAutocompleteComponent } from '@service-soft/ui/input-autocomplete';
import { FilterConfig, FilterValue } from 'zibri-contract';

// how long the user has to stop typing before the field asks the server.
const SEARCH_DELAY: number = 300;

// how many entities the field offers at once.
const SEARCH_LIMIT: number = 20;

/**
 * The field of a relation to one entity, like the team of a task: an autocomplete that asks the service of the other
 * entity for the ones whose label contains the typed text. Its value is the id, which the form keeps in the joinColumn.
 */
@Component({
    selector: 'ngx-entity-reference-field',
    templateUrl: './entity-reference-field.component.html',
    imports: [InputAutocompleteComponent],
    host: { class: 'contents' }
})
export class EntityReferenceFieldComponent<T extends object> extends BaseEntityFieldDirective<T, string> {
    private readonly injector: Injector = inject(Injector);

    /**
     * What the relation says about itself.
     */
    protected readonly metadata: Signal<ToOnePropertyMetadata<T>> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (!EntityUtilities.isToOneRelation(metadata)) {
            throw this.resolveKindError('manyToOne');
        }
        return metadata;
    });

    /**
     * The service of the other entity.
     */
    private readonly service: Signal<EntityService<object>> = computed(() => {
        const service: unknown = this.injector.get(this.metadata().service());
        if (!(service instanceof EntityService)) {
            throw new TypeError(`The service of the relation "${this.property().key}" doesn't extend EntityService.`);
        }
        return service;
    });

    /**
     * The text the user typed, which the other entities are searched by.
     */
    protected readonly query: WritableSignal<string> = signal('');

    /**
     * The entities whose label contains the text.
     */
    private readonly found: ResourceRef<object[] | undefined> = resource({
        params: () => ({ query: this.query(), service: this.service(), label: this.metadata().label }),
        loader: async ({ params, abortSignal }) => {
            await new Promise(resolve => setTimeout(resolve, SEARCH_DELAY));
            if (abortSignal.aborted) {
                return [];
            }
            const filter: FilterValue<object, FilterConfig<object>> = {};
            if (params.query !== '') {
                Reflect.set(filter, params.label, params.query);
            }
            return (await params.service.resolvePage({ page: 1, limit: SEARCH_LIMIT, filter })).items;
        }
    });

    /**
     * The chosen entity, as the read included it, or loaded by its id.
     */
    private readonly chosen: ResourceRef<object | undefined> = resource({
        params: () => this.resolveMissingId(),
        loader: async ({ params }) => await this.service().resolveById(params)
    });

    /**
     * The options: the chosen entity, so its label shows, and the ones that were found.
     */
    protected readonly options: Signal<InputOption<string>[]> = computed(() => {
        const related: object | undefined = this.findIncluded() ?? this.chosen.value();
        const entities: object[] = [...related == undefined ? [] : [related], ...this.found.value() ?? []];
        const options: Map<string, InputOption<string>> = new Map();
        for (const entity of entities) {
            const id: string | undefined = this.service().findId(entity);
            if (id != undefined) {
                options.set(id, { label: EntityUtilities.resolveRelationLabel(this.metadata(), entity), value: id });
            }
        }
        return [...options.values()];
    });

    constructor() {
        super();
        // what couldn't be loaded goes where every other error goes, like a dialog of ngx-error-handling.
        const errorHandler: ErrorHandler = inject(ErrorHandler);
        effect(() => {
            const error: Error | undefined = this.found.error() ?? this.chosen.error();
            if (error != undefined) {
                errorHandler.handleError(error);
            }
        });
    }

    // the entity of the relation, when the read of the entity included it and it is still the chosen one.
    private findIncluded(): object | undefined {
        const related: unknown = Reflect.get(this.entity(), this.property().key);
        if (typeof related !== 'object' || related == undefined) {
            return undefined;
        }
        return this.service().findId(related) === this.value() ? related : undefined;
    }

    // the id of a chosen entity that is neither included nor found, which is loaded on its own.
    private resolveMissingId(): string | undefined {
        const id: string | undefined = this.value();
        const known: boolean = this.findIncluded() != undefined
            || (this.found.value() ?? []).some(entity => this.service().findId(entity) === id);
        return id == undefined || known ? undefined : id;
    }
}