import { Injectable } from '@angular/core';
import { describe, expect, test } from 'vitest';

import { EntityProperty } from './entity-property.model';
import { EntityUtilities } from './entity.utilities';
import { Property } from './property.decorator';

enum TaskStatus {
    OPEN = 'open',
    DONE = 'done'
}

class BaseEntity {
    @Property.string({ displayName: 'Id', format: 'uuid', omitForCreate: true, readonly: true })
    id!: string;
}

class Task extends BaseEntity {
    @Property.string({ displayName: 'Title', minLength: 3, position: { row: 1 } })
    title!: string;

    @Property.string({ displayName: 'Status', enum: TaskStatus, default: TaskStatus.OPEN })
    status!: TaskStatus;

    @Property.number({ displayName: 'Priority', displayStyle: 'slider', min: 1, max: 5, default: 3 })
    priority!: number;

    // the condition gets the task typed, from the class the decorator is in.
    @Property.boolean({ displayName: 'Archived', required: false, readonly: task => task.status === TaskStatus.DONE })
    archived?: boolean;

    @Property.date({ displayName: 'Created at', default: () => new Date(2026, 0, 1) })
    createdAt!: Date;
}

// declares a property of its parent again, which keeps its place.
class UrgentTask extends Task {
    @Property.number({ displayName: 'Urgency', min: 1, default: 5 })
    override priority: number = 5;
}

describe('Property and EntityUtilities', () => {
    test('resolve the properties of a class, those of the class it extends first, with every default set', () => {
        const properties: EntityProperty<Task>[] = EntityUtilities.resolveProperties(Task);

        expect(properties.map(property => property.key)).toEqual(['id', 'title', 'status', 'priority', 'archived', 'createdAt']);
        expect(properties[1]?.metadata).toEqual({
            type: 'string',
            displayName: 'Title',
            description: undefined,
            required: true,
            display: true,
            readonly: false,
            omitForCreate: false,
            omitForUpdate: false,
            defaultWidths: [6, 6, 12],
            position: { row: 1 },
            default: undefined,
            displayStyle: 'line',
            format: undefined,
            minLength: 3,
            maxLength: undefined,
            regex: undefined,
            enum: undefined,
            options: undefined,
            restrictToOptions: false,
            password: false,
            confirmation: true,
            confirmationDisplayName: undefined,
            passwordStrength: true
        });
    });

    test('leave a password out of the json of the server, which holds its hash', () => {
        class Account {
            @Property.string({ displayName: 'Email', format: 'email' })
            email!: string;

            @Property.string({ displayName: 'Password', password: true })
            password!: string;
        }

        expect(EntityUtilities.resolveFromJson(Account, { email: 'jane@example.com', password: '$argon2id$…' })).toEqual({ email: 'jane@example.com' });
    });

    test('keep the place of a property a subclass declares again, with the metadata of the subclass', () => {
        const properties: EntityProperty<UrgentTask>[] = EntityUtilities.resolveProperties(UrgentTask);

        expect(properties.map(property => property.key)).toEqual(['id', 'title', 'status', 'priority', 'archived', 'createdAt']);
        expect(EntityUtilities.findProperty(UrgentTask, 'priority')?.metadata.displayName).toBe('Urgency');
        expect(EntityUtilities.findProperty(Task, 'priority')?.metadata.displayName).toBe('Priority');
    });

    test('find nothing for a property without a decorator', () => {
        expect(EntityUtilities.findProperty(Task, 'unknown')).toBeUndefined();
        expect(EntityUtilities.resolveProperties(class Plain {})).toEqual([]);
    });

    test('resolve a condition that is a boolean or depends on the entity', () => {
        const archived: EntityProperty<Task> | undefined = EntityUtilities.findProperty(Task, 'archived');
        const done: Task = { id: '1', title: 'Write', status: TaskStatus.DONE, priority: 1, createdAt: new Date() };

        expect(EntityUtilities.resolveCondition(archived?.metadata.required ?? true, done)).toBe(false);
        expect(EntityUtilities.resolveCondition(archived?.metadata.readonly ?? false, done)).toBe(true);
        expect(EntityUtilities.resolveCondition(archived?.metadata.readonly ?? false, { ...done, status: TaskStatus.OPEN })).toBe(false);
    });

    test('leave a boolean free to stay unchecked unless it says it must be checked', () => {
        class Signup {
            @Property.boolean({ displayName: 'Newsletter' })
            newsletter!: boolean;

            @Property.boolean({ displayName: 'I accept the terms', mustBeChecked: true })
            terms!: boolean;
        }

        expect(EntityUtilities.resolveProperties(Signup).map(({ metadata }) => metadata.type === 'boolean' && metadata.mustBeChecked))
            .toEqual([false, true]);
    });

    test('resolve a new entity with the defaults, creating a value from a function each time', () => {
        const first: Partial<Task> = EntityUtilities.resolveDefaults(Task);
        const second: Partial<Task> = EntityUtilities.resolveDefaults(Task);

        expect(first).toEqual({ status: TaskStatus.OPEN, priority: 3, archived: false, createdAt: new Date(2026, 0, 1) });
        expect(first.createdAt).not.toBe(second.createdAt);
    });

    test('resolve the changed values, a copied date with the same time counting as unchanged', () => {
        const original: Task = { id: '1', title: 'Write', status: TaskStatus.OPEN, priority: 3, createdAt: new Date(2026, 0, 1) };
        const current: Task = { ...original, title: 'Write the docs', createdAt: new Date(2026, 0, 1), archived: true };

        expect(EntityUtilities.resolveChanges(Task, original, current)).toEqual({ title: 'Write the docs', archived: true });
        expect(EntityUtilities.resolveChanges(Task, original, { ...original })).toEqual({});
    });

    test('get and change a value by its path, copying the objects on the way', () => {
        const customer: { name: string, address?: { city: string } } = { name: 'ACME', address: { city: 'Berlin' } };
        const changed: typeof customer = EntityUtilities.resolveWithValueAtPath(customer, 'address.city', 'Munich');

        expect(EntityUtilities.getValueAtPath(customer, 'address.city')).toBe('Berlin');
        expect(EntityUtilities.getValueAtPath({ name: 'ACME' }, 'address.city')).toBeUndefined();
        expect(changed).toEqual({ name: 'ACME', address: { city: 'Munich' } });
        expect(customer.address?.city).toBe('Berlin');
        expect(EntityUtilities.resolveWithValueAtPath({ name: 'ACME' }, 'address.city', 'Munich')).toEqual({ name: 'ACME', address: { city: 'Munich' } });
    });

    test('compare dates by their time, and arrays and plain objects by their values', () => {
        expect(EntityUtilities.isEqual(new Date(2026, 0, 1), new Date(2026, 0, 1))).toBe(true);
        expect(EntityUtilities.isEqual({ a: 1, b: [new Date(2026, 0, 1)] }, { b: [new Date(2026, 0, 1)], a: 1 })).toBe(true);
        expect(EntityUtilities.isEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
        expect(EntityUtilities.isEqual([1, 2], [2, 1])).toBe(false);
    });

    test('resolve the defaults and the dates of an inline object from its class', () => {
        class Period {
            @Property.date({ displayName: 'Starts', default: () => new Date(2026, 0, 1) })
            startsAt!: Date;
        }
        class Contract {
            @Property.object({ displayName: 'Period', cls: () => Period })
            period!: Period;
        }

        // json has the date as a string
        const period: Period = { startsAt: new Date() };
        Reflect.set(period, 'startsAt', '2026-01-01T00:00:00.000Z');

        expect(EntityUtilities.resolveDefaults(Contract)).toEqual({ period: { startsAt: new Date(2026, 0, 1) } });
        expect(EntityUtilities.resolveFromJson(Contract, { period })).toEqual({ period: { startsAt: new Date('2026-01-01T00:00:00.000Z') } });
    });

    test('refuse a slider without a min and a max', () => {
        expect(() => Property.number({ displayName: 'Rating', displayStyle: 'slider', min: 1 })).toThrow('The slider "Rating" needs a min and a max.');
    });
});

// a stand-in for the services, which only the fields use.
@Injectable({ providedIn: 'root' })
class TeamService {}

class Team {
    @Property.string({ displayName: 'Id' })
    id!: string;

    @Property.string({ displayName: 'Name' })
    name!: string;

    @Property.date({ displayName: 'Founded' })
    foundedAt!: Date;

    @Property.oneToMany({ displayName: 'Tasks', target: () => TeamTask, inverseSide: 'team', service: () => TeamService, columns: ['title'] })
    tasks?: TeamTask[];
}

class TeamTask {
    @Property.string({ displayName: 'Title' })
    title!: string;

    @Property.string({ displayName: 'Team', format: 'uuid' })
    teamId!: string;

    @Property.manyToOne({ displayName: 'Team', target: () => Team, joinColumn: 'teamId', service: () => TeamService, label: 'name' })
    team?: Team;
}

describe('EntityUtilities with relations', () => {
    test('edit a relation to one entity through its joinColumn', () => {
        expect(EntityUtilities.resolveProperties(TeamTask).map(property => EntityUtilities.getValueKey(property))).toEqual(['title', 'teamId', 'teamId']);
    });

    test('never send a relation, as zibri takes its joinColumn instead', () => {
        const values: Partial<TeamTask> = { title: 'Write', teamId: 't1', team: { id: 't1', name: 'Docs', foundedAt: new Date() } };

        expect(EntityUtilities.resolveWritableValues(TeamTask, values)).toEqual({ title: 'Write', teamId: 't1' });
        expect(EntityUtilities.resolveChanges(TeamTask, values, { ...values, team: undefined })).toEqual({});
        expect(EntityUtilities.resolveWritableValues(Team, { id: 't1', name: 'Docs', tasks: [] })).toEqual({ id: 't1', name: 'Docs' });
    });

    test('resolve the dates of the entities the read included', () => {
        const team: Team = { id: 't1', name: 'Docs', foundedAt: new Date('2026-01-01T00:00:00.000Z'), tasks: [] };
        // as json has it
        Reflect.set(team, 'foundedAt', '2026-01-01T00:00:00.000Z');

        expect(EntityUtilities.resolveFromJson(TeamTask, { title: 'Write', teamId: 't1', team }).team?.foundedAt).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    });

    test('make a relation to many never required', () => {
        expect(EntityUtilities.findProperty(Team, 'tasks')?.metadata.required).toBe(false);
    });
});