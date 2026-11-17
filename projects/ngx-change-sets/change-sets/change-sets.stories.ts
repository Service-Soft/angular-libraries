import { provideHttpClient } from '@angular/common/http';
import { Component, inject, input, InputSignal, linkedSignal, Service, signal, WritableSignal } from '@angular/core';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { Change, ChangeSet, ChangeSetEntity, ChangeSetType } from 'zibri-contract';

import { provideChangeSetService } from './change-set-service.provider';
import { ChangeSetService } from './change-set.service';
import { ChangeSetsComponent } from './change-sets.component';

const USERS: Record<string, string> = { jane: 'Jane Doe', john: 'John Smith' };

/**
 * A change of a story, which gets its ids from the change set.
 */
type StoryChange = Omit<Change, 'id' | 'changeSetId'>;

// the nanoseconds zibri sends for a date.
function toNanoseconds(date: Date): string {
    return String(BigInt(date.getTime()) * 1_000_000n);
}

function createChangeSet(
    id: string,
    type: ChangeSetType,
    createdAt: string,
    createdBy: string | undefined,
    ...changes: StoryChange[]
): ChangeSet {
    return {
        id,
        type,
        createdAt: toNanoseconds(new Date(createdAt)),
        createdBy,
        changeSetEntityId: 'order-1',
        changes: changes.map((change, index) => ({ ...change, id: `${id}-${index}`, changeSetId: id }))
    };
}

// every type of change set, with every kind of value.
const ORDER: ChangeSetEntity = {
    id: 'order-1',
    changeSets: [
        createChangeSet(
            '1',
            ChangeSetType.CREATE,
            '2026-10-01T09:00:00',
            'jane',
            { key: 'name', newValue: 'Order 1001' },
            { key: 'total', newValue: 120.5 },
            { key: 'items', newValue: ['Desk', 'Chair'] }
        ),
        createChangeSet(
            '2',
            ChangeSetType.UPDATE,
            '2026-10-03T14:30:00',
            'john',
            { key: 'total', previousValue: 120.5, newValue: 99.9 },
            { key: 'deliveryDate', previousValue: '2026-10-10T00:00:00', newValue: '2026-10-14T00:00:00' }
        ),
        createChangeSet('3', ChangeSetType.UPDATE, '2026-10-05T08:15:00', undefined, {
            key: 'status',
            previousValue: 'open',
            newValue: 'paid'
        }),
        createChangeSet('4', ChangeSetType.REPLACE, '2026-10-07T11:00:00', 'jane', {
            key: 'address',
            previousValue: { street: 'Main Street 1', city: 'Springfield' },
            newValue: { street: 'Elm Street 22', city: 'Riverside' }
        }),
        createChangeSet('5', ChangeSetType.DELETE, '2026-10-09T16:45:00', 'john', { key: 'deleted', previousValue: false, newValue: true }),
        createChangeSet('6', ChangeSetType.RESTORE, '2026-10-10T10:00', 'jane', { key: 'deleted', previousValue: true, newValue: false }),
        createChangeSet('7', ChangeSetType.RESET, '2026-10-11T12:00:00', 'john', { key: 'total', previousValue: 99.9, newValue: 120.5 })
    ]
};

// more change sets than show at first.
const LONG_HISTORY: ChangeSetEntity = {
    id: 'order-1',
    changeSets: Array.from({ length: 25 }, (_, index) => {
        const day: string = String(index + 1).padStart(2, '0');
        const change: StoryChange = { key: 'quantity', previousValue: index, newValue: index + 1 };
        return createChangeSet(`${index + 1}`, ChangeSetType.UPDATE, `2026-10-${day}T09:00:00`, 'jane', change);
    })
};

// undoes change sets in memory instead of sending requests, like a backend would.
@Service({ autoProvided: false })
class StoryChangeSetService extends ChangeSetService {
    // the entity the story shows, which a backend would have in its database.
    current: ChangeSetEntity = ORDER;

    readonly opened: WritableSignal<string> = signal('');

    override async resetChangeSet(changeSet: ChangeSet): Promise<ChangeSetEntity> {
        const reverted: StoryChange[] = changeSet.changes.map(change => {
            return { key: change.key, previousValue: change.newValue, newValue: change.previousValue };
        });
        const now: string = new Date().toISOString();
        const reset: ChangeSet = createChangeSet(`reset-${changeSet.id}`, ChangeSetType.RESET, now, 'jane', ...reverted);
        const others: ChangeSet[] = this.current.changeSets.filter(other => other.id !== changeSet.id);
        this.current = { ...this.current, changeSets: [...others, reset] };
        return await Promise.resolve(this.current);
    }

    // keeps the change set it rolls back to, like zibri.
    override async rollbackToChangeSet(changeSet: ChangeSet): Promise<ChangeSetEntity> {
        const kept: ChangeSet[] = this.current.changeSets.filter(other => BigInt(other.createdAt) <= BigInt(changeSet.createdAt));
        this.current = { ...this.current, changeSets: kept };
        return await Promise.resolve(this.current);
    }

    override resolveCreatedByName(changeSet: ChangeSet): string {
        return changeSet.createdBy == undefined ? 'System' : USERS[changeSet.createdBy] ?? changeSet.createdBy;
    }

    override openCreatedBy(changeSet: ChangeSet): void {
        this.opened.set(`Opened ${this.resolveCreatedByName(changeSet)}.`);
    }
}

// a component with state, which the template of a story doesn't have.
@Component({
    selector: 'ngx-order-history',
    template: `
        <ngx-change-sets class="max-w-3xl" changeSetsApiBaseUrl="/api/orders" [canResetAndRollback]="enabled()" [(entity)]="order" />
        <p class="mt-4 text-body-sm text-on-surface-variant" role="status">{{ changeSetService.opened() }}</p>
    `,
    imports: [ChangeSetsComponent]
})
class OrderHistoryComponent {
    protected readonly changeSetService: StoryChangeSetService = inject(StoryChangeSetService);

    readonly entity: InputSignal<ChangeSetEntity> = input(ORDER);
    // whether the user may undo change sets.
    readonly enabled: InputSignal<boolean> = input(true);

    protected readonly order: WritableSignal<ChangeSetEntity> = linkedSignal(() => this.entity());

    constructor() {
        this.changeSetService.current = this.entity();
    }
}

const meta: Meta<ChangeSetsComponent> = {
    title: 'Change sets/Change sets',
    component: ChangeSetsComponent,
    decorators: [applicationConfig({ providers: [provideHttpClient(), provideChangeSetService(StoryChangeSetService)] })]
};
export default meta;

type Story = StoryObj<ChangeSetsComponent>;

export const Default: Story = {
    render: () => ({ template: '<ngx-order-history />', moduleMetadata: { imports: [OrderHistoryComponent] } })
};

export const LongHistory: Story = {
    render: () => ({
        props: { entity: LONG_HISTORY },
        template: '<ngx-order-history [entity]="entity" />',
        moduleMetadata: { imports: [OrderHistoryComponent] }
    })
};

export const ReadOnly: Story = {
    render: () => ({
        template: '<ngx-order-history [enabled]="false" />',
        moduleMetadata: { imports: [OrderHistoryComponent] }
    })
};