import { Component, computed, Signal } from '@angular/core';
import { NumberPropertyMetadata, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { InputNumberComponent, InputNumberStep } from '@service-soft/ui/input-number';

/**
 * The field of a number property, which takes whole numbers only when its format is integer.
 */
@Component({
    selector: 'ngx-entity-number-field',
    templateUrl: './entity-number-field.component.html',
    imports: [InputNumberComponent],
    host: { class: 'contents' }
})
export class EntityNumberFieldComponent<T extends object> extends BaseEntityFieldDirective<T, number> {
    /**
     * What the number property says about itself.
     */
    protected readonly metadata: Signal<NumberPropertyMetadata<T>> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type !== 'number') {
            throw this.resolveKindError('number');
        }
        return metadata;
    });

    /**
     * The step of the native input: whole numbers for an integer, any number else.
     */
    protected readonly step: Signal<InputNumberStep> = computed(() => this.metadata().format === 'integer' ? 1 : 'any');
}