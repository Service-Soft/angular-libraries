import { Injectable } from '@angular/core';
import { EntityTextLabels, EntityUtilities, Property } from '@service-soft/ngx-entity/entity';
import { TableColumn } from '@service-soft/ui/table';
import { describe, expect, test } from 'vitest';

import { EntityTableUtilities } from './entity-table.utilities';

// a stand-in for the service of the teams, which only the fields use.
@Injectable({ providedIn: 'root' })
class TeamService {}

class Team {
    @Property.string({ displayName: 'Name' })
    name!: string;
}

class Task {
    @Property.string({ displayName: 'Title' })
    title!: string;

    @Property.string({ displayName: 'Team', format: 'uuid' })
    teamId!: string;

    @Property.manyToOne({ displayName: 'Team', target: () => Team, joinColumn: 'teamId', service: () => TeamService, label: 'name' })
    team?: Team;
}

const CONFIG: EntityTextLabels = { yesLabel: 'Yes', noLabel: 'No' };

function resolveColumns(order: { title?: true } | false | undefined): TableColumn<Task>[] {
    return EntityTableUtilities.resolveColumns(EntityUtilities.resolveProperties(Task), ['title', 'team'], undefined, order, CONFIG, 'en-US');
}

describe('EntityTableUtilities', () => {
    test('shows a relation by the label of the other entity, or nothing when the read didn\'t include it', () => {
        const team: TableColumn<Task> | undefined = resolveColumns(undefined)[1];

        expect(team?.value({ title: 'Write', teamId: 't1', team: { name: 'Docs' } })).toBe('Docs');
        expect(team?.value({ title: 'Write', teamId: 't1' })).toBe('');
    });

    test('orders by every column but a relation when the service has no order config, like zibri', () => {
        expect(resolveColumns(undefined).map(column => column.sortable)).toEqual([true, false]);
        expect(resolveColumns({ title: true }).map(column => column.sortable)).toEqual([true, false]);
        expect(resolveColumns(false).map(column => column.sortable)).toEqual([false, false]);
    });
});
class Address {
    @Property.string({ displayName: 'Street' })
    street!: string;

    @Property.string({ displayName: 'City' })
    city!: string;
}

class Customer {
    @Property.object({ displayName: 'Address', cls: () => Address })
    address!: Address;

    @Property.object({
        displayName: 'Billing',
        cls: () => Address,
        displayStyle: 'dropdown',
        options: [{ label: 'Head office', value: { street: 'Main street 1', city: 'Berlin' } }]
    })
    billing!: Address;
}

describe('EntityTableUtilities with objects', () => {
    test('shows an inline object by its values and one of a select by the label of its option, neither sortable', () => {
        const columns: TableColumn<Customer>[] = EntityTableUtilities.resolveColumns(
            EntityUtilities.resolveProperties(Customer),
            ['address', 'billing'],
            undefined,
            undefined,
            CONFIG,
            'en-US'
        );
        const customer: Customer = { address: { street: 'Elm street 2', city: 'Munich' }, billing: { street: 'Main street 1', city: 'Berlin' } };

        expect(columns.map(column => column.value?.(customer))).toEqual(['Elm street 2, Munich', 'Head office']);
        expect(columns.map(column => column.sortable)).toEqual([false, false]);
    });
});