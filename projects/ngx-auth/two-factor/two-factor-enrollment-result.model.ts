import { LoginResult } from '@service-soft/ngx-auth/auth';

/**
 * What an enrollment did once its method is on.
 */
export type TwoFactorEnrollmentResult = {
    /**
     * The name of the method, like 'otp'.
     */
    method: string,
    /**
     * Where the login of the ticket stands: logged in, or waiting for a new password. Undefined for an enrollment
     * without a ticket.
     */
    loginResult: LoginResult | undefined
};