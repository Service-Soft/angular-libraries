/**
 * A language of the switcher with the link to the current page in it.
 */
export type LanguageSwitcherItem = {
    /**
     * The code of the language, the hreflang and lang of the link.
     */
    code: string,
    /**
     * The name of the language in the language itself.
     */
    label: string,
    /**
     * The address of the current page in the language.
     */
    href: string,
    /**
     * Whether it is the language of the page.
     */
    isCurrent: boolean
};