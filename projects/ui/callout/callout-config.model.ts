import { IconDefinition } from '@service-soft/ui/icon';

import { CalloutTone } from './callout-tone.type';

/**
 * The values a callout uses when its inputs are not set.
 */
export type CalloutConfig = {
    /**
     * What it says about its content.
     */
    tone: CalloutTone,
    /**
     * The icon of each tone.
     */
    icons: Record<CalloutTone, IconDefinition>,
    /**
     * What screen readers read before the content of each tone, like 'Warning', as the color and the icon don't reach
     * them. Undefined for a tone that says nothing of its own, like neutral.
     */
    toneLabels: Record<CalloutTone, string | undefined>
};