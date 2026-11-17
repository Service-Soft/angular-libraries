import { LoginProvider } from './login-provider.model';

/**
 * The texts of the login. The texts of the code of a second factor come from provideSecondFactorConfig, the ones of
 * enrolling it from provideTwoFactorConfig.
 */
export type LoginLabels = {
    /**
     * The heading of the login.
     */
    title: string,
    /**
     * The label of the email input.
     */
    email: string,
    /**
     * The label of the password input.
     */
    password: string,
    /**
     * The button that logs in.
     */
    login: string,
    /**
     * The link to the page that sends a link to reset the password.
     */
    forgotPassword: string,
    /**
     * The button that logs in with a passkey.
     */
    loginWithPasskey: string,
    /**
     * The heading while the login waits for a second factor.
     */
    secondFactorTitle: string,
    /**
     * Shown when zibri enrolled the first second factor without completing the login, which then waits for its next
     * code, like with an auth service of the app's own.
     */
    enrolledMessage: string,
    /**
     * The heading while the user enrolls their first second factor, which their account needs to log in.
     */
    enrollmentTitle: string,
    /**
     * Says why the user enrolls a second factor, above the methods to choose from.
     */
    enrollmentMessage: string,
    /**
     * The button that goes back to the email and password, like when the login took too long.
     */
    back: string,
    /**
     * The heading while the login waits for a new password.
     */
    passwordChangeTitle: string,
    /**
     * Says why the user has to choose a new password.
     */
    passwordChangeMessage: string,
    /**
     * The label of the input of the new password.
     */
    newPassword: string,
    /**
     * The button that sets the new password and logs in.
     */
    changePassword: string,
    /**
     * Shown when a request failed without a message of zibri, like without a connection.
     */
    failed: string
};

/**
 * How the login looks and works. Which two factor methods it asks for and enrolls comes from
 * provideSecondFactorConfig.
 */
export type LoginConfig = {
    /**
     * The texts of the login.
     */
    labels: LoginLabels,
    /**
     * The route of the page that sends a link to reset the password, or undefined for an app without passwords to
     * reset, which shows no link.
     */
    requestPasswordResetRoute: string | undefined,
    /**
     * The name of the passkey authenticator of zibri, which shows a button that logs in with a passkey, or undefined for
     * an app without one.
     */
    passkeyAuthenticator: string | undefined,
    /**
     * The providers to log in at. The browser comes back to the route of the login with a code, which the login
     * completes, so add that route to the allowedRedirects of zibri.
     */
    providers: LoginProvider[],
    /**
     * The least number of characters of a new password, the minLength of the password policy of zibri. Without it,
     * zibri says what is too short.
     */
    newPasswordMinLength: number | undefined
};