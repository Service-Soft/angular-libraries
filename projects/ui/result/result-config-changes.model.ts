import { ResultConfig } from './result-config.model';

/**
 * The values to change in the config of result pages. Everything is optional, including the icon of every single tone.
 */
export type ResultConfigChanges = Partial<Omit<ResultConfig, 'icons'>> & {
    /**
     * The icons to change.
     */
    icons?: Partial<ResultConfig['icons']>
};