// the DialogService renders the dialogs into the body, so the tests find them there.
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EntityClass, Property } from '@service-soft/ngx-entity/entity';
import { EntityService } from '@service-soft/ngx-entity/service';
import { DialogTestingUtilities } from 'testing/dialog';
import { FormTestingUtilities } from 'testing/form';
import { HttpTestingUtilities } from 'testing/http';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ErrorResponseBody } from 'zibri-contract';

import { EntityDialogService } from './entity-dialog.service';

class Task {
    @Property.string({ displayName: 'Id', omitForCreate: true, readonly: true })
    id!: string;

    @Property.string({ displayName: 'Title', minLength: 3 })
    title!: string;
}

@Injectable({ providedIn: 'root' })
class TaskService extends EntityService<Task> {
    readonly entity: EntityClass<Task> = Task;
    readonly baseUrl: string = '/api/tasks';
}

const TASK: Task = { id: 'a1', title: 'Write the docs' };

// renders, and lets the requests of the dialog go out, which the tests answer.
async function settle(): Promise<void> {
    TestBed.tick();
    await new Promise(resolve => setTimeout(resolve));
    TestBed.tick();
}

function findDialog(): HTMLDialogElement | undefined {
    return [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1) ?? undefined;
}

// the fields load their components first.
async function findInput(label: string): Promise<HTMLInputElement> {
    return await vi.waitFor(() => {
        TestBed.tick();
        const element: HTMLLabelElement | undefined = [...findDialog()?.querySelectorAll('label') ?? []]
            .find(candidate => candidate.textContent?.trim().startsWith(label));
        const input: HTMLElement | null = document.getElementById(element?.htmlFor ?? '');
        if (!(input instanceof HTMLInputElement)) {
            throw new TypeError(`No input labelled "${label}".`);
        }
        return input;
    });
}

// the question loads the dialogs of ui first.
async function findQuestion(): Promise<void> {
    await vi.waitFor(() => {
        TestBed.tick();
        expect(FormTestingUtilities.getText(findDialog() ?? document, 'h2')).toBe('Discard your changes?');
    });
}

async function type(label: string, text: string): Promise<void> {
    const input: HTMLInputElement = await findInput(label);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await settle();
}

describe('EntityDialogService', () => {
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    });

    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
        removeModalDialogs();
        for (const dialog of document.querySelectorAll('ui-dialog')) {
            dialog.remove();
        }
    });

    test('creates an entity in a form without the fields left out for creating, and closes with it', async () => {
        const created: Promise<Task | undefined> = TestBed.inject(EntityDialogService).create(TestBed.inject(TaskService), { title: 'New task' });
        await type('Title', 'Write the docs');
        const dialog: HTMLDialogElement | undefined = findDialog();
        expect(FormTestingUtilities.getText(dialog ?? document, 'h2')).toBe('New task');
        expect([...dialog?.querySelectorAll('label') ?? []].map(label => label.textContent?.trim())).toEqual(['Title *']);

        FormTestingUtilities.click(dialog ?? document, 'Save');
        await settle();
        const request: TestRequest = TestBed.inject(HttpTestingController).expectOne({ method: 'POST', url: '/api/tasks' });
        expect(request.request.body).toEqual({ title: 'Write the docs' });
        request.flush(TASK);

        expect(await created).toEqual(TASK);
        expect(findDialog()).toBeUndefined();
    });

    test('keeps the dialog open and shows the problems of the values the server refused', async () => {
        const edited: Promise<Task | undefined> = TestBed.inject(EntityDialogService).edit(TestBed.inject(TaskService), TASK);
        await type('Title', 'Write the README');

        FormTestingUtilities.click(findDialog() ?? document, 'Save');
        await settle();
        const body: ErrorResponseBody = {
            status: 400,
            name: 'BadRequestError',
            message: 'The task is invalid.',
            paragraphs: [],
            problems: [{ key: 'title', code: 'unique', message: 'A task with this title exists already.' }]
        };
        TestBed.inject(HttpTestingController).expectOne({ method: 'PATCH', url: '/api/tasks/a1' })
            .flush(body, { status: 400, statusText: 'Bad Request' });
        await settle();

        const title: HTMLInputElement = await findInput('Title');
        expect(document.getElementById(title.getAttribute('aria-describedby') ?? '')?.textContent?.trim()).toBe('A task with this title exists already.');
        expect(findDialog()).toBeDefined();

        // the refused value can't be saved again, until the user changes it.
        FormTestingUtilities.click(findDialog() ?? document, 'Save');
        await settle();
        TestBed.inject(HttpTestingController).expectNone({ method: 'PATCH', url: '/api/tasks/a1' });
        await type('Title', 'Write the changelog');
        FormTestingUtilities.click(findDialog() ?? document, 'Save');
        await settle();
        TestBed.inject(HttpTestingController).expectOne({ method: 'PATCH', url: '/api/tasks/a1' })
            .flush({ ...TASK, title: 'Write the changelog' });
        expect(await edited).toEqual({ ...TASK, title: 'Write the changelog' });
    });

    test('asks before losing changes on cancel, and closes right away without any', async () => {
        const service: EntityDialogService = TestBed.inject(EntityDialogService);
        const edited: Promise<Task | undefined> = service.edit(TestBed.inject(TaskService), TASK);
        await type('Title', 'Something else');

        FormTestingUtilities.click(findDialog() ?? document, 'Cancel');
        await findQuestion();
        FormTestingUtilities.click(findDialog() ?? document, 'Keep editing');
        await settle();
        expect((await findInput('Title')).value).toBe('Something else');

        FormTestingUtilities.click(findDialog() ?? document, 'Cancel');
        await findQuestion();
        FormTestingUtilities.click(findDialog() ?? document, 'Discard');
        expect(await edited).toBeUndefined();

        const unchanged: Promise<Task | undefined> = service.edit(TestBed.inject(TaskService), TASK);
        await findInput('Title');
        FormTestingUtilities.click(findDialog() ?? document, 'Cancel');
        expect(await unchanged).toBeUndefined();
    });

    test('deletes an entity once the user confirms, and nothing when they cancel', async () => {
        const service: EntityDialogService = TestBed.inject(EntityDialogService);
        const http: HttpTestingController = TestBed.inject(HttpTestingController);

        const kept: Promise<boolean> = service.delete(TestBed.inject(TaskService), TASK);
        await settle();
        FormTestingUtilities.click(findDialog() ?? document, 'Cancel');
        expect(await kept).toBe(false);

        const deleted: Promise<boolean> = service.delete(TestBed.inject(TaskService), TASK, { title: 'Delete "Write the docs"?' });
        await settle();
        expect(FormTestingUtilities.getText(findDialog() ?? document, 'h2')).toBe('Delete "Write the docs"?');
        FormTestingUtilities.click(findDialog() ?? document, 'Delete');
        await settle();
        HttpTestingUtilities.flushNoContent(http.expectOne({ method: 'DELETE', url: '/api/tasks/a1' }));
        expect(await deleted).toBe(true);
    });
});