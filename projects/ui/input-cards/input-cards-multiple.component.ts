import { Component, computed, model, ModelSignal, Signal } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { INPUT_CHECKBOX_CLASSES, INPUT_CHECKBOX_COLOR_CLASSES, INPUT_CHECKBOX_MARK_CLASSES, INPUT_CHECKBOX_MARK_COLOR_CLASSES, InputFieldComponent, InputValidityError } from '@service-soft/ui/input';

import { BaseInputCardsDirective } from './base-input-cards.directive';
import { InputCardContentComponent } from './input-card-content.component';

// the box of ui-input-boolean, without its own focus ring: the card around it shows the focus, also in forced colors
// mode, which draws outlines in its own color.
const IN_CARD_CLASSES: string = 'focus-visible:outline-none';

/**
 * An input to choose any of a few options shown as cards, like the extras of a booking, with its label, hint and
 * validation error. The cards look like the ones of ui-input-cards, with a checkbox instead of a radio button. Bind its
 * value two-way with [(value)], the values of the chosen options in the order they were chosen. A required one needs at
 * least one of them.
 * Every card is a label around a native checkbox, inside a fieldset whose legend is the label, so the browser handles
 * the keyboard and Space checks a card.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-cards-multiple',
    templateUrl: './input-cards-multiple.component.html',
    imports: [InputFieldComponent, InputCardContentComponent, IconComponent],
    host: {
        // a container, which the columns of the cards follow
        class: '@container flex flex-col'
    }
})
export class InputCardsMultipleComponent<T> extends BaseInputCardsDirective<T, T[]> {
    /**
     * The values of the chosen options.
     */
    readonly value: ModelSignal<T[]> = model<T[]>([]);

    /**
     * The tailwind classes of a native checkbox.
     */
    protected readonly checkboxClasses: Signal<string> = computed(
        () => `${INPUT_CHECKBOX_CLASSES} ${IN_CARD_CLASSES} ${INPUT_CHECKBOX_COLOR_CLASSES[this.color()]}`
    );

    /**
     * The tailwind classes of the mark of a checked checkbox.
     */
    protected readonly markClasses: Signal<string> = computed(
        () => `${INPUT_CHECKBOX_MARK_CLASSES.checked} ${INPUT_CHECKBOX_MARK_COLOR_CLASSES[this.color()]}`
    );

    /**
     * The mark of a checked checkbox.
     */
    protected readonly checkIcon: IconDefinition = faCheck;

    // a checkbox only knows whether it is checked itself, not a group of them, so required is the custom error.
    /**
     * The errors of the native ValidityState the input checks: none.
     */
    protected readonly validityErrors: readonly InputValidityError[] = [];

    /**
     * Adds the value of an option to the chosen ones, or removes it.
     * @param value - The value of the option.
     * @param checked - Whether its checkbox is checked now.
     */
    protected toggle(value: T, checked: boolean): void {
        this.value.update(values => checked ? [...values, value] : values.filter(chosen => chosen !== value));
    }

    /**
     * Resolves whether a value is missing, then the custom validation.
     * @returns The message, or undefined when the values meet the rules.
     */
    protected override resolveCustomError(): string | undefined {
        return this.required() && !this.value().length ? this.config.errorMessages.valueMissing : super.resolveCustomError();
    }

    /**
     * Whether the value of an option is one of the chosen ones.
     * @param value - The value of the option.
     * @returns Whether its card is checked.
     */
    protected isChosen(value: T): boolean {
        return this.value().includes(value);
    }
}