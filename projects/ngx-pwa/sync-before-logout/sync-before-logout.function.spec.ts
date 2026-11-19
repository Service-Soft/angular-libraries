import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { OFFLINE_REQUEST_METADATA, offlineInterceptor, OfflineService } from '@service-soft/ngx-pwa/offline';
import { firstValueFrom } from 'rxjs';
import { DialogTestingUtilities } from 'testing/dialog';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { syncBeforeLogout } from './sync-before-logout.function';

function setConnection(online: boolean): void {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

function setup(): HttpClient {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([offlineInterceptor])), provideHttpClientTesting()] });
    return TestBed.inject(HttpClient);
}

// a change the user makes offline, through the interceptor like in a real app.
async function changeOffline(http: HttpClient): Promise<void> {
    setConnection(false);
    await firstValueFrom(http.post('/api/todos', { title: 'Buy milk' }, {
        context: new HttpContext().set(OFFLINE_REQUEST_METADATA, { type: 'todo', displayValue: 'Buy milk' })
    }));
}

// what the beforeLogout of provideAuth does: it runs in an injection context.
function askBeforeLogout(): boolean | Promise<boolean> {
    return TestBed.runInInjectionContext(syncBeforeLogout);
}

async function findDialog(): Promise<HTMLDialogElement> {
    return await vi.waitFor(() => document.querySelector('dialog') ?? Promise.reject(new Error('no dialog yet')));
}

async function click(text: string, dialog?: HTMLDialogElement): Promise<void> {
    const within: HTMLDialogElement = dialog ?? await findDialog();
    const button: HTMLButtonElement = await vi.waitFor(() => [...within.querySelectorAll('button')]
        .find(candidate => candidate.textContent.trim() === text) ?? Promise.reject(new Error(`no button "${text}" yet`)));
    button.click();
}

describe('syncBeforeLogout', () => {
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

    test('logs out at once without changes, and asks in the sync dialog with some, which can keep the user logged in', async () => {
        const http: HttpClient = setup();
        // nothing to wait for: the logout isn't held up
        expect(askBeforeLogout()).toBe(true);

        await changeOffline(http);
        const stay: boolean | Promise<boolean> = askBeforeLogout();
        const dialog: HTMLDialogElement = await findDialog();
        expect(dialog.textContent).toContain('Sync or discard your changes before you log out.');
        await click('Stay logged in', dialog);
        expect(await stay).toBe(false);
        expect(TestBed.inject(OfflineService).cachedRequests()).toHaveLength(1);
        await vi.waitFor(() => expect(document.querySelector('dialog')).toBeNull());

        // discarded: nothing is left that the logout would leave behind
        const discarded: boolean | Promise<boolean> = askBeforeLogout();
        await click('Discard all');
        const question: HTMLDialogElement = await vi.waitFor(() => [...document.querySelectorAll('dialog')].at(1) ?? Promise.reject(new Error('no question yet')));
        await click('Discard all', question);
        expect(await discarded).toBe(true);
    });

    test('logs out once every change is synced', async () => {
        const http: HttpClient = setup();
        await changeOffline(http);
        setConnection(true);

        const synced: boolean | Promise<boolean> = askBeforeLogout();
        await click('Sync all');
        (await vi.waitFor(() => TestBed.inject(HttpTestingController).expectOne({ method: 'POST', url: '/api/todos' }))).flush({ id: 1 });

        expect(await synced).toBe(true);
    });
});