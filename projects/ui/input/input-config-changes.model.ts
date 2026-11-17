import { InputConfig } from './input-config.model';

/**
 * The values to change in the config of inputs. Everything is optional, including every single error message.
 */
export type InputConfigChanges = Partial<Omit<InputConfig, 'errorMessages'>> & {
    /**
     * The error messages to change.
     */
    errorMessages?: Partial<InputConfig['errorMessages']>
};