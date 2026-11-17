import { Component, computed, inject, Signal } from '@angular/core';
import { BooleanPropertyMetadata, EntityUtilities, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { INPUT_CONFIG, InputBooleanAppearance, InputConfig } from '@service-soft/ui/input';
import { InputBooleanComponent } from '@service-soft/ui/input-boolean';

/**
 * The field of a boolean property, a checkbox or a switch. It has to be checked when the property says it must be.
 */
@Component({
    selector: 'ngx-entity-boolean-field',
    templateUrl: './entity-boolean-field.component.html',
    imports: [InputBooleanComponent],
    host: { class: 'contents' }
})
export class EntityBooleanFieldComponent<T extends object> extends BaseEntityFieldDirective<T, boolean> {
    private readonly config: InputConfig = inject(INPUT_CONFIG);

    /**
     * What the boolean property says about itself.
     */
    protected readonly metadata: Signal<BooleanPropertyMetadata<T>> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type !== 'boolean') {
            throw this.resolveKindError('boolean');
        }
        return metadata;
    });

    /**
     * Whether the user has to check it. Required alone only means that the property is sent, which it always is.
     */
    protected readonly mustBeChecked: Signal<boolean> = computed(() => {
        return EntityUtilities.resolveCondition(this.metadata().mustBeChecked, this.entity());
    });

    /**
     * A checkbox or a switch, by the property, or else by what the inputs of the app use.
     */
    protected readonly appearance: Signal<InputBooleanAppearance> = computed(() => {
        return this.metadata().displayStyle ?? this.config.booleanAppearance;
    });
}