// the DialogService renders the content of a dialog into a div, so the tests find it by its dialog.
import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OFFLINE_REQUEST_METADATA, offlineInterceptor, OfflineService } from '@service-soft/ngx-pwa/offline';
import { DialogService } from '@service-soft/ui/dialog';
import { firstValueFrom } from 'rxjs';
import { DialogTestingUtilities } from 'testing/dialog';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { SyncDialogComponent } from './sync-dialog.component';

/**
 * A todo, as the server has it.
 */
type Todo = {
    id: number | string,
    title: string
};

function setConnection(online: boolean): void {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

// the changes are made offline through the interceptor, like in a real app, before the dialog opens.
async function setup(): Promise<HttpTestingController> {
    setConnection(false);
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([offlineInterceptor])), provideHttpClientTesting()] });
    const http: HttpClient = TestBed.inject(HttpClient);
    const created: Todo = await firstValueFrom(http.post<Todo>('/api/todos', { title: 'Buy milk' }, {
        context: new HttpContext().set(OFFLINE_REQUEST_METADATA, { type: 'todo', displayValue: 'Buy milk' })
    }));
    await firstValueFrom(http.patch(`/api/todos/${created.id}`, { done: true }, {
        context: new HttpContext().set(OFFLINE_REQUEST_METADATA, { type: 'todo', displayValue: 'Buy milk is done' })
    }));
    await firstValueFrom(http.delete('/api/todos/3', { context: new HttpContext().set(OFFLINE_REQUEST_METADATA, { type: 'todo' }) }));
    TestBed.inject(DialogService).open(SyncDialogComponent);
    return TestBed.inject(HttpTestingController);
}

async function render(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
}

function findDialog(): HTMLDialogElement | null {
    return document.querySelector('dialog');
}

/**
 * A change in the list of the dialog, as the test reads it.
 */
type Change = {
    text: string,
    canSync: boolean
};

function getChanges(): Change[] {
    return [...findDialog()?.querySelectorAll('li') ?? []].map(item => ({
        text: [...item.querySelectorAll('p')].map(paragraph => paragraph.textContent.trim()).join(' '),
        canSync: item.querySelector<HTMLButtonElement>('button[aria-label="Sync"]')?.disabled === false
    }));
}

function findButton(name: string, index: number = 0): HTMLButtonElement | undefined {
    return [...findDialog()?.querySelectorAll('button') ?? []]
        .filter(button => (button.getAttribute('aria-label') ?? button.textContent.trim()) === name)
        .at(index);
}

// the question before discarding every change opens on top of the sync dialog.
function findQuestion(): HTMLDialogElement | undefined {
    return [...document.querySelectorAll('dialog')].at(1);
}

function findButtonIn(dialog: HTMLDialogElement, text: string): HTMLButtonElement | undefined {
    return [...dialog.querySelectorAll('button')].find(button => button.textContent.trim() === text);
}

function getStatus(): string {
    return findDialog()?.querySelector('[role="status"]')?.textContent.trim() ?? '';
}

describe('SyncDialogComponent', () => {
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
    });

    afterEach(() => {
        removeModalDialogs();
        for (const element of document.querySelectorAll('ui-dialog, ui-snackbar')) {
            element.remove();
        }
        localStorage.clear();
        vi.restoreAllMocks();
        TestBed.inject(HttpTestingController).verify();
    });

    test('lists the changes oldest first, and syncs none while the user is offline', async () => {
        await setup();
        await render();

        expect(findDialog()?.querySelector('h2')?.textContent).toBe('Unsaved changes');
        expect(findDialog()?.textContent).toContain('You are offline.');
        expect(getChanges()).toEqual([
            { text: 'New Buy milk', canSync: false },
            { text: 'Changed Buy milk is done', canSync: false },
            { text: 'Deleted /api/todos/3', canSync: false }
        ]);
        expect(findButton('Sync all')?.disabled).toBe(true);
    });

    test('syncs one change once it can, and keeps it when that fails', async () => {
        const backend: HttpTestingController = await setup();
        setConnection(true);
        await render();
        // the change of the new todo waits for the todo
        expect(getChanges().map(change => change.canSync)).toEqual([true, false, true]);

        findButton('Sync', 2)?.click();
        backend.expectOne({ method: 'DELETE', url: '/api/todos/3' }).flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
        await vi.waitFor(() => expect(getStatus()).toBe('Syncing failed. Please try again later.'));
        expect(getChanges()).toHaveLength(3);

        findButton('Sync')?.click();
        backend.expectOne({ method: 'POST', url: '/api/todos' }).flush({ id: 7, title: 'Buy milk' });
        await vi.waitFor(() => expect(getStatus()).toBe('Synced.'));
        await render();
        expect(getChanges()).toEqual([
            { text: 'Changed Buy milk is done', canSync: true },
            { text: 'Deleted /api/todos/3', canSync: true }
        ]);
        // the button the user pressed is gone, so the focus moves to the list
        expect(document.activeElement).toBe(findDialog()?.querySelector('ul'));
    });

    test('syncs every change, then closes and says so', async () => {
        const backend: HttpTestingController = await setup();
        setConnection(true);
        await render();

        findButton('Sync all')?.click();
        backend.expectOne({ method: 'POST', url: '/api/todos' }).flush({ id: 7, title: 'Buy milk' });
        (await vi.waitFor(() => backend.expectOne({ method: 'PATCH', url: '/api/todos/7' }))).flush({});
        (await vi.waitFor(() => backend.expectOne({ method: 'DELETE', url: '/api/todos/3' }))).flush({});

        await vi.waitFor(() => expect(findDialog()).toBeNull());
        await vi.waitFor(() => expect(document.querySelector('ui-snackbar')?.textContent.trim()).toBe('Every change is synced.'));
        expect(TestBed.inject(OfflineService).cachedRequests()).toEqual([]);
    });

    test('discards one change, or every change after the user confirmed it, and closes', async () => {
        await setup();
        await render();

        findButton('Discard', 2)?.click();
        await render();
        expect(getStatus()).toBe('Discarded.');
        expect(getChanges().map(change => change.text)).toEqual(['New Buy milk', 'Changed Buy milk is done']);

        findButton('Discard all')?.click();
        const question: HTMLDialogElement = await vi.waitFor(() => findQuestion() ?? Promise.reject(new Error('no question yet')));
        expect(question.querySelector('h2')?.textContent).toBe('Discard every change?');
        findButtonIn(question, 'Cancel')?.click();
        await vi.waitFor(() => expect(findQuestion()).toBeUndefined());
        expect(getChanges()).toHaveLength(2);

        findButton('Discard all')?.click();
        findButtonIn(await vi.waitFor(() => findQuestion() ?? Promise.reject(new Error('no question yet'))), 'Discard all')?.click();
        await vi.waitFor(() => expect(findDialog()).toBeNull());
        expect(TestBed.inject(OfflineService).cachedRequests()).toEqual([]);
    });
});