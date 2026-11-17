import { booleanAttribute, computed, Directive, input, InputSignal, InputSignalWithTransform, linkedSignal, model, ModelSignal, Signal, WritableSignal } from '@angular/core';
import { EntityProperty, PropertyMetadata } from '@service-soft/ngx-entity/entity';

/**
 * What every field of an entity form takes, which ngx-entity-field hands to the component of the kind of the property.
 * Extend it for a field of your own, and give it to provideEntityFields. The value is bound two-way.
 */
@Directive()
export abstract class BaseEntityFieldDirective<T extends object, V> {
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
    readonly value: ModelSignal<V | undefined> = model<V>();

    /**
     * The label of the field.
     */
    protected readonly label: Signal<string> = computed(() => this.property().metadata.displayName);

    /**
     * The hint below the field.
     */
    protected readonly hint: Signal<string | undefined> = computed(() => this.property().metadata.description);

    /**
     * The check that makes the problem of the server the error of the input, while there is one.
     */
    protected readonly problemValidation: Signal<(() => string) | undefined> = computed(() => {
        const problem: string | undefined = this.problem();
        return problem == undefined ? undefined : () => problem;
    });

    /**
     * Whether the input shows its error: right away when the server found a problem, else once the user left it.
     */
    // keeps true once the input showed its error, so an error the user already saw doesn't hide when the problem goes.
    protected readonly showError: WritableSignal<boolean> = linkedSignal<string | undefined, boolean>({
        source: this.problem,
        computation: (problem, previous) => problem != undefined || (previous?.value ?? false)
    });

    /**
     * Resolves the error for a property of a kind the field doesn't show, like a date given to a string field.
     * @param type - The type of property the field shows.
     * @returns The error to throw.
     */
    protected resolveKindError(type: PropertyMetadata<T>['type']): Error {
        const property: EntityProperty<T> = this.property();
        return new Error(`The ${type} field got the ${property.metadata.type} property "${property.key}".`);
    }
}