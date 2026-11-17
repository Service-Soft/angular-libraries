/**
 * That the form wants the code of a method sent, which the component around it sends.
 */
export type SecondFactorCodeRequest = {
    /**
     * The name of the method, like 'email'.
     */
    method: string,
    /**
     * Whether the user asked for a new code, rather than picked the method.
     */
    again: boolean
};