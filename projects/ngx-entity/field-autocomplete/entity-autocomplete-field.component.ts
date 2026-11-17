import { Component, computed, inject, Signal } from '@angular/core';
import { PropertyMetadata, StringPropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { INPUT_CONFIG, InputConfig, InputOption, InputUtilities, InputValidation } from '@service-soft/ui/input';
import { InputAutocompleteComponent } from '@service-soft/ui/input-autocomplete';

/**
 * The field of a string with the display style 'autocomplete': one line that suggests the options that contain the
 * text. Any text is the value, with the rules of the string, unless the property restricts it to the options.
 */
@Component({
    selector: 'ngx-entity-autocomplete-field',
    templateUrl: './entity-autocomplete-field.component.html',
    imports: [InputAutocompleteComponent],
    host: { class: 'contents' }
})
export class EntityAutocompleteFieldComponent<T extends object> extends BaseEntityFieldDirective<T, string> {
    private readonly config: InputConfig = inject(INPUT_CONFIG);

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
     * The options, which may depend on the entity.
     */
    protected readonly options: Signal<InputOption<string>[]> = computed(() => {
        const options: StringPropertyMetadata<T>['options'] = this.metadata().options;
        const texts: string[] = typeof options === 'function' ? options(this.entity()) : options ?? [];
        return texts.map(text => ({ label: text, value: text }));
    });

    /**
     * The rules of the string a typed text has to meet, then the problem of the server. A combobox has no native
     * length or pattern, so they are checked here.
     */
    protected readonly validation: InputValidation<string | undefined> = () => {
        const { minLength, maxLength, regex } = this.metadata();
        const text: string = this.value() ?? '';
        return InputUtilities.resolveLengthError(text, minLength, maxLength, this.config)
            ?? InputUtilities.resolvePatternError(text, regex instanceof RegExp ? regex.source : regex, this.config)
            ?? this.problemValidation()?.();
    };

    /**
     * Takes the text as the value, nothing for an empty one.
     * @param text - The text.
     */
    protected changeText(text: string): void {
        this.value.set(text === '' ? undefined : text);
    }
}