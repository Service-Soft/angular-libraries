/**
 * A second factor the user presents, like the code of their authenticator app.
 */
export type SecondFactor = {
    /**
     * The name of the two factor method, like 'otp'.
     */
    method: string,
    /**
     * The code.
     */
    code: string
};