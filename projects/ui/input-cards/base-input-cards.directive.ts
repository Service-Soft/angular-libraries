import { computed, contentChild, Directive, input, InputSignal, Signal } from '@angular/core';
import { BaseInputDirective, INPUT_CARD_CLASSES, INPUT_CARD_COLOR_CLASSES, INPUT_CARD_LABEL_CLASSES, InputColor } from '@service-soft/ui/input';

import { InputCardMetaDirective } from './input-card-meta.directive';
import { InputCardOption } from './input-card-option.model';
import { InputCardView } from './input-card-view.model';

// the label is the card, so a click anywhere on it chooses the option. The image at its top is cut to its corners.
const CARD_LAYOUT_CLASSES: string = 'flex flex-col overflow-hidden';

/**
 * What the cards inputs share: options shown as cards, each a label around a native radio button or checkbox, inside
 * a fieldset whose legend is the label of the input.
 */
@Directive()
export abstract class BaseInputCardsDirective<T, V> extends BaseInputDirective<V> {
    /**
     * The options to choose from, each shown as a card, in the order they show.
     */
    readonly options: InputSignal<InputCardOption<T>[]> = input.required<InputCardOption<T>[]>();

    /**
     * The color of the border of a chosen card and of its radio button or checkbox. The default comes from
     * provideInputConfig.
     */
    readonly color: InputSignal<InputColor> = input(this.config.color);

    /**
     * What every card shows at its end, like a price.
     */
    protected readonly meta: Signal<InputCardMetaDirective<T> | undefined> = contentChild(InputCardMetaDirective<T>);

    /**
     * The options with the ids of their cards. The first native element has the id of the input, so a form or a label
     * of the consumer finds it.
     */
    protected readonly cards: Signal<InputCardView<T>[]> = computed(() => {
        const inputId: string = this.inputId();
        const hasMeta: boolean = this.meta() != undefined;
        return this.options().map((option, index) => {
            const id: string = index === 0 ? inputId : `${inputId}-${index}`;
            const descriptionId: string = `${id}-description`;
            const metaId: string = `${id}-meta`;
            const describedBy: string[] = [
                ...option.description == undefined ? [] : [descriptionId],
                ...hasMeta ? [metaId] : []
            ];
            return {
                option,
                id,
                chosen: this.isChosen(option.value),
                disabled: this.disabled() || option.disabled === true,
                titleId: `${id}-title`,
                describedBy: describedBy.length ? describedBy.join(' ') : undefined,
                descriptionId,
                metaId
            };
        });
    });

    /**
     * The name of the native radio buttons or checkboxes, which makes radio buttons one group: the name of the input, or
     * its id when it has none.
     */
    protected readonly groupName: Signal<string> = computed(() => this.name() ?? this.inputId());

    /**
     * The tailwind classes of a card.
     */
    protected readonly cardClasses: Signal<string> = computed(() => {
        const label: string = INPUT_CARD_LABEL_CLASSES[this.readonly() ? 'readonly' : 'editable'];
        return `${INPUT_CARD_CLASSES} ${CARD_LAYOUT_CLASSES} ${label} ${INPUT_CARD_COLOR_CLASSES[this.color()]}`;
    });

    /**
     * Keeps the value while read only.
     * @param event - The click of a native radio button or checkbox, also from the keyboard.
     */
    // native radio buttons and checkboxes ignore readonly. Preventing the click keeps them focusable and submitted, which
    // disabled doesn't.
    protected preventWhileReadonly(event: Event): void {
        if (this.readonly()) {
            event.preventDefault();
        }
    }

    /**
     * Whether the value of an option is chosen.
     * @param value - The value of the option.
     * @returns Whether its card is checked.
     */
    protected abstract isChosen(value: T): boolean;
}