import { booleanAttribute, Component, computed, effect, inject, input, InputSignal, InputSignalWithTransform, inputBinding, model, ModelSignal, resource, ResourceRef, Signal, twoWayBinding, Type, untracked, viewChild, ViewContainerRef } from '@angular/core';
import { EntityProperty } from '@service-soft/ngx-entity/entity';

import { EntityFieldLoader, EntityFieldLoaders } from './entity-field-loaders.model';
import { EntityFieldUtilities } from './entity-field.utilities';
import { ENTITY_FIELDS } from './entity-fields.provider';

/**
 * The field of a property of an entity: it loads the component of the kind of the property, see provideEntityFields,
 * and hands it what it takes. Bind the value two-way with [(value)].
 */
@Component({
    selector: 'ngx-entity-field',
    templateUrl: './entity-field.component.html',
    host: { class: 'contents' }
})
export class EntityFieldComponent<T extends object> {
    private readonly loaders: EntityFieldLoaders = inject(ENTITY_FIELDS);

    private readonly outlet: Signal<ViewContainerRef> = viewChild.required('outlet', { read: ViewContainerRef });

    /**
     * The property the field shows.
     */
    readonly property: InputSignal<EntityProperty<T>> = input.required<EntityProperty<T>>();

    /**
     * The values of the whole entity, which conditions of the property depend on.
     */
    readonly entity: InputSignal<Partial<T>> = input.required<Partial<T>>();

    /**
     * Whether the field needs a value.
     */
    readonly required: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the field shows its value without letting the user change it.
     */
    readonly readonly: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * What the server said is wrong with the value, which shows as the error of the field until the value changes.
     */
    readonly problem: InputSignal<string | undefined> = input<string>();

    /**
     * The value. The user changes it, bind it with [(value)].
     */
    readonly value: ModelSignal<unknown> = model<unknown>();

    /**
     * What loads the component of the field: the one of its kind, or of a custom property.
     */
    private readonly loader: Signal<EntityFieldLoader> = computed(() => {
        return EntityFieldUtilities.resolveLoader(this.property().metadata, this.loaders);
    });

    /**
     * The component of the field, once it is loaded.
     */
    private readonly component: ResourceRef<Type<unknown> | undefined> = resource({
        params: () => this.loader(),
        loader: async ({ params }) => await params()
    });

    constructor() {
        effect(() => {
            const component: Type<unknown> | undefined = this.component.value();
            const outlet: ViewContainerRef = this.outlet();
            if (component == undefined) {
                return;
            }
            // the bindings read the signals from now on, which must not recreate the component on every change.
            untracked(() => {
                outlet.clear();
                outlet.createComponent(component, {
                    bindings: [
                        inputBinding('property', this.property),
                        inputBinding('entity', this.entity),
                        inputBinding('required', this.required),
                        inputBinding('readonly', this.readonly),
                        inputBinding('problem', this.problem),
                        twoWayBinding('value', this.value)
                    ]
                });
            });
        });
    }
}