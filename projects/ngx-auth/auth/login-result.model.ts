/**
 * What a step of a login answers: logged in, or what the login waits for. The ticket continues it, for 5 minutes.
 */
export type LoginResult = {
    /**
     * The user is logged in.
     */
    type: 'loggedIn'
} | {
    /**
     * The login waits for a second factor.
     */
    type: 'secondFactorRequired',
    /**
     * What continues the login.
     */
    ticket: string,
    /**
     * The two factor methods the user can present, like 'otp'. Empty when they have to enroll one first.
     */
    methods: string[]
} | {
    /**
     * The login waits for a new password.
     */
    type: 'passwordChangeRequired',
    /**
     * What continues the login.
     */
    ticket: string
};