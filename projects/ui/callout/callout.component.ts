import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { CalloutConfig } from './callout-config.model';
import { CALLOUT_CONFIG } from './callout-config.provider';
import { CalloutTone } from './callout-tone.type';

// the transparent border keeps the shape of the box in forced colors mode, which removes backgrounds, and its start is
// the bar in the color of the tone.
const BASE_CLASSES: string = 'flex gap-3 rounded-callout border border-s-4 border-transparent p-4 text-body text-on-surface';

// each tone on its tint, whose contrast to the text, to links in primary and to the icon in the text color of the tone
// is checked. The bar is decorative, the icon and the text for screen readers say the tone, so it may be the lighter
// color itself. Neutral is the container, which holds text and hints like everywhere.
const TONE_CLASSES: Record<CalloutTone, string> = {
    neutral: 'border-s-outline bg-surface-container',
    info: 'border-s-primary bg-primary-tint',
    success: 'border-s-success bg-success-tint',
    warning: 'border-s-warning bg-warning-tint',
    error: 'border-s-error bg-error-tint',
    promo: 'border-s-secondary bg-secondary-tint'
};

// as high as the first line of the text, so the icon stays next to it however long the text gets.
const ICON_BASE_CLASSES: string = 'flex h-[1.5em] shrink-0 items-center [&_svg]:size-[1.25em]';

const ICON_CLASSES: Record<CalloutTone, string> = {
    neutral: 'text-on-surface-variant',
    info: 'text-primary',
    success: 'text-success-text',
    warning: 'text-warning-text',
    error: 'text-error',
    promo: 'text-secondary-text'
};

/**
 * A note in the content of a page that stands out from the text around it, like a hint, a warning or an offer: an icon
 * of its tone, an optional heading and your own content, `<ui-callout tone="warning" heading="Closed on holidays">…</ui-callout>`.
 * It is static content, not a message that appears: screen readers read it where it is, beginning with what its tone
 * means, like 'Warning'.
 * Unset inputs fall back to the values provided with provideCalloutConfig.
 */
@Component({
    selector: 'ui-callout',
    templateUrl: './callout.component.html',
    imports: [IconComponent],
    host: {
        class: 'block'
    }
})
export class CalloutComponent {
    private readonly config: CalloutConfig = inject(CALLOUT_CONFIG);

    /**
     * What it says about its content, which decides its color, its icon and what screen readers read before it. The
     * default comes from provideCalloutConfig.
     */
    readonly tone: InputSignal<CalloutTone> = input<CalloutTone>(this.config.tone);

    /**
     * The heading above the content, like 'Closed on holidays'.
     */
    readonly heading: InputSignal<string | undefined> = input<string>();

    /**
     * The icon at the start. The default is the one of the tone, from provideCalloutConfig.
     */
    readonly icon: InputSignal<IconDefinition | undefined> = input<IconDefinition>();

    /**
     * The icon that shows.
     */
    protected readonly shownIcon: Signal<IconDefinition> = computed(() => this.icon() ?? this.config.icons[this.tone()]);

    /**
     * What screen readers read before the content, like 'Warning'.
     */
    protected readonly toneLabel: Signal<string | undefined> = computed(() => this.config.toneLabels[this.tone()]);

    /**
     * The tailwind classes of the box.
     */
    protected readonly classes: Signal<string> = computed(() => `${BASE_CLASSES} ${TONE_CLASSES[this.tone()]}`);

    /**
     * The tailwind classes around the icon.
     */
    protected readonly iconClasses: Signal<string> = computed(() => `${ICON_BASE_CLASSES} ${ICON_CLASSES[this.tone()]}`);
}