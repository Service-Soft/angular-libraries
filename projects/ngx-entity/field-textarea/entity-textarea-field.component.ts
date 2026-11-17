import { Component, computed, Signal } from '@angular/core';
import { PropertyMetadata, StringPropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { InputTextareaComponent } from '@service-soft/ui/input-textarea';

/**
 * The field of a string property with several lines, for a longer text like a description.
 */
@Component({
    selector: 'ngx-entity-textarea-field',
    templateUrl: './entity-textarea-field.component.html',
    imports: [InputTextareaComponent],
    host: { class: 'contents' }
})
export class EntityTextareaFieldComponent<T extends object> extends BaseEntityFieldDirective<T, string> {
    /**
     * What the string property says about itself.
     */
    protected readonly metadata: Signal<StringPropertyMetadata<T>> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type !== 'string') {
            throw this.resolveKindError('string');
        }
        return metadata;
    });

    /**
     * Takes the text of the input, nothing for an empty one.
     * @param text - The text.
     */
    protected changeText(text: string): void {
        this.value.set(text === '' ? undefined : text);
    }
}