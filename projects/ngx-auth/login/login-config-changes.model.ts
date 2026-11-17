import { LoginConfig, LoginLabels } from './login-config.model';

/**
 * The values to change in the config of the login. Everything is optional, including every single label.
 */
export type LoginConfigChanges = Partial<Omit<LoginConfig, 'labels'>> & {
    /**
     * The labels to change.
     */
    labels?: Partial<LoginLabels>
};