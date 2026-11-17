import { LanguageSwitcherHref } from './language-switcher-href.type';

/**
 * A language the user can switch to.
 */
export type LanguageSwitcherLanguage = {
    /**
     * The code of the language, like 'de' or 'en-GB', which the link gets as its hreflang and lang.
     */
    code: string,
    /**
     * The name of the language in the language itself, like 'Deutsch', which is how its speakers find it.
     */
    label: string,
    /**
     * Where its link goes: a fixed address, or one built from the url of the current page. The href of
     * provideLanguageSwitcherConfig when it has none.
     */
    href?: string | LanguageSwitcherHref
};