/**
 * The step that asks for the email and the password.
 */
export type CredentialsStep = {
    /**
     * Asks for the email and the password.
     */
    type: 'credentials'
};

/**
 * The step that asks for the code of a second factor.
 */
export type SecondFactorStep = {
    /**
     * Asks for the code of a second factor.
     */
    type: 'secondFactor',
    /**
     * The ticket that continues the login.
     */
    ticket: string,
    /**
     * The two factor methods the user enrolled.
     */
    methods: string[],
    /**
     * Whether the user just enrolled the method, which the login is confirmed with once more.
     */
    enrolled: boolean
};

/**
 * The step that enrolls the first second factor of a user who has none, which their account needs to log in.
 */
export type EnrollmentStep = {
    /**
     * Enrolls the first second factor.
     */
    type: 'enrollment',
    /**
     * The ticket that continues the login.
     */
    ticket: string
};

/**
 * The step that asks for a new password.
 */
export type PasswordChangeStep = {
    /**
     * Asks for a new password.
     */
    type: 'passwordChange',
    /**
     * The ticket that continues the login.
     */
    ticket: string
};

/**
 * What the login shows: the email and password, then what the login of zibri waits for.
 */
export type LoginStep = CredentialsStep | SecondFactorStep | EnrollmentStep | PasswordChangeStep;