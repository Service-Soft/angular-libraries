/**
 * The paths of the auth routes below the apiUrl, as the AuthController of zibri serves them.
 */
export type AuthPaths = {
    /**
     * Logs in with the credentials of an authenticator.
     */
    login: string,
    /**
     * Gets a new access token or renews the session.
     */
    refreshLogin: string,
    /**
     * Ends the login of this browser.
     */
    logout: string,
    /**
     * The logged in user and their permissions.
     */
    currentUser: string,
    /**
     * The csrf token of a cookie login, after a reload.
     */
    csrfToken: string,
    /**
     * Sends the code of a second factor while a login waits for it, like by email.
     */
    loginSecondFactorRequest: string,
    /**
     * Continues a login with its second factor.
     */
    loginSecondFactorConfirm: string,
    /**
     * Continues a login with a new password.
     */
    loginChangePassword: string,
    /**
     * The two factor methods the user has enrolled.
     */
    twoFactorRegistrations: string,
    /**
     * Starts the enrollment of a two factor method, like with the qr code of an authenticator app.
     */
    twoFactorRegistrationRequest: string,
    /**
     * Completes the enrollment of a two factor method with its first code.
     */
    twoFactorRegistrationConfirm: string,
    /**
     * Removes an enrolled two factor method, followed by its name.
     */
    twoFactorRegistration: string,
    /**
     * Starts the enrollment of the first two factor method of a login that waits for one.
     */
    loginTwoFactorRegistrationRequest: string,
    /**
     * Completes the enrollment of the first two factor method of a login that waits for one.
     */
    loginTwoFactorRegistrationConfirm: string,
    /**
     * Sends the code of a second factor for a request that needs one, like by email.
     */
    secondFactorRequest: string,
    /**
     * Answers the challenge of a login with a passkey.
     */
    loginOptions: string,
    /**
     * Starts the registration of a new account with a passkey.
     */
    registrationRequest: string,
    /**
     * Completes the registration of a new account with a passkey, and answers its ticket.
     */
    registrationConfirm: string,
    /**
     * Where the browser starts a login at a provider.
     */
    federatedLoginRequest: string,
    /**
     * Starts connecting a provider or a passkey to the account of the logged in user.
     */
    linkIdentityRequest: string,
    /**
     * Completes adding a passkey to the account of the logged in user.
     */
    linkIdentityConfirm: string,
    /**
     * The identities linked to the logged in user, and, followed by the id of one, unlinking it.
     */
    identities: string,
    /**
     * The logins of the logged in user, and, followed by the id of one, ending it.
     */
    logins: string,
    /**
     * Ends every login of the logged in user, the one of this browser too.
     */
    logoutEverywhere: string,
    /**
     * Mails the logged in user a link to verify their email.
     */
    requestEmailVerification: string,
    /**
     * Mails a link to the email the logged in user wants to change to.
     */
    requestEmailChange: string,
    /**
     * Confirms the link of an email, whatever it is for.
     */
    confirmEmail: string,
    /**
     * Mails a link to set a new password.
     */
    requestPasswordReset: string,
    /**
     * Whether the token of such a link still works.
     */
    verifyPasswordResetToken: string,
    /**
     * Sets the new password with the token of the link.
     */
    confirmPasswordReset: string,
    /**
     * Changes the password of the logged in user.
     */
    changePassword: string
};