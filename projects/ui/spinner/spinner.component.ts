import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';

import { SpinnerConfig } from './spinner-config.model';
import { SPINNER_CONFIG } from './spinner-config.provider';
import { SpinnerSize } from './spinner-size.type';

// on the svg, in em, so it grows with the text around it like an icon, and a button sizes it like its icons.
// Turning is movement, so only with motion-safe: with reduced motion the arc stands still.
const SIZE_CLASSES: Record<SpinnerSize, string> = {
    sm: 'size-[1em] shrink-0 motion-safe:animate-spin',
    md: 'size-[2em] shrink-0 motion-safe:animate-spin',
    lg: 'size-[3em] shrink-0 motion-safe:animate-spin'
};

/**
 * Shows that something is loading whose end isn't known, like the rows of a table. Screen readers announce it as a
 * progress bar with its label. It is sized in em, so it grows with the text around it, and drawn in the primary color.
 * Unset inputs fall back to the values provided with provideSpinnerConfig.
 */
@Component({
    selector: 'ui-spinner',
    templateUrl: './spinner.component.html',
    host: {
        // no box of its own, like an icon, so the spinner sits in the layout as if there was no wrapper.
        class: 'contents'
    }
})
export class SpinnerComponent {
    private readonly config: SpinnerConfig = inject(SPINNER_CONFIG);

    /**
     * What screen readers announce, like 'Loading orders'.
     */
    readonly label: InputSignal<string> = input<string>(this.config.label);

    /**
     * How large it is: as high as a line of text, twice or three times as high.
     */
    readonly size: InputSignal<SpinnerSize> = input<SpinnerSize>(this.config.size);

    /**
     * The tailwind classes of the spinner in its size.
     */
    protected readonly classes: Signal<string> = computed(() => SIZE_CLASSES[this.size()]);
}
