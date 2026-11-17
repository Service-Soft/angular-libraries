import { HeadingLevel } from '@service-soft/ui/heading';
import { IconDefinition } from '@service-soft/ui/icon';

import { ResultTone } from './result-tone.type';

/**
 * The values a result page uses when its inputs are not set.
 */
export type ResultConfig = {
    /**
     * What it tells.
     */
    tone: ResultTone,
    /**
     * The level of its heading.
     */
    headingLevel: HeadingLevel,
    /**
     * The icon of each tone.
     */
    icons: Record<ResultTone, IconDefinition>
};