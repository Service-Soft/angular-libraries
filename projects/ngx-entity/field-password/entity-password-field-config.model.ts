/**
 * The texts of the fields of passwords.
 */
export type EntityPasswordFieldConfig = {
    /**
     * The label of the field that repeats a password, from the label of the password, unless the property names it.
     */
    confirmationLabel: (displayName: string) => string,
    /**
     * The error of the field that repeats a password, while it differs from the password.
     */
    mismatchMessage: string
};