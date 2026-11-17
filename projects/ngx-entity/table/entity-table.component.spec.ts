import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component, inject, Injectable, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { EntityClass, Property } from '@service-soft/ngx-entity/entity';
import { EntityService } from '@service-soft/ngx-entity/service';
import { DialogTestingUtilities } from 'testing/dialog';
import { FormTestingUtilities } from 'testing/form';
import { HttpTestingUtilities } from 'testing/http';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { EntityTableColumnInput } from './entity-table-column.model';
import { EntityTableEdit } from './entity-table-edit.type';
import { EntityTableComponent } from './entity-table.component';

enum TaskStatus {
    OPEN = 'open',
    DONE = 'done'
}

class Task {
    @Property.string({ displayName: 'Id', format: 'uuid' })
    id!: string;

    @Property.string({ displayName: 'Title' })
    title!: string;

    @Property.string({ displayName: 'Status', enum: TaskStatus })
    status!: TaskStatus;

    @Property.number({ displayName: 'Hours' })
    hours!: number;

    @Property.boolean({ displayName: 'Billable' })
    billable!: boolean;

    @Property.date({ displayName: 'Due' })
    dueAt!: Date;
}

type TaskFilter = { title: 'iLike', status: 'oneOf', billable: 'equals', hours: 'range' };
type TaskOrder = { title: true, dueAt: true };

@Injectable({ providedIn: 'root' })
class TaskService extends EntityService<Task, TaskFilter, TaskOrder> {
    readonly entity: EntityClass<Task> = Task;
    readonly baseUrl: string = '/api/tasks';
    override readonly filter: TaskFilter = { title: 'iLike', status: 'oneOf', billable: 'equals', hours: 'range' };
    override readonly order: TaskOrder = { title: true, dueAt: true };
}

const TASK_JSON: object = { id: 'a1', title: 'Write the docs', status: 'done', hours: 1234.5, billable: true, dueAt: '2026-03-01T09:00:00.000Z' };

@Component({
    selector: 'ngx-host',
    template: `
        <ngx-entity-table #table label="Tasks" [service]="service" [columns]="columns" [pageSize]="5" [edit]="edit()" [canCreate]="canCreate()"
            [canDelete]="canDelete()" [canImport]="canImport()" [canExport]="canExport()" />
    `,
    imports: [EntityTableComponent]
})
class HostComponent {
    readonly canImport: WritableSignal<boolean> = signal(false);
    readonly canExport: WritableSignal<boolean> = signal(false);
    readonly service: TaskService = inject(TaskService);
    readonly columns: EntityTableColumnInput<Task>[] = ['title', 'status', 'hours', 'billable', 'dueAt', { key: 'id', label: 'Code', value: task => task.id.toUpperCase() }];
    readonly edit: WritableSignal<EntityTableEdit | undefined> = signal(undefined);
    readonly canCreate: WritableSignal<boolean> = signal(false);
    readonly canDelete: WritableSignal<boolean> = signal(false);
    readonly table: Signal<EntityTableComponent<Task, TaskFilter, TaskOrder>> = viewChild.required('table');
}

// a page of its own for a task, which the table navigates to when it edits on pages.
@Component({ selector: 'ngx-task-page', template: '' })
class TaskPageComponent {}

async function render(setup: (host: HostComponent) => void = () => undefined): Promise<[ComponentFixture<HostComponent>, HTMLElement, HttpTestingController]> {
    TestBed.configureTestingModule({
        providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: ':id', component: TaskPageComponent }])]
    });
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    setup(fixture.componentInstance);
    const http: HttpTestingController = TestBed.inject(HttpTestingController);
    await answer(fixture, http, [TASK_JSON]);
    return [fixture, fixture.nativeElement as HTMLElement, http];
}

// waits for the request of the table, answers it with the tasks, and returns it.
async function answer(fixture: ComponentFixture<HostComponent>, http: HttpTestingController, items: object[]): Promise<TestRequest> {
    // the table only becomes stable once its request is answered, so it can't be awaited before.
    TestBed.tick();
    await new Promise(resolve => setTimeout(resolve));
    const request: TestRequest = http.expectOne(candidate => candidate.url === '/api/tasks');
    request.flush({ items, totalAmount: items.length });
    await fixture.whenStable();
    return request;
}

async function waitForFilter(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 350));
}

// the controls of the filters are found by their labels, which only screen readers read.
function findFilterControlId(root: HTMLElement, label: string): string | undefined {
    return [...root.querySelectorAll('label')].find(element => element.textContent?.trim() === label)?.htmlFor;
}

function findFilterInput(root: HTMLElement, label: string): HTMLInputElement | undefined {
    return root.querySelector<HTMLInputElement>(`input[id="${findFilterControlId(root, label)}"]`) ?? undefined;
}

// the native select of a ui-input-select, which takes what the browser chooses in it like what the user chooses in its
// list.
function findFilterSelect(root: HTMLElement, label: string): HTMLSelectElement | undefined {
    return root.querySelector<HTMLSelectElement>(`select[id="${findFilterControlId(root, label)}"]`) ?? undefined;
}

function findCells(root: HTMLElement): string[] {
    return [...root.querySelectorAll('tbody td span:last-child')].map(cell => cell.textContent?.trim() ?? '');
}

describe('EntityTableComponent', () => {
    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
    });

    test('asks for the first page, and shows each column with the label and text from the decorators', async () => {
        const [, root] = await render();

        // without the popovers of the filters and the comments of angular's control flow
        const headers: string[] = [...root.querySelectorAll('th[ui-table-header-cell]')].map(header => [...header.childNodes]
            .filter(node => node.nodeName !== 'UI-POPOVER' && node.nodeType !== Node.COMMENT_NODE)
            .map(node => node.textContent ?? '')
            .join('')
            .trim());
        expect(headers).toEqual(['Title', 'Status', 'Hours', 'Billable', 'Due', 'Code']);
        expect(findCells(root)).toEqual(['Write the docs', 'done', '1,234.5', 'Yes', 'Mar 1, 2026', 'A1']);
    });

    test('orders by the columns of the order config, and asks the server for that order', async () => {
        const [fixture, root, http] = await render();
        // the other buttons of the header open the filters
        const buttons: HTMLButtonElement[] = [...root.querySelectorAll<HTMLButtonElement>('thead button:not([popovertarget])')];
        expect(buttons.map(button => button.textContent?.trim())).toEqual(['Title', 'Due']);

        buttons[1]?.click();
        const request: TestRequest = await answer(fixture, http, [TASK_JSON]);
        expect(request.request.params.get('order')).toBe('{"dueAt":"ASC"}');
    });

    test('filters by the matches of the filter config, once the user stopped typing', async () => {
        const [fixture, root, http] = await render();
        const title: HTMLInputElement | undefined = findFilterInput(root, 'Filter Title');
        const status: HTMLSelectElement | undefined = findFilterSelect(root, 'Filter Status');
        const billable: HTMLSelectElement | undefined = findFilterSelect(root, 'Filter Billable');
        // a range has no input in the table
        expect(root.querySelector('[aria-label="Filter Hours"]')).toBeNull();

        if (title != undefined && status != undefined && billable != undefined) {
            title.value = 'docs';
            title.dispatchEvent(new Event('input'));
            status.value = '1';
            status.dispatchEvent(new Event('change'));
            billable.value = '0';
            billable.dispatchEvent(new Event('change'));
        }
        await waitForFilter();
        const request: TestRequest = await answer(fixture, http, []);
        expect(request.request.params.get('filter')).toBe('{"title":"docs","status":["done"],"billable":true}');
        expect(request.request.params.get('page')).toBe('1');
    });

    test('loads the page again on reload', async () => {
        const [fixture, root, http] = await render();

        fixture.componentInstance.table().reload();
        await answer(fixture, http, [{ ...TASK_JSON, title: 'Write the README' }]);
        expect(findCells(root)[0]).toBe('Write the README');
    });

    test('edits on pages: a row at its id, a new entity at new, below the route of the table', async () => {
        const [fixture, root] = await render(host => {
            host.edit.set('page');
            host.canCreate.set(true);
        });
        const router: Router = TestBed.inject(Router);

        root.querySelector<HTMLButtonElement>('tbody button')?.click();
        await fixture.whenStable();
        expect(router.url).toBe('/a1');

        FormTestingUtilities.click(root, 'Create');
        await fixture.whenStable();
        expect(router.url).toBe('/new');
    });
});

// the DialogService renders the dialogs into the body, so the tests find them there.
describe('EntityTableComponent with dialogs', () => {
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
    });

    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
        removeModalDialogs();
        for (const dialog of document.querySelectorAll('ui-dialog')) {
            dialog.remove();
        }
    });

    function findDialog(): HTMLDialogElement {
        const dialog: HTMLDialogElement | undefined = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1);
        if (dialog == undefined) {
            throw new Error('No dialog is open.');
        }
        return dialog;
    }

    test('edits the entity of an opened row in a dialog, and loads the page again once it is saved', async () => {
        const [fixture, root, http] = await render(host => host.edit.set('dialog'));

        root.querySelector<HTMLButtonElement>('tbody button')?.click();
        const title: HTMLInputElement = await vi.waitFor(() => {
            TestBed.tick();
            const label: HTMLLabelElement | undefined = [...findDialog().querySelectorAll('label')].find(candidate => candidate.textContent?.trim().startsWith('Title'));
            const input: HTMLElement | null = document.getElementById(label?.htmlFor ?? '');
            if (!(input instanceof HTMLInputElement)) {
                throw new TypeError('The form has no title field yet.');
            }
            return input;
        });
        expect(FormTestingUtilities.getText(findDialog(), 'h2')).toBe('Edit');
        title.value = 'Write the README';
        title.dispatchEvent(new Event('input'));
        TestBed.tick();

        FormTestingUtilities.click(findDialog(), 'Save');
        const request: TestRequest = http.expectOne({ method: 'PATCH', url: '/api/tasks/a1' });
        expect(request.request.body).toEqual({ title: 'Write the README' });
        request.flush({ ...TASK_JSON, title: 'Write the README' });
        // the table reloads once the dialog closed with the saved task.
        await new Promise(resolve => setTimeout(resolve));
        await answer(fixture, http, [{ ...TASK_JSON, title: 'Write the README' }]);
        // the first value of a row that opens is the button that opens it.
        expect(root.querySelector('tbody button')?.textContent?.trim()).toBe('Write the README');
    });

    test('deletes the entity of a row after asking, with a button named by its row', async () => {
        const [fixture, root, http] = await render(host => host.canDelete.set(true));
        const button: HTMLButtonElement | undefined = root.querySelector<HTMLButtonElement>('button[aria-label="Delete Write the docs"]') ?? undefined;
        expect(button?.textContent?.trim()).toBe('Delete');

        button?.click();
        await vi.waitFor(() => findDialog());
        FormTestingUtilities.click(findDialog(), 'Delete');
        await new Promise(resolve => setTimeout(resolve));
        HttpTestingUtilities.flushNoContent(http.expectOne({ method: 'DELETE', url: '/api/tasks/a1' }));
        // the table reloads once the task is deleted.
        await new Promise(resolve => setTimeout(resolve));
        await answer(fixture, http, []);
        expect(root.querySelector('tbody')?.textContent).toContain('Nothing found.');
    });

    test('imports the json file the user chose at the import route, and loads the page again', async () => {
        const [fixture, root, http] = await render(host => host.canImport.set(true));
        const input: HTMLInputElement | null = root.querySelector('input[type="file"]');
        const file: File = new File(['[{ "title": "Imported" }]'], 'tasks.json', { type: 'application/json' });
        expect(input?.accept).toBe('application/json,.json');
        // jsdom has no file picker, so the file is set the way choosing it does.
        Object.defineProperty(input, 'files', { value: [file] });

        input?.dispatchEvent(new Event('change'));
        const request: TestRequest = http.expectOne({ method: 'POST', url: '/api/tasks/import' });
        expect(request.request.body instanceof FormData && request.request.body.get('import')).toBe(file);
        request.flush([{ id: 'b2', title: 'Imported' }]);
        await new Promise(resolve => setTimeout(resolve));
        await answer(fixture, http, [TASK_JSON, { id: 'b2', title: 'Imported' }]);
        expect(findCells(root)).toContain('Imported');
    });

    test('makes the rows selectable to export them, and waits for a selection', async () => {
        const [fixture, root] = await render(host => host.canExport.set(true));
        const exportCsv: HTMLButtonElement | undefined = [...root.querySelectorAll('button')].find(button => button.textContent.trim() === 'Export as CSV');
        expect(exportCsv?.disabled).toBe(true);

        root.querySelector<HTMLInputElement>('tbody input[type="checkbox"]')?.click();
        await fixture.whenStable();
        expect(exportCsv?.disabled).toBe(false);
    });
});