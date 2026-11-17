import { Component, computed, Signal } from '@angular/core';
import { PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { InputSliderComponent } from '@service-soft/ui/input-slider';

/**
 * Where a slider starts and ends, and the steps it moves in.
 */
type SliderRange = {
    /**
     * The smallest number.
     */
    min: number,
    /**
     * The largest number.
     */
    max: number,
    /**
     * The steps the number moves in.
     */
    step: number
};

/**
 * The field of a number property as a slider between its min and max. An integer moves in whole numbers, any other
 * number in hundredths of the range.
 */
@Component({
    selector: 'ngx-entity-slider-field',
    templateUrl: './entity-slider-field.component.html',
    imports: [InputSliderComponent],
    host: { class: 'contents' }
})
export class EntitySliderFieldComponent<T extends object> extends BaseEntityFieldDirective<T, number> {
    /**
     * The min and max of the slider, which the decorator makes sure a slider has.
     */
    protected readonly range: Signal<SliderRange> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type !== 'number' || metadata.min == undefined || metadata.max == undefined) {
            throw this.resolveKindError('number');
        }
        // the native default of 1 would leave a slider from 0 to 1 with nothing between its ends.
        const step: number = metadata.format === 'integer' ? 1 : (metadata.max - metadata.min) / 100;
        return { min: metadata.min, max: metadata.max, step };
    });
}