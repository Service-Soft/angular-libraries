import { Component, computed, inject, Injector, Signal } from '@angular/core';
import { EntityProperty, EntityUtilities, OneToManyPropertyMetadata, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { ENTITY_SERVICE, EntityService } from '@service-soft/ngx-entity/service';
import { ENTITY_TABLE_CONFIG, EntityTableColumnInput, EntityTableComponent, EntityTableConfig } from '@service-soft/ngx-entity/table';
import { FilterConfig, FilterValue } from 'zibri-contract';

/**
 * The field of a relation to many other entities, like the tasks of a project: a table of the ones that point to this
 * entity, which creates, edits and deletes them in dialogs. A new entity has none yet, so its form says that they can
 * be added once it is saved.
 */
@Component({
    selector: 'ngx-entity-has-many-field',
    templateUrl: './entity-has-many-field.component.html',
    imports: [EntityTableComponent],
    host: { class: 'block' }
})
export class EntityHasManyFieldComponent<T extends object> extends BaseEntityFieldDirective<T, never> {
    private readonly injector: Injector = inject(Injector);

    // the service of this entity, which the editor provides.
    private readonly parentService: EntityService<object> | null = inject(ENTITY_SERVICE, { optional: true });

    /**
     * The texts of the table.
     */
    protected readonly labels: EntityTableConfig = inject(ENTITY_TABLE_CONFIG);

    /**
     * What the relation says about itself.
     */
    protected readonly metadata: Signal<OneToManyPropertyMetadata<T>> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type !== 'oneToMany') {
            throw this.resolveKindError('oneToMany');
        }
        return metadata;
    });

    /**
     * The service of the other entities.
     */
    protected readonly service: Signal<EntityService<object>> = computed(() => {
        const service: unknown = this.injector.get(this.metadata().service());
        if (!(service instanceof EntityService)) {
            throw new TypeError(`The service of the relation "${this.property().key}" doesn't extend EntityService.`);
        }
        return service;
    });

    /**
     * The columns of the table.
     */
    protected readonly columns: Signal<EntityTableColumnInput<object>[]> = computed(() => this.metadata().columns);

    /**
     * The id of this entity, undefined while it isn't created yet.
     */
    protected readonly parentId: Signal<string | undefined> = computed(() => this.parentService?.findId(this.entity()));

    /**
     * Whether this entity is created already, which the other entities need to point to it.
     */
    protected readonly created: Signal<boolean> = computed(() => this.parentId() != undefined);

    /**
     * The other entities that point to this one: the ones whose joinColumn is its id.
     */
    protected readonly filter: Signal<FilterValue<object, FilterConfig<object>>> = computed(() => {
        const filter: FilterValue<object, FilterConfig<object>> = {};
        Reflect.set(filter, this.resolveJoinColumn(), this.parentId());
        return filter;
    });

    /**
     * The values another entity starts with: the id of this one in its joinColumn.
     */
    protected readonly createValues: Signal<Partial<object>> = computed(() => {
        const values: Partial<object> = {};
        Reflect.set(values, this.resolveJoinColumn(), this.parentId());
        return values;
    });

    // the joinColumn of the manyToOne of the other entities that points back.
    private resolveJoinColumn(): string {
        const metadata: OneToManyPropertyMetadata<T> = this.metadata();
        const inverse: EntityProperty<object> | undefined = EntityUtilities.findProperty(metadata.target(), metadata.inverseSide);
        if (inverse?.metadata.type !== 'manyToOne') {
            throw new Error(`The inverseSide "${metadata.inverseSide}" of the relation "${this.property().key}" is no manyToOne.`);
        }
        return inverse.metadata.joinColumn;
    }
}