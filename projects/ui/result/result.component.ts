import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { HeadingComponent, HeadingLevel } from '@service-soft/ui/heading';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { ResultConfig } from './result-config.model';
import { RESULT_CONFIG } from './result-config.provider';
import { ResultTone } from './result-tone.type';

// a circle filled with the color of the tone under the icon in its on- color, a checked pair, so the icon keeps its
// contrast whatever the surface. The transparent border keeps the circle in forced colors mode, where backgrounds are
// gone. The icon is sized in em by the svg rule, so it grows with the text.
const ICON_BASE_CLASSES: string = 'flex size-16 items-center justify-center rounded-full border-2 border-transparent [&_svg]:size-8';

// every tone has an icon of its own, so the color is never the only cue, and the heading says it in words.
const ICON_TONE_CLASSES: Record<ResultTone, string> = {
    neutral: 'bg-surface-container text-on-surface',
    info: 'bg-primary text-on-primary',
    success: 'bg-success text-on-success',
    warning: 'bg-warning text-on-warning',
    error: 'bg-error text-on-error'
};

/**
 * A centered page or section that tells the result of something, like the thanks for an order, a payment that went
 * through, maintenance or an error: an icon of its tone, a heading, your text and `<ui-result-actions>`, like a link
 * back. The heading is a h1 by default, as such a page is usually all a page shows.
 * Unset inputs fall back to the values provided with provideResultConfig.
 */
@Component({
    selector: 'ui-result',
    templateUrl: './result.component.html',
    imports: [IconComponent, HeadingComponent],
    host: {
        class: 'mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-12 text-center'
    }
})
export class ResultComponent {
    private readonly config: ResultConfig = inject(RESULT_CONFIG);

    /**
     * The heading, which says the result in words, like 'Thank you for your order'.
     */
    // not title, which would stay on the element as its native attribute, a tooltip over the whole result.
    readonly heading: InputSignal<string> = input.required<string>();

    /**
     * What it tells, which sets its icon and color, like the tone of ui-callout.
     */
    readonly tone: InputSignal<ResultTone> = input<ResultTone>(this.config.tone);

    /**
     * The level of the heading: 1 when the result is the page, lower when it is a section of one.
     */
    readonly headingLevel: InputSignal<HeadingLevel> = input<HeadingLevel>(this.config.headingLevel);

    /**
     * The icon in place of the one of the tone, like a wrench for maintenance.
     */
    readonly icon: InputSignal<IconDefinition | undefined> = input<IconDefinition>();

    /**
     * The icon that shows.
     */
    protected readonly shownIcon: Signal<IconDefinition> = computed(() => this.icon() ?? this.config.icons[this.tone()]);

    /**
     * The tailwind classes of the circle around the icon.
     */
    protected readonly iconClasses: Signal<string> = computed(() => `${ICON_BASE_CLASSES} ${ICON_TONE_CLASSES[this.tone()]}`);
}