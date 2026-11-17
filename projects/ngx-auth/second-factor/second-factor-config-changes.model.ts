import { SecondFactorConfig, SecondFactorLabels } from './second-factor-config.model';

/**
 * The values to change in the config of second factors. Everything is optional, including every single label.
 */
export type SecondFactorConfigChanges = Partial<Omit<SecondFactorConfig, 'labels'>> & {
    /**
     * The labels to change. Methods are changed or added as a whole.
     */
    labels?: Partial<SecondFactorLabels>
};