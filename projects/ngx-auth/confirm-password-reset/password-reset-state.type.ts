/**
 * Where the page that sets a new password stands: checking the link, asking for the password, refusing a link that
 * doesn't work anymore, or done.
 */
export type PasswordResetState = 'verifying' | 'valid' | 'invalid' | 'changed';