/**
 * What the auth reads of the error body of zibri: its name, and what a login that waits for a step answers with.
 */
export type AuthErrorBody = {
    /**
     * The name of the error, like 'SecondFactorRequiredError'.
     */
    name: string,
    /**
     * The ticket that continues a login.
     */
    ticket?: string,
    /**
     * The two factor methods the user can present.
     */
    methods?: string[],
    /**
     * The message, in the paragraphs it was written as.
     */
    paragraphs?: string[]
};