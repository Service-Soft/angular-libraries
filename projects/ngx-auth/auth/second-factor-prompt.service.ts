import { SecondFactor } from './second-factor.model';

/**
 * Asks the user for a second factor when a request needs one. The package ships one in
 * `@service-soft/ngx-auth/two-factor`; extend it for a ui of your own and load it with the secondFactorPrompt of
 * provideAuth.
 */
export abstract class SecondFactorPrompt {
    /**
     * Asks the user for a second factor.
     * @param methods - The two factor methods the user has enrolled, like 'otp'.
     * @returns The second factor, or undefined when the user cancelled.
     */
    abstract resolveSecondFactor(methods: string[]): Promise<SecondFactor | undefined>;
}