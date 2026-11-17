import { HeadingLevel } from '@service-soft/ui/heading';

import { SectionAlign } from './section-align.type';
import { SectionBackground } from './section-background.type';

/**
 * The values a section uses when its inputs are not set.
 */
export type SectionConfig = {
    /**
     * The level of its heading.
     */
    level: HeadingLevel,
    /**
     * Its background.
     */
    background: SectionBackground,
    /**
     * Where its heading stands.
     */
    align: SectionAlign
};