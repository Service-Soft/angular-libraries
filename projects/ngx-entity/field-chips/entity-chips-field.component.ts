import { Component, computed, inject, signal, Signal, WritableSignal } from '@angular/core';
import { EntityUtilities, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective } from '@service-soft/ngx-entity/field-base';
import { INPUT_CONFIG, InputConfig, InputOption, InputValidation } from '@service-soft/ui/input';
import { InputChipsComponent, InputChipsCustomValue } from '@service-soft/ui/input-chips';

import { EntityChipsFieldUtilities, EntityChipsItemMetadata } from './entity-chips-field.utilities';

/**
 * The field of an array of strings or numbers: chips, chosen from the values of an enum or from options, or typed in and
 * taken with Enter, unless the items are restricted to the options. A typed item has to meet the rules of the items,
 * and shows its error until it does. A required array needs an item.
 */
@Component({
    selector: 'ngx-entity-chips-field',
    templateUrl: './entity-chips-field.component.html',
    imports: [InputChipsComponent],
    host: { class: 'contents' }
})
export class EntityChipsFieldComponent<T extends object> extends BaseEntityFieldDirective<T, (string | number)[]> {
    private readonly config: InputConfig = inject(INPUT_CONFIG);

    /**
     * What the items of the array say about themselves.
     */
    protected readonly items: Signal<EntityChipsItemMetadata> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type !== 'array' || (metadata.items.type !== 'string' && metadata.items.type !== 'number')) {
            throw this.resolveKindError('array');
        }
        return metadata.items;
    });

    /**
     * The text the user types.
     */
    protected readonly query: WritableSignal<string> = signal('');

    /**
     * The values to choose from: the members of an enum, or the options of strings.
     */
    protected readonly options: Signal<InputOption<string | number>[]> = computed(() => {
        const items: EntityChipsItemMetadata = this.items();
        if (items.enum != undefined) {
            return EntityUtilities.resolveEnumMembers(items.enum);
        }
        return items.type === 'string' ? (items.options ?? []).map(option => ({ label: option, value: option })) : [];
    });

    /**
     * Turns a typed text into an item, unless only the enum or the options can be chosen.
     */
    protected readonly customValue: Signal<InputChipsCustomValue<string | number> | undefined> = computed(() => {
        const items: EntityChipsItemMetadata = this.items();
        const onlyOptions: boolean = items.enum != undefined || (items.type === 'string' && items.restrictToOptions);
        return onlyOptions ? undefined : text => EntityChipsFieldUtilities.resolveItem(items, text, this.config);
    });

    /**
     * The error of the typed text, then the problem of the server.
     */
    // reads the text, so the error follows every keystroke.
    protected readonly validation: InputValidation<(string | number)[]> = () => {
        const items: EntityChipsItemMetadata = this.items();
        const typed: string | undefined = this.customValue() == undefined
            ? undefined
            : EntityChipsFieldUtilities.resolveItemError(items, this.query().trim(), this.config);
        return typed ?? this.problemValidation()?.();
    };
}