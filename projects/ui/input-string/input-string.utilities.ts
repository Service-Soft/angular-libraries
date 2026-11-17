import { InputPasswordStrength } from '@service-soft/ui/input';

// the length from which a password counts as long.
const LONG_PASSWORD_LENGTH: number = 15;

/**
 * Helpers for inputs of text.
 */
export abstract class InputStringUtilities {
    /**
     * Resolves how hard a password is to guess: strong when it is long and mixes capital and small letters, digits and
     * other characters, medium when it does one of them, weak otherwise.
     * @param password - The password.
     * @returns The strength, or undefined for an empty password.
     */
    static resolvePasswordStrength(password: string): InputPasswordStrength | undefined {
        if (password === '') {
            return undefined;
        }
        const long: boolean = password.length >= LONG_PASSWORD_LENGTH;
        const mixed: boolean = this.isMixed(password);
        if (long && mixed) {
            return 'strong';
        }
        return long || mixed ? 'medium' : 'weak';
    }

    private static isMixed(password: string): boolean {
        return /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^\dA-Za-z]/.test(password);
    }
}