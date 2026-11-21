import { GdprCategory } from './gdpr-category.enum';

/**
 * The texts of the consent dialog, to translate them.
 */
export type ConsentDialogLabels = {
    /**
     * The heading of the dialog, which is its name for screen readers as well.
     */
    title: string,
    /**
     * The button that allows every tracking.
     */
    allowAll: string,
    /**
     * The button that allows only the technically necessary trackings.
     */
    onlyRequired: string,
    /**
     * The button that saves what the user checked.
     */
    saveChoices: string,
    /**
     * What each category is called, like 'Marketing'.
     */
    categories: Record<GdprCategory, string>,
    /**
     * The link to the privacy policy.
     */
    privacy: string,
    /**
     * The link to the imprint.
     */
    imprint: string,
    /**
     * The message when the browser asked not to be tracked and every tracking that needs consent was turned off.
     */
    doNotTrackNotice: string
};

/**
 * What the consent dialog shows.
 */
export type ConsentDialogConfig = {
    /**
     * The text above the choices, as paragraphs, like what is tracked and that the choices can be changed later.
     */
    paragraphs: string[],
    /**
     * The url of the privacy policy, which opens in a new tab.
     */
    privacyUrl: string,
    /**
     * The url of the imprint, which opens in a new tab.
     */
    imprintUrl: string,
    /**
     * Whether the user only chooses categories, instead of every single tracking.
     */
    showOnlyCategories: boolean,
    /**
     * The texts of the dialog.
     */
    labels: ConsentDialogLabels
};