import { TwoFactorLabels } from './two-factor-config.model';

/**
 * The values to change in the config of two factor methods. Everything is optional, including every single label.
 */
export type TwoFactorConfigChanges = {
    /**
     * The labels to change.
     */
    labels?: Partial<TwoFactorLabels>
};