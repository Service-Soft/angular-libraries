import { describe, expect, test } from 'vitest';

import { InputStringUtilities } from './input-string.utilities';

describe('InputStringUtilities.resolvePasswordStrength', () => {
    test('is strong for a long and mixed password, medium for one of them, weak otherwise', () => {
        expect(InputStringUtilities.resolvePasswordStrength('')).toBeUndefined();
        expect(InputStringUtilities.resolvePasswordStrength('secret')).toBe('weak');
        expect(InputStringUtilities.resolvePasswordStrength('Secret-1')).toBe('medium');
        expect(InputStringUtilities.resolvePasswordStrength('horse battery staple')).toBe('medium');
        expect(InputStringUtilities.resolvePasswordStrength('Correct horse battery 1')).toBe('strong');
        // any character that is no letter or digit counts as the other kind, a space too
        expect(InputStringUtilities.resolvePasswordStrength('Secret 1')).toBe('medium');
        expect(InputStringUtilities.resolvePasswordStrength('Secret1')).toBe('weak');
    });
});