/**
 * Builds the address of the current page in a language, like `(url, code) => '/' + code + url` for an app that has a
 * build for every language under its own path, as Angular's i18n makes them.
 * @param url - The url of the current page inside the app, with its query and fragment, like '/orders?page=2'.
 * @param code - The code of the language, like 'de'.
 * @returns The href of the link to the page in that language.
 */
export type LanguageSwitcherHref = (url: string, code: string) => string;