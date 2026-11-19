/**
 * When the user is asked which trackings they allow, unless they chose already: at the first navigation, like the
 * consentGuard on every route, or at their first interaction with the page, like a click, a key or a scroll.
 */
export type ConsentAskOn = 'navigation' | 'interaction';