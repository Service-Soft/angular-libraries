/**
 * The values a consent gate uses when its inputs are not set, and its texts.
 */
export type ConsentGateConfig = {
    /**
     * The url of your privacy policy, linked below the text, or undefined for no link.
     */
    privacyPolicyUrl: string | undefined,
    /**
     * Whether there is a button that always allows content of the provider, which the app keeps.
     */
    alwaysAllow: boolean,
    /**
     * The ratio of the width to the height, like '16 / 9', which the placeholder keeps as well, or undefined for the
     * height of what is shown.
     */
    aspectRatio: string | undefined,
    /**
     * The title of the placeholder.
     * @param provider - The name of the provider, like 'Google Maps'.
     * @returns The text, like 'Content from Google Maps'.
     */
    title: (provider: string) => string,
    /**
     * Why the content needs consent.
     * @param provider - The name of the provider.
     * @returns The text.
     */
    description: (provider: string) => string,
    /**
     * The link to your privacy policy.
     */
    privacyPolicyLabel: string,
    /**
     * The link to the privacy policy of the provider.
     * @param provider - The name of the provider.
     * @returns The text, like 'Privacy policy of Google Maps'.
     */
    providerPrivacyPolicyLabel: (provider: string) => string,
    /**
     * The button that loads the content this once.
     * @param provider - The name of the provider.
     * @returns The text, like 'Load Google Maps'.
     */
    loadLabel: (provider: string) => string,
    /**
     * The button that loads the content and always allows the provider.
     * @param provider - The name of the provider.
     * @returns The text, like 'Always allow Google Maps'.
     */
    alwaysAllowLabel: (provider: string) => string
};