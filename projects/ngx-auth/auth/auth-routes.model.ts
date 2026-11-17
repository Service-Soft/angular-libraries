/**
 * The routes of the app the auth sends the user to.
 */
export type AuthRoutes = {
    /**
     * Where the user logs in. A guard that needs a login sends them there, with the page they wanted as `returnUrl`.
     */
    login: string,
    /**
     * Where a logged in user goes after logging in, and when they open a page only for users who aren't.
     */
    afterLogin: string,
    /**
     * Where the user goes after logging out.
     */
    afterLogout: string,
    /**
     * Where a logged in user goes when they open a page they lack the role or permission for.
     */
    forbidden: string
};