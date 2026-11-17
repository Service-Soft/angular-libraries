import { HeadingLevel } from '@service-soft/ui/heading';

import { ArticleCardLayout } from './article-card-layout.type';

/**
 * The values an article card uses when its inputs are not set.
 */
export type ArticleCardConfig = {
    /**
     * Where the image is.
     */
    layout: ArticleCardLayout,
    /**
     * The level of the heading.
     */
    headingLevel: HeadingLevel
};