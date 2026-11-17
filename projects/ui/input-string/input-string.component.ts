import { booleanAttribute, Component, computed, input, InputSignal, InputSignalWithTransform, model, ModelSignal, signal, Signal, WritableSignal } from '@angular/core';
import { faEye, faEyeSlash, faMagnifyingGlass, faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { BaseInputDirective, InputFieldComponent, InputPasswordStrength, InputUtilities, InputValidityError } from '@service-soft/ui/input';

import { InputMode } from './input-mode.type';
import { InputStringType } from './input-string-type.type';
import { InputStringUtilities } from './input-string.utilities';

// room for the button that shows a password, so the text never runs under it.
const PASSWORD_CLASSES: string = 'pe-11';

// room for the icon at the start and the button that empties it at the end, also while there is no button, so the
// text doesn't move when it shows. Chromium and Safari draw a button of their own into a search input, which this one
// replaces, so it looks and is named the same in every browser.
const SEARCH_CLASSES: string = 'ps-9 pe-11 [&::-webkit-search-cancel-button]:appearance-none';

// decorative, the label says what the input is for. In the color of a placeholder, which is checked on both
// backgrounds of an input.
const SEARCH_ICON_CLASSES: string = `
    pointer-events-none absolute inset-y-0 inset-s-3 my-auto flex items-center text-body text-on-surface-variant
    [&_svg]:size-[1em]
`;

// an icon inside the input rather than a text button, whose fill on hover and while pressed would cover the border of
// the input, like the one that shows a password or the one that empties a search. Hover only darkens the icon, both
// colors are checked on the surface. Whether the one of a password is pressed shows by the icon, an eye or a crossed
// out one. The icon is sized in em, so it grows with the text.
const INNER_BUTTON_CLASSES: string = `
    absolute inset-y-0 inset-e-2 my-auto flex min-h-7 min-w-7 cursor-pointer items-center justify-center rounded-full text-body
    text-on-surface-variant transition-colors
    hover:text-on-surface
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
    disabled:pointer-events-none disabled:opacity-50
    [&_svg]:size-[1em]
`;

// how many of the bars of the strength meter are filled, and in which color. The text says the same, so the color
// isn't the only cue.
const STRENGTH_BARS: Record<InputPasswordStrength, number> = { weak: 1, medium: 2, strong: 3 };
const STRENGTH_CLASSES: Record<InputPasswordStrength, string> = {
    weak: 'h-1 flex-1 rounded-full bg-error',
    medium: 'h-1 flex-1 rounded-full bg-warning',
    strong: 'h-1 flex-1 rounded-full bg-success'
};
const EMPTY_BAR_CLASSES: string = 'h-1 flex-1 rounded-full bg-outline-variant';
const BAR_COUNT: number = 3;

/**
 * An input for text, like a name, an email address or a password, with its label, hint and validation error.
 * Bind its value two-way with [(value)]. The browser validates it like any native input, so a form only submits when it
 * is valid. The error shows once the user left the input or tried to submit its form, or when showValidationError is
 * set to true.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-string',
    templateUrl: './input-string.component.html',
    imports: [IconComponent, InputFieldComponent],
    host: {
        class: 'flex flex-col'
    }
})
export class InputStringComponent extends BaseInputDirective<string> {
    /**
     * The text of the input.
     */
    readonly value: ModelSignal<string> = model('');

    /**
     * What kind of text the input is for. It sets the keyboard on phones and what autofill offers, and the browser
     * checks the format of email and url.
     */
    readonly type: InputSignal<InputStringType> = input<InputStringType>('text');

    /**
     * The least number of characters. An empty text is only checked by required.
     */
    readonly minLength: InputSignal<number | undefined> = input<number>();

    /**
     * The most number of characters. Like the native maxlength, the browser doesn't let the user type more, and a
     * longer text set from code is invalid.
     */
    readonly maxLength: InputSignal<number | undefined> = input<number>();

    /**
     * A regular expression the whole text has to match, like the native pattern.
     */
    readonly pattern: InputSignal<string | undefined> = input<string>();

    /**
     * The keyboard phones show, like 'numeric' for a code of digits. Without it, the one of the type.
     */
    readonly inputMode: InputSignal<InputMode | undefined> = input<InputMode>();

    /**
     * Whether a password input shows how hard the password is to guess, below it, like for a new password.
     */
    readonly passwordStrength: InputSignalWithTransform<boolean, unknown> = input(
        this.config.passwordStrength,
        { transform: booleanAttribute }
    );

    /**
     * Whether the input is for a password, which gets a button that shows it.
     */
    protected readonly isPassword: Signal<boolean> = computed(() => this.type() === 'password');

    /**
     * Whether the strength of the password shows.
     */
    protected readonly showsStrength: Signal<boolean> = computed(() => this.isPassword() && this.passwordStrength());

    /**
     * How hard the password is to guess, nothing while it is empty.
     */
    private readonly strength: Signal<InputPasswordStrength | undefined> = computed(() => {
        return InputStringUtilities.resolvePasswordStrength(this.value());
    });

    /**
     * The text that says how hard the password is to guess.
     */
    protected readonly strengthLabel: Signal<string> = computed(() => {
        const strength: InputPasswordStrength | undefined = this.strength();
        return strength == undefined ? '' : this.config.passwordStrengthLabels[strength];
    });

    /**
     * The tailwind classes of each bar of the strength meter.
     */
    protected readonly strengthBarClasses: Signal<string[]> = computed(() => {
        const strength: InputPasswordStrength | undefined = this.strength();
        const filled: number = strength == undefined ? 0 : STRENGTH_BARS[strength];
        return Array.from({ length: BAR_COUNT }, (_, index) => {
            return strength != undefined && index < filled ? STRENGTH_CLASSES[strength] : EMPTY_BAR_CLASSES;
        });
    });

    /**
     * Whether the password shows as text.
     */
    protected readonly passwordShown: WritableSignal<boolean> = signal(false);

    /**
     * The type of the native input: text while a password shows.
     */
    protected readonly nativeType: Signal<InputStringType> = computed(() => {
        return this.isPassword() && this.passwordShown() ? 'text' : this.type();
    });

    /**
     * The name of the button that shows the password. Pressed while it shows, so the name stays the same.
     */
    protected readonly showPasswordLabel: string = this.config.showPasswordLabel;

    /**
     * The tailwind classes of the buttons inside the input, which show the password or empty the search.
     */
    protected readonly innerButtonClasses: string = INNER_BUTTON_CLASSES;

    /**
     * The icon of the button that shows the password.
     */
    protected readonly passwordIcon: Signal<IconDefinition> = computed(() => this.passwordShown() ? faEyeSlash : faEye);

    /**
     * Whether the input is for a search, which gets an icon at its start and a button that empties it.
     */
    protected readonly isSearch: Signal<boolean> = computed(() => this.type() === 'search');

    /**
     * Whether the button that empties the search shows: while there is something to empty, and it can be changed.
     */
    protected readonly showsClearButton: Signal<boolean> = computed(() => {
        return this.isSearch() && this.value() !== '' && !this.disabled() && !this.readonly();
    });

    /**
     * The tailwind classes of the icon at the start of a search.
     */
    protected readonly searchIconClasses: string = SEARCH_ICON_CLASSES;

    /**
     * The icon at the start of a search.
     */
    protected readonly searchIcon: IconDefinition = faMagnifyingGlass;

    /**
     * The icon of the button that empties a search.
     */
    protected readonly clearIcon: IconDefinition = faXmark;

    /**
     * The name of the button that empties a search.
     */
    protected readonly clearSearchLabel: string = this.config.clearSearchLabel;

    /**
     * The errors of the native ValidityState a text can have, in the order they are checked.
     */
    protected readonly validityErrors: readonly InputValidityError[] = [
        'valueMissing',
        'badInput',
        'typeMismatch',
        'tooShort',
        'tooLong',
        'patternMismatch'
    ];

    /**
     * Resolves the message of the length rules and the custom validation for the current text.
     * @returns The message, or undefined when the text meets them.
     */
    protected override resolveCustomError(): string | undefined {
        return InputUtilities.resolveLengthError(this.value(), this.minLength(), this.maxLength(), this.config)
            ?? super.resolveCustomError();
    }

    /**
     * Empties the search, and keeps the focus in the input, as the button that had it is gone then.
     */
    protected clearSearch(): void {
        this.value.set('');
        this.focus();
    }

    /**
     * Resolves the room for the button that shows a password, or the icon and the button of a search.
     * @returns The tailwind classes.
     */
    protected override resolveExtraClasses(): string {
        if (this.isSearch()) {
            return SEARCH_CLASSES;
        }
        return this.isPassword() ? PASSWORD_CLASSES : '';
    }
}