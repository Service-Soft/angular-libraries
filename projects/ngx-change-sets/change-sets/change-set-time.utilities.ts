import { ChangeSet } from 'zibri-contract';

const NANOSECONDS_PER_MILLISECOND: bigint = 1_000_000n;

/**
 * Reads when change sets happened, from the nanoseconds zibri sends as a string.
 */
export abstract class ChangeSetTimeUtilities {
    /**
     * Resolves when a change set happened as a date, which has milliseconds only.
     * @param changeSet - The change set.
     * @returns The date.
     */
    static resolveDate(changeSet: ChangeSet): Date {
        return new Date(Number(BigInt(changeSet.createdAt) / NANOSECONDS_PER_MILLISECOND));
    }

    /**
     * Compares two change sets to sort them newest first, by every nanosecond: change sets of one request often share
     * their millisecond.
     * @param a - The one change set.
     * @param b - The other change set.
     * @returns A negative number when a is newer, a positive one when b is, and 0 when both happened at once.
     */
    static compareNewestFirst(a: ChangeSet, b: ChangeSet): number {
        const difference: bigint = BigInt(b.createdAt) - BigInt(a.createdAt);
        return difference === 0n ? 0 : difference > 0n ? 1 : -1;
    }
}