/**
 * Utilities for amounts of money. Every amount of ngx-ecommerce is an integer in the minor unit of its currency, like
 * cents: 1999 is 19.99 €. Integers add up exactly, which decimal fractions in floating point numbers don't.
 */
export abstract class MoneyUtilities {
    /**
     * Writes an amount in its currency, the way the language writes it, like '19.99 €' or '$19.99'.
     * @param amount - The amount, in the minor unit of the currency, like 1999 for 19.99 €.
     * @param currency - The ISO 4217 code of the currency, like 'EUR'.
     * @param locale - The language it is written in, like 'de', where it is '19,99 €'.
     * @returns The amount as text.
     */
    static format(amount: number, currency: string, locale: string): string {
        const format: Intl.NumberFormat = new Intl.NumberFormat(locale, { style: 'currency', currency });
        // the digits of the minor unit come from the currency, not from the language: 2 for EUR, 0 for JPY and 3 for
        // BHD. Intl knows them from ISO 4217, so they aren't kept in a table of our own.
        const fractionDigits: number = format.resolvedOptions().maximumFractionDigits ?? 2;
        return format.format(amount / (10 ** fractionDigits));
    }

    /**
     * Rounds to a whole minor unit, half away from zero, like commercial rounding: 2.5 cents are 3, -2.5 cents are -3.
     * @param amount - The amount, in the minor unit, which can have a fraction, like a share of a tax.
     * @returns The amount as an integer.
     */
    // Math.round alone rounds half up, which makes -2.5 into -2, so a refund would be rounded differently than the
    // payment it gives back. A small negative amount would become -0, which Intl writes as '-0.00 €'.
    static round(amount: number): number {
        const rounded: number = Math.sign(amount) * Math.round(Math.abs(amount));
        return rounded === 0 ? 0 : rounded;
    }
}