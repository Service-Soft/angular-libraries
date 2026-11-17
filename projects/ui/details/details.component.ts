import { Component, computed, ElementRef, inject, input, InputSignal, model, ModelSignal, Signal, viewChild } from '@angular/core';

import { DetailsColor } from './details-color.type';
import { DetailsConfig } from './details-config.model';
import { DETAILS_CONFIG } from './details-config.provider';
import { DetailsVariant } from './details-variant.type';

// like a button: filled in a theme color, its summary is a colored surface, whose text and chevron take the on- colors
// of it, above content in the container color; outlined and plain show the color as their line, and what they are on
// shows through, like the stripe of a row. A filled box keeps a transparent border, so its shape survives forced colors
// mode, where backgrounds are gone. A box clips the background of its summary to its corners, instead of rounding the
// summary, whose bottom corners would then have to switch while the content slides.
const VARIANT_CLASSES: Record<DetailsVariant, string> = {
    outlined: 'group overflow-clip rounded-details border text-on-surface',
    filled: 'group overflow-clip rounded-details border border-transparent bg-surface-container text-on-surface',
    plain: 'group border-b text-on-surface'
};

// the browser hides the content of a closed details with content-visibility. Transitioning it as a discrete property
// keeps the content visible until the content has slid closed, see the template.
const DETAILS_BASE_CLASSES: string = `
    motion-safe:details-content:transition-[content-visibility] motion-safe:details-content:transition-discrete
    motion-safe:details-content:duration-200
`;

// secondary itself is too light for a line on the surface.
const LINE_CLASSES: Record<DetailsColor, string> = {
    neutral: 'border-outline-variant',
    primary: 'border-primary',
    secondary: 'border-secondary-text'
};

/**
 * What the summary of a details section is drawn on.
 */
type SummaryBackground = 'surface' | 'container' | 'primary' | 'secondary';

// it hovers with a background its text keeps a checked contrast on: the other surface, or the hover of its color. The
// focus ring is inside, so on a colored summary it is the on- color.
const SUMMARY_BACKGROUND_CLASSES: Record<SummaryBackground, string> = {
    surface: 'hover:bg-surface-container focus-visible:outline-primary',
    container: 'hover:bg-surface focus-visible:outline-primary',
    primary: 'surface-primary hover:bg-primary-hover focus-visible:outline-on-primary',
    secondary: 'surface-secondary hover:bg-secondary-hover focus-visible:outline-on-secondary'
};

const SUMMARY_BASE_CLASSES: string = `
    flex min-h-12 cursor-pointer list-none items-center gap-3 px-4 py-3 text-body transition
    focus-visible:outline-2 focus-visible:-outline-offset-2
    [&::-webkit-details-marker]:hidden
`;

// in the color on the surface; on a filled one, like its hints, which on a colored surface are of its color already.
const CHEVRON_COLOR_CLASSES: Record<DetailsColor, string> = {
    neutral: 'text-on-surface-variant',
    primary: 'text-primary',
    secondary: 'text-secondary-text'
};

const CHEVRON_BASE_CLASSES: string = 'size-[1.25em] shrink-0 fill-current group-open:rotate-180 motion-safe:transition-transform';

/**
 * A section that the user opens and closes, on a native details element:
 * `<ui-details><ui-summary>Shipping</ui-summary>…</ui-details>`. The `<ui-summary>` is always visible and opens the
 * rest. It is read as a button, so nothing inside it may be interactive, like a link or another button; put those into
 * the part that opens.
 */
@Component({
    selector: 'ui-details',
    templateUrl: './details.component.html',
    host: {
        class: 'block'
    }
})
export class DetailsComponent {
    private readonly config: DetailsConfig = inject(DETAILS_CONFIG);

    private readonly summary: Signal<ElementRef<HTMLElement>> = viewChild.required<ElementRef<HTMLElement>>('summary');

    /**
     * How it looks: a box with a border, a filled box, or plain with a divider below. The default comes from
     * provideDetailsConfig.
     */
    readonly variant: InputSignal<DetailsVariant> = input<DetailsVariant>(this.config.variant);

    /**
     * Its color, like the one of a button: filled, its summary in it, whose text and chevron take the on- colors of it;
     * outlined and plain, its line and its chevron. The default comes from provideDetailsConfig.
     */
    readonly color: InputSignal<DetailsColor> = input<DetailsColor>(this.config.color);

    /**
     * The classes of the details element.
     */
    protected readonly detailsClasses: Signal<string> = computed(() => {
        const variant: DetailsVariant = this.variant();
        // a filled one has its color in the summary, and no line
        const variantClasses: string = variant === 'filled'
            ? VARIANT_CLASSES[variant]
            : `${VARIANT_CLASSES[variant]} ${LINE_CLASSES[this.color()]}`;
        return `${DETAILS_BASE_CLASSES} ${variantClasses}`;
    });

    /**
     * The classes of the summary.
     */
    protected readonly summaryClasses: Signal<string> = computed(() => {
        const variant: DetailsVariant = this.variant();
        const color: DetailsColor = this.color();
        let background: SummaryBackground = 'surface';
        if (variant === 'filled') {
            background = color === 'neutral' ? 'container' : color;
        }
        return `${SUMMARY_BASE_CLASSES} ${SUMMARY_BACKGROUND_CLASSES[background]}`;
    });

    /**
     * The classes of the chevron.
     */
    protected readonly chevronClasses: Signal<string> = computed(() => {
        const color: DetailsColor = this.variant() === 'filled' ? 'neutral' : this.color();
        return `${CHEVRON_BASE_CLASSES} ${CHEVRON_COLOR_CLASSES[color]}`;
    });

    /**
     * Whether it is open. The user opens and closes it, bind it with [(open)] to know or change it.
     */
    readonly open: ModelSignal<boolean> = model(false);

    /**
     * Sections with the same name work like an accordion: opening one closes the others, like the native name.
     */
    readonly name: InputSignal<string | undefined> = input<string>();

    /**
     * Focuses the summary, which opens and closes it.
     * @param options - How to focus it.
     */
    focus(options?: FocusOptions): void {
        this.summary().nativeElement.focus(options);
    }
}