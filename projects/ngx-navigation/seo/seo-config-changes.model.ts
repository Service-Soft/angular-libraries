import { SeoConfig } from './seo-config.model';

/**
 * What provideSeoConfig is given: the origin, and a default image if you like.
 */
export type SeoConfigChanges = Pick<SeoConfig, 'origin'> & Partial<Omit<SeoConfig, 'origin'>>;