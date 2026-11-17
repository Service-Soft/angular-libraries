import { afterNextRender, booleanAttribute, Component, computed, ElementRef, inject, input, InputSignal, InputSignalWithTransform, Signal } from '@angular/core';

import { ButtonColor } from './button-color.type';
import { ButtonConfig } from './button-config.model';
import { BUTTON_CONFIG } from './button-config.provider';
import { ButtonElevation } from './button-elevation.type';
import { ButtonSize } from './button-size.type';
import { ButtonVariant } from './button-variant.type';

// set by the angular cli and false in production builds, which then leave out everything it guards.
declare const ngDevMode: unknown;

// a min-h instead of a fixed height and no whitespace-nowrap: a label that grows with the user's text size or
// text spacing, or doesn't fit a narrow screen, wraps and makes the button taller instead of overflowing it.
// Icons are svgs anywhere inside, so icon components that wrap one are sized as well. They are sized in em, so they
// grow with the text, and take its color through currentColor.
const BASE_CLASSES: string = `
    inline-flex cursor-pointer items-center justify-center rounded-button border text-center transition
    focus-visible:outline-2 focus-visible:outline-offset-2
    disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none
    aria-disabled:pointer-events-none aria-disabled:opacity-50 aria-disabled:shadow-none
    [&_svg]:size-[1.25em] [&_svg]:shrink-0
`;

// the vertical padding only matters once the label wraps, a single line is centered by the min-h.
const SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'min-h-8 gap-1.5 px-3 py-1 text-label',
    md: 'min-h-10 gap-2 px-4 py-2 text-label',
    lg: 'min-h-12 gap-2 px-6 py-2.5 text-label-lg'
};

// square, and without padding the button still grows when the icon does. The text size sizes the icon.
const ICON_ONLY_SIZE_CLASSES: Record<ButtonSize, string> = {
    sm: 'min-h-8 min-w-8 text-label',
    md: 'min-h-10 min-w-10 text-label',
    lg: 'min-h-12 min-w-12 text-label-lg'
};

// hovering raises the button by one level, the highest one has nothing above it. Pressing pushes it back down to where
// it rests. A disabled button can't be used, so BASE_CLASSES removes its shadow.
const ELEVATION_CLASSES: Record<ButtonElevation, string> = {
    0: '',
    1: 'shadow-1 hover:shadow-2 active:shadow-1',
    2: 'shadow-2 hover:shadow-3 active:shadow-2',
    3: 'shadow-3 hover:shadow-4 active:shadow-3',
    4: 'shadow-4 hover:shadow-5 active:shadow-4',
    5: 'shadow-5'
};

// a shadow under a transparent button would show through it, so elevated outlined and text buttons get the surface as
// fill, whose contrast to their text is checked.
const ELEVATED_VARIANT_CLASSES: Record<ButtonVariant, string> = {
    filled: '',
    outlined: 'bg-surface',
    text: 'bg-surface'
};

// hover and press only switch to the -hover, -tint, -pressed and -tint-pressed tokens, whose pairs have their own
// contrast requirements. secondary is too light for text and focus rings on surfaces, so those use secondary-text, and
// success only just reaches 4.5:1 on the surface, not on its tints, so those use success-text.
// The border of an outlined button is decorative, the label identifies it, so it may use the lighter secondary.
// filled and text buttons have a transparent border: forced colors mode (eg. the contrast themes of Windows)
// removes backgrounds but draws every border, which keeps the shape of the button visible there.
const VARIANT_CLASSES: Record<ButtonVariant, Record<ButtonColor, string>> = {
    filled: {
        primary: `
            border-transparent bg-primary text-on-primary
            hover:bg-primary-hover
            active:bg-primary-pressed
            focus-visible:outline-primary
        `,
        secondary: `
            border-transparent bg-secondary text-on-secondary
            hover:bg-secondary-hover
            active:bg-secondary-pressed
            focus-visible:outline-secondary-text
        `,
        error: 'border-transparent bg-error text-on-error hover:bg-error-hover active:bg-error-pressed focus-visible:outline-error',
        success: `
            border-transparent bg-success text-on-success
            hover:bg-success-hover
            active:bg-success-pressed
            focus-visible:outline-success-text
        `
    },
    outlined: {
        primary: 'border-primary text-primary hover:bg-primary-tint active:bg-primary-tint-pressed focus-visible:outline-primary',
        secondary: `
            border-secondary text-secondary-text
            hover:bg-secondary-tint
            active:bg-secondary-tint-pressed
            focus-visible:outline-secondary-text
        `,
        error: 'border-error text-error hover:bg-error-tint active:bg-error-tint-pressed focus-visible:outline-error',
        success: `
            border-success text-success-text
            hover:bg-success-tint
            active:bg-success-tint-pressed
            focus-visible:outline-success-text
        `
    },
    text: {
        primary: 'border-transparent text-primary hover:bg-primary-tint active:bg-primary-tint-pressed focus-visible:outline-primary',
        secondary: `
            border-transparent text-secondary-text
            hover:bg-secondary-tint
            active:bg-secondary-tint-pressed
            focus-visible:outline-secondary-text
        `,
        error: 'border-transparent text-error hover:bg-error-tint active:bg-error-tint-pressed focus-visible:outline-error',
        success: `
            border-transparent text-success-text
            hover:bg-success-tint
            active:bg-success-tint-pressed
            focus-visible:outline-success-text
        `
    }
};

/**
 * Styles a native button or link as a button.
 * Unset inputs fall back to the values provided with provideButtonConfig.
 */
@Component({
    selector: 'button[ui-button], a[ui-button]',
    templateUrl: './button.component.html',
    host: {
        '[class]': 'classes()',
        '[attr.disabled]': 'isButton && disabled() ? "" : null',
        '[attr.aria-disabled]': '!isButton && disabled() ? "true" : null',
        '[attr.tabindex]': '!isButton && disabled() ? -1 : null',
        '[attr.aria-pressed]': 'pressed()',
        '(click)': 'preventClickWhenDisabled($event)'
    }
})
export class ButtonComponent {
    private readonly config: ButtonConfig = inject(BUTTON_CONFIG);

    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /**
     * Whether the host is a native button. Links can't be disabled natively, so they use aria-disabled instead.
     */
    protected readonly isButton: boolean = this.element.tagName === 'BUTTON';

    /**
     * How much the button stands out.
     */
    readonly variant: InputSignal<ButtonVariant> = input<ButtonVariant>(this.config.variant);

    /**
     * The color token the button is drawn with.
     */
    readonly color: InputSignal<ButtonColor> = input<ButtonColor>(this.config.color);

    /**
     * The height, padding and font size of the button.
     */
    readonly size: InputSignal<ButtonSize> = input<ButtonSize>(this.config.size);

    /**
     * How far the button floats above the surface, from 0 (flat) to 5. Hovering raises it by one level.
     */
    readonly elevation: InputSignal<ButtonElevation> = input<ButtonElevation>(this.config.elevation);

    /**
     * Whether the button can be used. A disabled link can't be focused or clicked.
     */
    readonly disabled: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the button only shows an icon, which makes it square.
     * It has no text that names it, so it needs an aria-label or aria-labelledby, which development builds check.
     */
    readonly iconOnly: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Makes the button a toggle button, which is pressed while this is true and drawn filled then. Screen readers
     * announce whether it is pressed. Leave it unset for a button that does something instead of switching a state.
     */
    readonly pressed: InputSignal<boolean | undefined> = input<boolean>();

    // a pressed toggle button is filled, which sets it apart from an unpressed outlined or text button by its shape as
    // well, not only by its color.
    private readonly drawnVariant: Signal<ButtonVariant> = computed(() => this.pressed() === true ? 'filled' : this.variant());

    /**
     * The tailwind classes for the current variant, color, size and elevation.
     */
    protected readonly classes: Signal<string> = computed(() => {
        return [
            BASE_CLASSES,
            this.iconOnly() ? ICON_ONLY_SIZE_CLASSES[this.size()] : SIZE_CLASSES[this.size()],
            VARIANT_CLASSES[this.drawnVariant()][this.color()],
            ELEVATION_CLASSES[this.elevation()],
            this.elevation() > 0 ? ELEVATED_VARIANT_CLASSES[this.drawnVariant()] : ''
        ].join(' ');
    });

    constructor() {
        // checked once it rendered, so bound aria attributes are set as well.
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            afterNextRender(() => this.validateAccessibleName());
        }
    }

    /**
     * Stops clicks on a disabled link, which the browser would otherwise follow.
     * @param event - The click event.
     */
    protected preventClickWhenDisabled(event: Event): void {
        if (!this.disabled()) {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
    }

    // the label is the only name an icon-only button can have, other than an aria-labelledby. Thrown errors go to the
    // ErrorHandler, which logs them without breaking the app.
    private validateAccessibleName(): void {
        const label: string | undefined = this.element.getAttribute('aria-label')?.trim();
        if (!this.iconOnly() || label || this.element.hasAttribute('aria-labelledby')) {
            return;
        }
        throw new Error('An iconOnly ui-button needs an aria-label or aria-labelledby, it has no text that screen readers could read.');
    }
}