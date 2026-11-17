import { Component, computed, Signal } from '@angular/core';
import { PropertyMetadata, StringPropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { InputStringComponent, InputStringType } from '@service-soft/ui/input-string';

/**
 * The field of a string property on one line, with the native type of its format, like email.
 */
@Component({
    selector: 'ngx-entity-string-field',
    templateUrl: './entity-string-field.component.html',
    imports: [InputStringComponent],
    host: { class: 'contents' }
})
export class EntityStringFieldComponent<T extends object> extends BaseEntityFieldDirective<T, string> {
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
     * The native type of the input.
     */
    protected readonly type: Signal<InputStringType> = computed(() => {
        const metadata: StringPropertyMetadata<T> = this.metadata();
        if (metadata.password) {
            return 'password';
        }
        switch (metadata.format) {
            case 'email': {
                return 'email';
            }
            case 'phone': {
                return 'tel';
            }
            case 'uuid':
            case undefined: {
                return 'text';
            }
        }
    });

    /**
     * The pattern of the native input, the source of a regex.
     */
    protected readonly pattern: Signal<string | undefined> = computed(() => {
        const regex: RegExp | string | undefined = this.metadata().regex;
        return regex instanceof RegExp ? regex.source : regex;
    });

    /**
     * Takes the text of the input, nothing for an empty one.
     * @param text - The text.
     */
    protected changeText(text: string): void {
        this.value.set(text === '' ? undefined : text);
    }
}