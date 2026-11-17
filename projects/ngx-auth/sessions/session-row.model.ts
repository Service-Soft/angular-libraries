import { UserLogin } from 'zibri-contract';

/**
 * A login of the user, as the list of where they are logged in shows it.
 */
export type SessionRow = {
    /**
     * The login.
     */
    login: UserLogin,
    /**
     * The id of its browser, which its button is described by.
     */
    browserId: string,
    /**
     * The browser it was last used from.
     */
    browser: string,
    /**
     * More about it, like when it was last used and from where.
     */
    detail: string
};