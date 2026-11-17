import { ConsentConfig } from './consent-config.model';

/**
 * The config of the consent. Only the trackings and the ui have no default.
 */
export type ConsentConfigChanges = Pick<ConsentConfig, 'trackings' | 'ui'> & Partial<ConsentConfig>;