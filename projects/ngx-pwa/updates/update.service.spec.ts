// the DialogService renders the content of a dialog into a div, so the tests find it by its dialog.
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, UnrecoverableStateEvent, VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { DialogTestingUtilities } from 'testing/dialog';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { provideUpdates } from './updates.provider';

// the service worker, which can't run in a test. It behaves like SwUpdate with a running service worker.
class ServiceWorkerUpdates {
    readonly isEnabled: boolean = true;

    readonly versionUpdates: Subject<VersionEvent> = new Subject<VersionEvent>();

    readonly unrecoverable: Subject<UnrecoverableStateEvent> = new Subject<UnrecoverableStateEvent>();
}

async function setup(): Promise<ServiceWorkerUpdates> {
    const serviceWorker: ServiceWorkerUpdates = new ServiceWorkerUpdates();
    TestBed.configureTestingModule({
        providers: [{ provide: SwUpdate, useValue: serviceWorker }, provideUpdates({ labels: { reload: 'Reload now' } })]
    });
    await TestBed.inject(ApplicationInitStatus).donePromise;
    return serviceWorker;
}

function findDialog(): HTMLDialogElement | null {
    return document.querySelector('dialog');
}

function getButtons(dialog: HTMLDialogElement): string[] {
    return [...dialog.querySelectorAll('button')].map(button => button.textContent.trim());
}

describe('UpdateService', () => {
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
    });

    afterEach(() => {
        removeModalDialogs();
        document.querySelector('ui-dialog')?.remove();
    });

    test('asks to reload once a new version is ready, and again for the next one after "Not now"', async () => {
        const serviceWorker: ServiceWorkerUpdates = await setup();

        serviceWorker.versionUpdates.next({ type: 'VERSION_DETECTED', version: { hash: 'b' } });
        await new Promise(resolve => setTimeout(resolve));
        expect(findDialog()).toBeNull();

        serviceWorker.versionUpdates.next({ type: 'VERSION_READY', currentVersion: { hash: 'a' }, latestVersion: { hash: 'b' } });
        const dialog: HTMLDialogElement = await vi.waitFor(() => findDialog() ?? Promise.reject(new Error('no dialog yet')));
        expect(dialog.open).toBe(true);
        expect(dialog.querySelector('h2')?.textContent).toBe('New version available');
        // the changed label, and the defaults of the others
        expect(getButtons(dialog)).toEqual(['Not now', 'Reload now']);

        [...dialog.querySelectorAll('button')].find(button => button.textContent.trim() === 'Not now')?.click();
        await vi.waitFor(() => expect(findDialog()).toBeNull());

        serviceWorker.versionUpdates.next({ type: 'VERSION_READY', currentVersion: { hash: 'a' }, latestVersion: { hash: 'c' } });
        await vi.waitFor(() => expect(findDialog()?.open).toBe(true));
    });

    test('asks to reload when parts of the running version can\'t be loaded anymore', async () => {
        const serviceWorker: ServiceWorkerUpdates = await setup();

        serviceWorker.unrecoverable.next({ type: 'UNRECOVERABLE_STATE', reason: 'Hash mismatch' });
        const dialog: HTMLDialogElement = await vi.waitFor(() => findDialog() ?? Promise.reject(new Error('no dialog yet')));

        expect(dialog.open).toBe(true);
        expect(dialog.querySelector('h2')?.textContent).toBe('Reload needed');
        expect(getButtons(dialog)).toEqual(['Not now', 'Reload now']);
    });

    test('asks once while a second version gets ready', async () => {
        const serviceWorker: ServiceWorkerUpdates = await setup();

        serviceWorker.versionUpdates.next({ type: 'VERSION_READY', currentVersion: { hash: 'a' }, latestVersion: { hash: 'b' } });
        serviceWorker.versionUpdates.next({ type: 'VERSION_READY', currentVersion: { hash: 'a' }, latestVersion: { hash: 'c' } });
        await vi.waitFor(() => expect(findDialog()?.open).toBe(true));

        expect(document.querySelectorAll('dialog')).toHaveLength(1);
    });
});