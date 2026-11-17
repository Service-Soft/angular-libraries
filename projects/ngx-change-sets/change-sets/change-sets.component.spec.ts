import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component, input, InputSignal, linkedSignal, Service, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';
import { ChangeSet, ChangeSetEntity, ChangeSetType, ResetChangeSetResult } from 'zibri-contract';

import { provideChangeSetService } from './change-set-service.provider';
import { ChangeSetService } from './change-set.service';
import { provideChangeSetsConfig } from './change-sets-config.provider';
import { ChangeSetsComponent } from './change-sets.component';

// the nanoseconds zibri sends for a date, plus the ones after its millisecond.
function toNanoseconds(date: string, nanoseconds: bigint = 0n): string {
    return String((BigInt(new Date(date).getTime()) * 1_000_000n) + nanoseconds);
}

function createChangeSet(id: string, type: ChangeSetType, createdAt: string, createdBy?: string): ChangeSet {
    return {
        id,
        type,
        createdAt: toNanoseconds(createdAt),
        createdBy,
        changeSetEntityId: 'order-1',
        changes: [{ id: `${id}-0`, changeSetId: id, key: 'total', previousValue: 1, newValue: 2 }]
    };
}

const ORDER: ChangeSetEntity = {
    id: 'order-1',
    changeSets: [
        createChangeSet('1', ChangeSetType.CREATE, '2026-10-01T09:00:00', 'user-1'),
        createChangeSet('3', ChangeSetType.DELETE, '2026-10-03T09:00:00'),
        createChangeSet('2', ChangeSetType.UPDATE, '2026-10-02T09:00:00', 'user-1')
    ]
};

@Service({ autoProvided: false })
class TestChangeSetService extends ChangeSetService {
    readonly opened: ChangeSet[] = [];

    // like a request that loads the name of the user
    override async resolveCreatedByName(changeSet: ChangeSet): Promise<string> {
        return await Promise.resolve(changeSet.createdBy === 'user-1' ? 'Jane Doe' : 'System');
    }

    override openCreatedBy(changeSet: ChangeSet): void {
        this.opened.push(changeSet);
    }
}

@Component({
    selector: 'ngx-host',
    template: '<ngx-change-sets changeSetsApiBaseUrl="/api/orders" [canResetAndRollback]="canResetAndRollback()" [(entity)]="order" />',
    imports: [ChangeSetsComponent]
})
class HostComponent {
    readonly entity: InputSignal<ChangeSetEntity> = input(ORDER);
    readonly canResetAndRollback: InputSignal<boolean> = input(true);
    readonly order: WritableSignal<ChangeSetEntity> = linkedSignal(() => this.entity());
}

async function render(inputs: Partial<{ entity: ChangeSetEntity, canResetAndRollback: boolean }> = {}): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideChangeSetService(TestChangeSetService)] });
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    for (const [name, value] of Object.entries(inputs)) {
        fixture.componentRef.setInput(name, value);
    }
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the text a screen reader reads, without what is only there for the layout.
function getSummaries(root: HTMLElement): string[] {
    return [...root.querySelectorAll('summary')].map(summary => {
        const copy: Element = summary.cloneNode(true) as Element;
        copy.querySelectorAll('[aria-hidden="true"]').forEach(hidden => hidden.remove());
        return copy.textContent?.replaceAll(/\s+/g, ' ').trim() ?? '';
    });
}

describe('ChangeSetsComponent', () => {
    test('shows the change sets newest first, with their type, date, who made them and the changed values', async () => {
        const [, root] = await render();

        expect(getSummaries(root)).toEqual([
            'Deleted 03.10.2026 09:00',
            'Updated 02.10.2026 09:00 Jane Doe',
            'Created 01.10.2026 09:00 Jane Doe'
        ]);
        // the icons in front of the date and the name say what they are
        const iconLabels: (string | null)[] = [...root.querySelectorAll('summary')[1]?.querySelectorAll('svg[role="img"]') ?? []]
            .map(icon => icon.getAttribute('aria-label'));
        expect(iconLabels).toEqual(['Created at', 'Created by']);
        const values: string[] = [...root.querySelectorAll('details')[0]?.querySelectorAll('pre') ?? []].map(pre => pre.textContent ?? '');
        expect(values).toEqual(['1', '2']);
    });

    test('sorts change sets of the same millisecond by their nanoseconds', async () => {
        const createdAt: string = '2026-10-02T09:00:00';
        const [, root] = await render({
            entity: {
                id: 'order-1',
                changeSets: [
                    { ...createChangeSet('1', ChangeSetType.CREATE, createdAt), createdAt: toNanoseconds(createdAt, 1n) },
                    { ...createChangeSet('2', ChangeSetType.UPDATE, createdAt), createdAt: toNanoseconds(createdAt, 2n) }
                ]
            }
        });

        expect(getSummaries(root)).toEqual(['Updated 02.10.2026 09:00', 'Created 02.10.2026 09:00']);
    });

    test('offers to reset a change set unless it is the creation, to roll back to one unless it is the newest, and nothing when read only', async () => {
        const [fixture, root] = await render();
        const findMenuItems: (label: string) => boolean[] = label => [...root.querySelectorAll<HTMLButtonElement>('ui-menu-item button')]
            .filter(button => button.textContent?.trim() === label)
            .map(button => button.disabled);
        expect(findMenuItems('This change set')).toEqual([false, false, true]);
        expect(findMenuItems('Rollback all to this state')).toEqual([true, false, false]);

        fixture.componentRef.setInput('canResetAndRollback', false);
        await fixture.whenStable();
        expect(root.querySelectorAll('ui-menu')).toHaveLength(0);
    });

    test('opens who made a change set with the ChangeSetService', async () => {
        const [, root] = await render();
        const button: HTMLButtonElement | undefined = [...root.querySelectorAll<HTMLButtonElement>('button')]
            .find(candidate => candidate.textContent?.includes('Jane Doe'));
        button?.click();

        expect(TestBed.inject(TestChangeSetService).opened.map(changeSet => changeSet.id)).toEqual(['2']);
    });

    test('shows the next change sets with "show more" until all are shown', async () => {
        TestBed.configureTestingModule({ providers: [provideChangeSetsConfig({ pageSize: 2 })] });
        const [fixture, root] = await render();
        expect(root.querySelectorAll('details')).toHaveLength(2);

        [...root.querySelectorAll('button')].find(button => button.textContent?.trim() === 'Show more')?.click();
        await fixture.whenStable();
        expect(root.querySelectorAll('details')).toHaveLength(3);
        expect([...root.querySelectorAll('button')].some(button => button.textContent?.trim() === 'Show more')).toBe(false);
    });
});

describe('ChangeSetService', () => {
    test('resets and rolls back with POST requests to the entity under the base url, reading the entity zibri resets', async () => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideChangeSetService(TestChangeSetService)] });
        const changeSetService: ChangeSetService = TestBed.inject(ChangeSetService);
        const http: HttpTestingController = TestBed.inject(HttpTestingController);
        const changeSet: ChangeSet = createChangeSet('2', ChangeSetType.UPDATE, '2026-10-02T09:00:00');

        const reset: Promise<ChangeSetEntity> = changeSetService.resetChangeSet(changeSet, '/api/orders');
        const resetRequest: TestRequest = http.expectOne({ method: 'POST', url: '/api/orders/order-1/reset' });
        expect(resetRequest.request.body).toEqual({ changeSetId: '2' });
        const result: ResetChangeSetResult = { entity: ORDER, changedValues: {} };
        resetRequest.flush(result);
        await expect(reset).resolves.toEqual(ORDER);

        const rollback: Promise<ChangeSetEntity> = changeSetService.rollbackToChangeSet(changeSet, '/api/orders');
        const rollbackRequest: TestRequest = http.expectOne({ method: 'POST', url: '/api/orders/order-1/rollback' });
        expect(rollbackRequest.request.body).toEqual({ changeSetId: '2' });
        rollbackRequest.flush(ORDER);
        await expect(rollback).resolves.toEqual(ORDER);
        http.verify();
    });
});