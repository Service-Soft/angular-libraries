import { describe, expect, test } from 'vitest';

import { MoneyUtilities } from './money.utilities';

// Intl puts non-breaking spaces into some formats, like the one before € in German, so they never wrap apart.
function format(amount: number, currency: string, locale: string): string {
    return MoneyUtilities.format(amount, currency, locale).replaceAll(' ', ' ');
}

describe('MoneyUtilities', () => {
    test('writes an amount of minor units in the digits of its currency and the format of the language', () => {
        expect(format(1999, 'EUR', 'de')).toBe('19,99 €');
        expect(format(1999, 'USD', 'en')).toBe('$19.99');
        // the yen has no minor unit, the dinar of Bahrain three digits of one
        expect(format(1999, 'JPY', 'en')).toBe('¥1,999');
        expect(format(1999, 'BHD', 'en')).toBe('BHD 1.999');
    });

    test('rounds half away from zero, without a negative zero', () => {
        expect(MoneyUtilities.round(2.5)).toBe(3);
        expect(MoneyUtilities.round(-2.5)).toBe(-3);
        expect(MoneyUtilities.round(2.4)).toBe(2);
        expect(Object.is(MoneyUtilities.round(-0.4), 0)).toBe(true);
    });
});