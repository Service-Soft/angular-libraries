import { describe, expect, test } from 'vitest';

import { ChangeValueUtilities } from './change-value.utilities';

const FORMAT: string = 'dd.MM.yyyy HH:mm';

describe('ChangeValueUtilities.format', () => {
    test('formats ISO dates and Date objects, but no other strings as dates', () => {
        expect(ChangeValueUtilities.format('2026-10-12T14:30:00', FORMAT, 'en-US')).toBe('12.10.2026 14:30');
        expect(ChangeValueUtilities.format(new Date(2026, 9, 12, 14, 30), FORMAT, 'en-US')).toBe('12.10.2026 14:30');
        // new Date('1') and new Date('May 2') are valid dates as well
        expect(ChangeValueUtilities.format('1', FORMAT, 'en-US')).toBe('1');
        expect(ChangeValueUtilities.format('May 2', FORMAT, 'en-US')).toBe('May 2');
    });

    test('shows lists of simple values on one line and objects as indented json', () => {
        expect(ChangeValueUtilities.format(['a', 1, true], FORMAT, 'en-US')).toBe('["a", 1, true]');
        expect(ChangeValueUtilities.format([], FORMAT, 'en-US')).toBe('[]');
        expect(ChangeValueUtilities.format({ street: 'Main' }, FORMAT, 'en-US')).toBe('{\n  "street": "Main"\n}');
        expect(ChangeValueUtilities.format([{ id: 1 }], FORMAT, 'en-US')).toBe('[\n  {\n    "id": 1\n  }\n]');
    });

    test('shows simple values as they are and a dash for no value', () => {
        expect(ChangeValueUtilities.format('Jane', FORMAT, 'en-US')).toBe('Jane');
        expect(ChangeValueUtilities.format(42, FORMAT, 'en-US')).toBe('42');
        expect(ChangeValueUtilities.format(false, FORMAT, 'en-US')).toBe('false');
        expect(ChangeValueUtilities.format(undefined, FORMAT, 'en-US')).toBe('-');
        // eslint-disable-next-line unicorn/no-null -- the api sends null for values that were removed
        expect(ChangeValueUtilities.format(null, FORMAT, 'en-US')).toBe('-');
    });
});