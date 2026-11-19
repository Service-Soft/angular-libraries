import { HttpClient, HttpContext, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OFFLINE_REQUEST_METADATA, offlineInterceptor } from '@service-soft/ngx-pwa/offline';
import { offlineCacheInterceptor, provideOfflineCache } from '@service-soft/ngx-pwa/offline-cache';
import { firstValueFrom } from 'rxjs';
import { DialogTestingUtilities } from 'testing/dialog';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { provideOfflineStatusBarConfig } from './offline-status-bar-config.provider';
import { OfflineStatusBarComponent } from './offline-status-bar.component';

function setConnection(online: boolean): void {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

async function render(): Promise<[ComponentFixture<OfflineStatusBarComponent>, HTMLElement, HttpClient]> {
    TestBed.configureTestingModule({
        providers: [
            provideHttpClient(withInterceptors([offlineInterceptor])),
            provideHttpClientTesting(),
            provideOfflineStatusBarConfig({ labels: { unsavedChanges: 'Not saved yet' } })
        ]
    });
    const fixture: ComponentFixture<OfflineStatusBarComponent> = TestBed.createComponent(OfflineStatusBarComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement, TestBed.inject(HttpClient)];
}

function getStatus(root: HTMLElement): string {
    return root.querySelector('[role="status"]')?.textContent.trim() ?? '';
}

describe('OfflineStatusBarComponent', () => {
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
    });

    afterEach(() => {
        removeModalDialogs();
        document.querySelector('ui-dialog')?.remove();
        localStorage.clear();
        vi.restoreAllMocks();
    });

    test('shows nothing while online without changes, and says when the user goes offline', async () => {
        setConnection(true);
        const [fixture, root] = await render();
        expect(getStatus(root)).toBe('');
        // no empty bar takes up space
        expect(root.querySelector('div')?.className).toBe('');

        setConnection(false);
        await fixture.whenStable();
        expect(getStatus(root)).toBe('Offline');
        expect(root.querySelector('button')).toBeNull();
    });

    test('counts the changes made offline and opens the sync dialog for them', async () => {
        setConnection(false);
        const [fixture, root, http] = await render();
        const context: HttpContext = new HttpContext().set(OFFLINE_REQUEST_METADATA, { type: 'todo' });
        await firstValueFrom(http.post('/api/todos', { title: 'Buy milk' }, { context }));
        await firstValueFrom(http.post('/api/todos', { title: 'Pay rent' }, { context }));
        await fixture.whenStable();
        expect(root.querySelector('button')?.textContent.trim()).toBe('Sync (2)');

        setConnection(true);
        await fixture.whenStable();
        expect(getStatus(root)).toBe('Not saved yet');

        root.querySelector('button')?.click();
        await vi.waitFor(() => expect(document.querySelector('dialog h2')?.textContent).toBe('Unsaved changes'));
    });

    test('says how old the data of the offline cache is while the app shows it', async () => {
        setConnection(true);
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([offlineCacheInterceptor])),
                provideHttpClientTesting(),
                provideOfflineCache({ urls: ['/api/'] })
            ]
        });
        const fixture: ComponentFixture<OfflineStatusBarComponent> = TestBed.createComponent(OfflineStatusBarComponent);
        const root: HTMLElement = fixture.nativeElement as HTMLElement;
        const http: HttpClient = TestBed.inject(HttpClient);
        const backend: HttpTestingController = TestBed.inject(HttpTestingController);
        const loaded: Promise<unknown> = firstValueFrom(http.get('/api/todos'));
        backend.expectOne('/api/todos').flush([]);
        await loaded;

        // the browser thinks it is online, but the server can't be reached
        const cached: Promise<unknown> = firstValueFrom(http.get('/api/todos'));
        backend.expectOne('/api/todos').error(new ProgressEvent('error'));
        await cached;
        await fixture.whenStable();
        expect(getStatus(root)).toMatch(/^Offline\s+· Data from \d+\/\d+\/\d+, \d+:\d+\s[AP]M$/);

        const again: Promise<unknown> = firstValueFrom(http.get('/api/todos'));
        backend.expectOne('/api/todos').flush([]);
        await again;
        await fixture.whenStable();
        expect(getStatus(root)).toBe('');
    });
});