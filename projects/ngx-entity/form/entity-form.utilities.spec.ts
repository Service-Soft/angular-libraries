import { EntityUtilities, Property } from '@service-soft/ngx-entity/entity';
import { describe, expect, test } from 'vitest';

import { EntityFormTab } from './entity-form-layout.model';
import { EntityFormUtilities } from './entity-form.utilities';

class Customer {
    @Property.string({ displayName: 'Id', omitForCreate: true, readonly: true })
    id!: string;

    @Property.string({ displayName: 'Last name', position: { row: 1, order: 2 } })
    lastName!: string;

    @Property.string({ displayName: 'First name', position: { row: 1, order: 1 }, defaultWidths: [4, 6, 12] })
    firstName!: string;

    @Property.string({ displayName: 'Notes', required: false })
    notes?: string;

    @Property.string({ displayName: 'Street', position: { tab: 2, tabName: 'Address', row: 1 } })
    street!: string;

    @Property.string({ displayName: 'Invoice email', position: { tab: 3 }, required: customer => customer.company != undefined })
    invoiceEmail?: string;

    @Property.string({ displayName: 'Company', required: false, display: customer => customer.notes !== 'private' })
    company?: string;
}

function resolveLayout(mode: 'create' | 'update', values: Partial<Customer> = {}): EntityFormTab<Customer>[] {
    return EntityFormUtilities.resolveTabs(EntityUtilities.resolveProperties(Customer), mode, values, tab => `Part ${tab}`);
}

function resolveKeys(tabs: EntityFormTab<Customer>[]): string[][][] {
    return tabs.map(tab => tab.rows.map(row => row.fields.map(field => field.property.key)));
}

describe('EntityFormUtilities', () => {
    test('lays out tabs and rows by position, the order inside a row, and what has no position after it', () => {
        const tabs: EntityFormTab<Customer>[] = resolveLayout('create');

        expect(tabs.map(tab => tab.label)).toEqual(['Part 1', 'Address', 'Part 3']);
        expect(resolveKeys(tabs)).toEqual([
            [['firstName', 'lastName'], ['notes', 'company']],
            [['street']],
            [['invoiceEmail']]
        ]);
    });

    test('leaves out what the form doesn\'t display, or leaves out when creating or editing', () => {
        expect(resolveKeys(resolveLayout('update'))[0]).toEqual([['firstName', 'lastName'], ['id', 'notes', 'company']]);
        expect(resolveKeys(resolveLayout('create', { notes: 'private' }))[0]).toEqual([['firstName', 'lastName'], ['notes']]);
    });

    test('gives each field the columns of its widths, and resolves its conditions with the values', () => {
        const tabs: EntityFormTab<Customer>[] = resolveLayout('update', { company: 'ACME' });

        expect(tabs[0]?.rows[0]?.fields[0]?.classes).toBe('col-span-12 md:col-span-6 lg:col-span-4');
        // the id is required, but read only: nothing the user has to fill in.
        expect(tabs[0]?.rows[1]?.fields[0]).toMatchObject({ required: false, readonly: true });
        expect(tabs[2]?.rows[0]?.fields[0]?.required).toBe(true);
        expect(resolveLayout('update')[2]?.rows[0]?.fields[0]?.required).toBe(false);
    });
});