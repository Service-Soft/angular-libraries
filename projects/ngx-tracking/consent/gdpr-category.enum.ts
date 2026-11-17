/**
 * Whether a tracking needs consent, and whether it is allowed in the consent dialog before the user changes anything.
 */
export enum GdprCategory {
    /**
     * Needed for the website to work, like protecting it from abuse. Always on, the user can't turn it off.
     */
    TECHNICAL_NECESSARY = 'technicalNecessary',
    /**
     * Needs consent, and is checked in the consent dialog before the user changes anything.
     */
    ENABLED_BY_DEFAULT = 'enabledByDefault',
    /**
     * Needs consent, and is unchecked in the consent dialog before the user changes anything.
     */
    DISABLED_BY_DEFAULT = 'disabledByDefault'
}