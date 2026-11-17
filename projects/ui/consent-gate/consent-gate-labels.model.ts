/**
 * The texts of the placeholder of a consent gate, with the name of its provider.
 */
export type ConsentGateLabels = {
    /**
     * The title, like 'Content from Google Maps'.
     */
    title: string,
    /**
     * Why the content needs consent.
     */
    description: string,
    /**
     * The link to the privacy policy of the provider.
     */
    providerPrivacyPolicy: string,
    /**
     * The button that loads the content this once.
     */
    load: string,
    /**
     * The button that always allows the provider.
     */
    alwaysAllow: string
};