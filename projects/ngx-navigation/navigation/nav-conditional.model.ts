/**
 * What every element of the navigation can have: a condition for whether it is shown.
 */
export type NavConditional = {
    /**
     * Whether the element is shown, like only for a logged in user. It runs in an injection context, so it can use
     * inject(), and the element follows the signals it reads, like `() => inject(AuthService).isLoggedIn()`.
     * Shown when there is none.
     */
    condition?: () => boolean
};