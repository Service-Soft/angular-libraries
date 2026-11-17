import { InputExtrasConfig, InputExtrasLabels } from './input-extras-config.model';

/**
 * The values to change in the config of extras inputs. Everything is optional, including every single label and unit.
 */
export type InputExtrasConfigChanges = Partial<Omit<InputExtrasConfig, 'labels'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<Omit<InputExtrasLabels, 'units'>> & {
        /**
         * The units to change.
         */
        units?: Partial<InputExtrasLabels['units']>
    }
};