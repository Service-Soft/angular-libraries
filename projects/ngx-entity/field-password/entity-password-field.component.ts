import { Component, computed, inject, signal, Signal, WritableSignal } from '@angular/core';
import { EntityStringFieldComponent } from '@service-soft/ngx-entity/field-string';
import { InputStringComponent, InputStringValidation } from '@service-soft/ui/input-string';

import { EntityPasswordFieldConfig } from './entity-password-field-config.model';
import { ENTITY_PASSWORD_FIELD_CONFIG } from './entity-password-field-config.provider';

/**
 * The field of a password: hidden, with how hard it is to guess and a second input that repeats it, unless the property
 * turns them off. Only the password is the value, the repetition stays in the field.
 */
@Component({
    selector: 'ngx-entity-password-field',
    templateUrl: './entity-password-field.component.html',
    imports: [InputStringComponent],
    host: { class: 'flex flex-col gap-2' }
})
export class EntityPasswordFieldComponent<T extends object> extends EntityStringFieldComponent<T> {
    private readonly config: EntityPasswordFieldConfig = inject(ENTITY_PASSWORD_FIELD_CONFIG);

    /**
     * The text of the input that repeats the password.
     */
    protected readonly confirmation: WritableSignal<string> = signal('');

    /**
     * Whether the input that repeats the password shows its error.
     */
    protected readonly showConfirmationError: WritableSignal<boolean> = signal(false);

    /**
     * Whether the password is repeated: when the property says so, and the user can change it.
     */
    protected readonly hasConfirmation: Signal<boolean> = computed(() => this.metadata().confirmation && !this.readonly());

    /**
     * The label of the input that repeats the password.
     */
    protected readonly confirmationLabel: Signal<string> = computed(() => {
        return this.metadata().confirmationDisplayName ?? this.config.confirmationLabel(this.label());
    });

    /**
     * Whether the repetition is needed: when the password is, or once one is typed, like a new one of an existing entity.
     */
    protected readonly confirmationRequired: Signal<boolean> = computed(() => this.required() || (this.value() ?? '') !== '');

    /**
     * The check that the repetition is the password.
     * @param text - The repetition.
     * @returns The error, or undefined when it matches.
     */
    protected readonly validateConfirmation: InputStringValidation = text => {
        return text === (this.value() ?? '') ? undefined : this.config.mismatchMessage;
    };
}