import { afterEveryRender, afterRenderEffect, booleanAttribute, Component, computed, ElementRef, inject, input, InputSignal, InputSignalWithTransform, LOCALE_ID, model, ModelSignal, Signal, signal, viewChildren, WritableSignal } from '@angular/core';
import { faCheck, faMinus, faPlus } from '@fortawesome/free-solid-svg-icons';
import { MoneyUtilities } from '@service-soft/ngx-ecommerce/money';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { BaseInputDirective, INPUT_CARD_CLASSES, INPUT_CARD_COLOR_CLASSES, INPUT_CARD_LABEL_CLASSES, INPUT_CHECKBOX_CLASSES, INPUT_CHECKBOX_COLOR_CLASSES, INPUT_CHECKBOX_MARK_CLASSES, INPUT_CHECKBOX_MARK_COLOR_CLASSES, INPUT_SWITCH_CLASSES, INPUT_SWITCH_COLOR_CLASSES, INPUT_SWITCH_THUMB_CLASSES, InputBooleanAppearance, InputColor, InputFieldComponent, InputValidityError } from '@service-soft/ui/input';
import { PRICE_CONFIG } from '@service-soft/ui/price';

import { ExtraOptionContentComponent } from './extra-option-content.component';
import { ExtraOptionType } from './extra-option-type.type';
import { ExtraOptionView } from './extra-option-view.model';
import { ExtraOption } from './extra-option.model';
import { InputExtrasConfig, InputExtrasLabels } from './input-extras-config.model';
import { INPUT_EXTRAS_CONFIG } from './input-extras-config.provider';
import { SelectedExtra } from './selected-extra.model';

// the cards of ui-input-cards, as blocks. A toggle is a label like those, INPUT_CARD_LABEL_CLASSES; a quantity has its
// own focus rings on its input and buttons, so it neither hovers nor shows one around it.
const CARD_DISPLAY_CLASSES: string = 'block';

const QUANTITY_CARD_CLASSES: Record<'editable' | 'readonly', string> = {
    editable: 'bg-surface',
    readonly: 'bg-surface-container'
};

// the box and the switch of ui-input-boolean, without their own focus ring: the card around them shows the focus, also
// in forced colors mode, which draws outlines in its own color.
const IN_CARD_CLASSES: string = 'focus-visible:outline-none';

// the buttons next to it change the quantity, so the spin buttons of the browser would only be a second, smaller way
// to do the same: appearance textfield hides them in Firefox, the pseudo-elements in Chromium and Safari.
const QUANTITY_INPUT_CLASSES: string = `
    text-center [appearance:textfield]
    [&::-webkit-inner-spin-button]:appearance-none
    [&::-webkit-outer-spin-button]:appearance-none
`;

// in the order they are checked. badInput comes first: a text that is no number reads as empty.
const QUANTITY_VALIDITY_ERRORS: readonly InputValidityError[] = ['badInput', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch'];

/**
 * An input for the extras of a booking or order, like breakfast, a parking space or bikes, with its label, hint and
 * validation error. Each extra is a card with its title, description, picture or icon, and its price with what it is
 * for: once, each, or per day. An extra is either on or off, with a checkbox or a switch, or has a quantity, with
 * buttons that add and remove one. Bind its value two-way with [(value)], the chosen extras with their quantities, in
 * the order of the options. Prices are integers in the minor unit of the currency, like cents, written with Intl in
 * the language of the app (LOCALE_ID); the sum of the chosen ones can show below them.
 * The cards are inside a fieldset whose legend is the label. Each is built on a native checkbox or number input, which
 * the browser validates with the min and max of the extra, so a form only submits when every quantity is allowed.
 * Unset inputs fall back to the values provided with provideInputExtrasConfig, the color and the error messages to
 * provideInputConfig and the currency to the one of providePriceConfig, which the prices of ui use as well.
 */
@Component({
    selector: 'ngx-input-extras',
    templateUrl: './input-extras.component.html',
    imports: [InputFieldComponent, IconComponent, ButtonComponent, ExtraOptionContentComponent],
    host: {
        class: 'flex flex-col'
    }
})
export class InputExtrasComponent extends BaseInputDirective<SelectedExtra[]> {
    private readonly extrasConfig: InputExtrasConfig = inject(INPUT_EXTRAS_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    private readonly quantityInputs: Signal<readonly ElementRef<HTMLInputElement>[]> = viewChildren<ElementRef<HTMLInputElement>>(
        'quantityInput'
    );

    // ValidityState isn't a signal, so it is read again after every render. A new object each time, so it is only
    // changed when an error did, which would otherwise render again forever.
    private readonly quantityErrors: WritableSignal<Record<string, InputValidityError>> = signal(
        {},
        { equal: (a, b) => this.haveSameErrors(a, b) }
    );

    /**
     * The texts of the input.
     */
    protected readonly labels: InputExtrasLabels = this.extrasConfig.labels;

    /**
     * The chosen extras with their quantities, in the order of the options.
     */
    readonly value: ModelSignal<SelectedExtra[]> = model<SelectedExtra[]>([]);

    /**
     * The extras to choose from, each shown as a card, in the order they show.
     */
    readonly options: InputSignal<ExtraOption[]> = input.required<ExtraOption[]>();

    /**
     * How many days the booking has, which the price of an extra per day is multiplied with in the sum.
     */
    readonly days: InputSignal<number> = input<number>(1);

    /**
     * Whether at least one extra has to be chosen. Unlike other inputs not by default: extras are optional.
     */
    override readonly required: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether an extra that is on or off has a checkbox, or a switch. The default comes from provideInputExtrasConfig.
     */
    readonly appearance: InputSignal<InputBooleanAppearance> = input<InputBooleanAppearance>(this.extrasConfig.appearance);

    /**
     * Whether the sum of the chosen extras shows below them. The default comes from provideInputExtrasConfig.
     */
    readonly showTotal: InputSignalWithTransform<boolean, unknown> = input(this.extrasConfig.showTotal, { transform: booleanAttribute });

    /**
     * The color of the border of a chosen card and of its checkbox or switch. The default comes from
     * provideInputConfig.
     */
    readonly color: InputSignal<InputColor> = input<InputColor>(this.config.color);

    /**
     * The ISO 4217 code of the currency of the prices, like 'EUR'. The default comes from providePriceConfig of
     * `@service-soft/ui/price`.
     */
    readonly currency: InputSignal<string> = input<string>(inject(PRICE_CONFIG).currency);

    /**
     * The quantity of every chosen extra, by its id.
     */
    protected readonly quantities: Signal<Map<string, number>> = computed(
        () => new Map(this.value().map(extra => [extra.id, extra.quantity]))
    );

    /**
     * Whether an extra that is on or off has a switch.
     */
    protected readonly isSwitch: Signal<boolean> = computed(() => this.appearance() === 'switch');

    /**
     * The tailwind classes of a card of each type.
     */
    protected readonly cardClasses: Signal<Record<ExtraOptionType, string>> = computed(() => {
        const state: 'editable' | 'readonly' = this.readonly() ? 'readonly' : 'editable';
        const card: string = `${INPUT_CARD_CLASSES} ${CARD_DISPLAY_CLASSES} ${INPUT_CARD_COLOR_CLASSES[this.color()]}`;
        return {
            toggle: `${card} ${INPUT_CARD_LABEL_CLASSES[state]}`,
            quantity: `${card} ${QUANTITY_CARD_CLASSES[state]}`
        };
    });

    /**
     * The tailwind classes of the native checkbox of a toggle.
     */
    protected readonly checkboxClasses: Signal<string> = computed(() => this.isSwitch()
        ? `${INPUT_SWITCH_CLASSES} ${IN_CARD_CLASSES} ${INPUT_SWITCH_COLOR_CLASSES[this.color()]}`
        : `${INPUT_CHECKBOX_CLASSES} ${IN_CARD_CLASSES} ${INPUT_CHECKBOX_COLOR_CLASSES[this.color()]}`);

    /**
     * The tailwind classes of the mark of a checked checkbox.
     */
    protected readonly markClasses: Signal<string> = computed(
        () => `${INPUT_CHECKBOX_MARK_CLASSES.checked} ${INPUT_CHECKBOX_MARK_COLOR_CLASSES[this.color()]}`
    );

    /**
     * The tailwind classes of the thumb of a switch.
     */
    protected readonly thumbClasses: Signal<string> = computed(() => INPUT_SWITCH_THUMB_CLASSES[this.color()]);

    /**
     * The options with the ids, texts and state of their cards. The first native element has the id of the input, so a
     * form or a label of the consumer finds it.
     */
    protected readonly cards: Signal<ExtraOptionView[]> = computed(() => {
        const inputId: string = this.inputId();
        const quantities: Map<string, number> = this.quantities();
        const errors: Record<string, InputValidityError> = this.quantityErrors();
        const showsError: boolean = this.showValidationError();
        const groupInvalid: boolean = this.errorMessage() != undefined;
        const locked: boolean = this.disabled() || this.readonly();
        return this.options().map((option, index) => {
            const id: string = index === 0 ? inputId : `${inputId}-${index}`;
            const quantity: number = quantities.get(option.id) ?? 0;
            const validityError: InputValidityError | undefined = errors[option.id];
            const error: string | undefined = showsError && validityError != undefined
                ? this.config.errorMessages[validityError]
                : undefined;
            const describedBy: string[] = [
                ...option.description == undefined ? [] : [`${id}-description`],
                `${id}-price`,
                ...error == undefined ? [] : [`${id}-error`]
            ];
            return {
                option,
                id,
                titleId: `${id}-title`,
                descriptionId: `${id}-description`,
                priceId: `${id}-price`,
                errorId: `${id}-error`,
                describedBy: describedBy.join(' '),
                quantity,
                // 0 is always allowed, it means the extra isn't chosen. The min of the extra is the least once it is,
                // so a quantity between them is the only one that is too small.
                nativeMin: quantity === 0 ? 0 : option.min ?? 0,
                selected: quantity > 0,
                disabled: this.disabled() || option.disabled === true,
                canDecrease: !locked && option.disabled !== true && quantity > 0,
                canIncrease: !locked && option.disabled !== true && (option.max == undefined || quantity < option.max),
                price: MoneyUtilities.format(option.price, this.currency(), this.locale),
                unit: this.labels.units[option.unit],
                error,
                invalid: error != undefined || groupInvalid
            };
        });
    });

    /**
     * The sum of the chosen extras in the currency, a price per day for every day of the booking.
     */
    protected readonly total: Signal<string> = computed(() => {
        const quantities: Map<string, number> = this.quantities();
        // integers all along: prices in minor units times whole quantities and days, so nothing needs rounding.
        const total: number = this.options().reduce((sum, option) => {
            const days: number = option.unit === 'perDay' ? this.days() : 1;
            return sum + (option.price * (quantities.get(option.id) ?? 0) * days);
        }, 0);
        return MoneyUtilities.format(total, this.currency(), this.locale);
    });

    /**
     * The mark of a checked checkbox.
     */
    protected readonly checkIcon: IconDefinition = faCheck;

    /**
     * The icon of the button that removes one.
     */
    protected readonly decreaseIcon: IconDefinition = faMinus;

    /**
     * The icon of the button that adds one.
     */
    protected readonly increaseIcon: IconDefinition = faPlus;

    // the errors of the quantities show at their own cards, so the whole input only has the ones of required and the
    // custom validation.
    /**
     * The errors of the native ValidityState shown below the input: none.
     */
    protected readonly validityErrors: readonly InputValidityError[] = [];

    constructor() {
        super();
        // not a [value] binding: while the user types a quantity, its text often is none yet, like an empty one before
        // the next digit. That reads as 0, and writing it back would put a 0 in front of what they type. So a quantity
        // is only written when it differs from the number the text reads as.
        afterRenderEffect({
            write: () => {
                const quantities: Map<string, number> = this.quantities();
                for (const { nativeElement } of this.quantityInputs()) {
                    const quantity: number = quantities.get(nativeElement.dataset['optionId'] ?? '') ?? 0;
                    if (!nativeElement.validity.badInput && quantity !== this.readTypedQuantity(nativeElement)) {
                        nativeElement.value = String(quantity);
                    }
                }
            }
        });
        afterEveryRender(() => {
            const errors: Record<string, InputValidityError> = {};
            for (const { nativeElement } of this.quantityInputs()) {
                const error: InputValidityError | undefined = QUANTITY_VALIDITY_ERRORS.find(candidate => nativeElement.validity[candidate]);
                if (error != undefined) {
                    errors[nativeElement.dataset['optionId'] ?? ''] = error;
                }
            }
            this.quantityErrors.set(errors);
        });
    }

    /**
     * Switches a toggle on or off.
     * @param option - The extra.
     * @param checked - Whether its native checkbox is checked.
     */
    protected toggle(option: ExtraOption, checked: boolean): void {
        this.setQuantity(option, checked ? 1 : 0);
    }

    /**
     * Adds or removes one of an extra, within its max. Adding to an extra that isn't chosen takes its min, removing
     * from its min leaves it out again.
     * @param option - The extra.
     * @param by - 1 to add one, -1 to remove one.
     */
    protected step(option: ExtraOption, by: number): void {
        const min: number = Math.max(option.min ?? 0, 1);
        const quantity: number = (this.quantities().get(option.id) ?? 0) + by;
        // between 0 and the min nothing is allowed, so adding jumps to the min and removing back to 0. That also fixes
        // a quantity in between that the user typed.
        const jump: number = by > 0 ? min : 0;
        this.setQuantity(option, Math.min(quantity < min ? jump : quantity, option.max ?? Infinity));
    }

    /**
     * Takes the quantity the user typed as the one of an extra.
     * @param option - The extra.
     * @param element - Its native number input.
     */
    protected updateTypedQuantity(option: ExtraOption, element: HTMLInputElement): void {
        // a text that is no number, like 'e', keeps the quantity: the error at the card says what is wrong.
        if (element.validity.badInput) {
            return;
        }
        this.setQuantity(option, this.readTypedQuantity(element));
    }

    /**
     * Keeps a toggle while read only.
     * @param event - The click of a native checkbox, also from the keyboard.
     */
    // a native checkbox ignores readonly. Preventing the click keeps it focusable, which disabled doesn't.
    protected preventWhileReadonly(event: Event): void {
        if (this.readonly()) {
            event.preventDefault();
        }
    }

    /**
     * Resolves the message of the rules the native elements don't check: required, then the custom validation.
     * @returns The message, or undefined when the value meets them.
     */
    // a checkbox only knows whether it is checked itself, not a group of them, so required is a custom error.
    protected override resolveCustomError(): string | undefined {
        return this.required() && this.value().length === 0 ? this.config.errorMessages.valueMissing : super.resolveCustomError();
    }

    /**
     * Resolves the classes the number input of a quantity adds to the ones of every input.
     * @returns The tailwind classes.
     */
    protected override resolveExtraClasses(): string {
        return QUANTITY_INPUT_CLASSES;
    }

    private setQuantity(option: ExtraOption, quantity: number): void {
        const quantities: Map<string, number> = new Map(this.quantities()).set(option.id, quantity);
        // in the order of the options, so the value doesn't depend on the order the user chose them in. Ids of extras
        // that aren't options anymore are left out.
        this.value.set(this.options().flatMap(extra => {
            const extraQuantity: number = quantities.get(extra.id) ?? 0;
            return extraQuantity > 0 ? [{ id: extra.id, quantity: extraQuantity }] : [];
        }));
    }

    // an empty text is none of it.
    private readTypedQuantity(element: HTMLInputElement): number {
        return element.value === '' ? 0 : element.valueAsNumber;
    }

    private haveSameErrors(a: Record<string, InputValidityError>, b: Record<string, InputValidityError>): boolean {
        const entries: [string, InputValidityError][] = Object.entries(a);
        return entries.length === Object.keys(b).length && entries.every(([id, error]) => b[id] === error);
    }
}