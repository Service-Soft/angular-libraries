import { httpResource, HttpResourceRef, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Component, inject, provideAppInitializer } from '@angular/core';
import { CachedRequest, offlineInterceptor, OfflineService } from '@service-soft/ngx-pwa/offline';
import { offlineCacheInterceptor, provideOfflineCache } from '@service-soft/ngx-pwa/offline-cache';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { OfflineStatusBarComponent } from './offline-status-bar.component';

// an api of its own origin, which never resolves: without a test that answers it, every request fails like offline.
const TODOS_URL: string = 'https://api.storybook.test/todos';

const REQUESTS: CachedRequest[] = [
    {
        id: 'offline-1',
        method: 'POST',
        url: '/api/todos',
        body: { title: 'Buy milk' },
        type: 'todo',
        idKey: 'id',
        displayValue: 'Buy milk'
    },
    { id: 'offline-2', method: 'DELETE', url: '/api/todos/3', body: undefined, type: 'todo', idKey: 'id', displayValue: 'Pay rent' }
];

// what the OfflineService finds in the browser when the app starts. Storybook can't take the browser offline, so the
// stories tell the app what the browser would say.
function startWith(online: boolean, requests: CachedRequest[]): () => Promise<object> {
    return async () => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
        localStorage.setItem('offlineRequests', JSON.stringify(requests));
        return await Promise.resolve({});
    };
}

// a page of the app below the bar, which loads the todos through the offline cache.
@Component({
    selector: 'ngx-todos-page',
    template: `
        <ngx-offline-status-bar />
        <main class="p-4 text-body">
            @if (todos.hasValue()) {
                <ul>
                    @for (todo of todos.value(); track $index) {
                        <li>{{ todo }}</li>
                    }
                </ul>
            }
            @else if (todos.error()) {
                <p>The todos could not be loaded.</p>
            }
        </main>
    `,
    imports: [OfflineStatusBarComponent]
})
class TodosPageComponent {
    protected readonly todos: HttpResourceRef<string[] | undefined> = httpResource<string[]>(() => TODOS_URL);
}

const meta: Meta<OfflineStatusBarComponent> = {
    title: 'PWA/Offline status bar',
    component: OfflineStatusBarComponent,
    decorators: [
        applicationConfig({
            providers: [
                provideHttpClient(withInterceptors([offlineCacheInterceptor, offlineInterceptor])),
                provideOfflineCache({ urls: ['https://api.storybook.test/'] })
            ]
        })
    ]
};
export default meta;

type Story = StoryObj<OfflineStatusBarComponent>;

export const UnsavedChanges: Story = {
    loaders: [startWith(true, REQUESTS)]
};

export const Offline: Story = {
    loaders: [startWith(false, [])]
};

export const OfflineWithUnsavedChanges: Story = {
    loaders: [startWith(false, REQUESTS)]
};

// the app shows what it loaded yesterday morning, from the offline cache.
export const OfflineWithCachedData: Story = {
    loaders: [startWith(false, [])],
    decorators: [
        applicationConfig({
            providers: [provideAppInitializer(() => inject(OfflineService).noteCachedAnswer(new Date('2026-11-18T08:30:00')))]
        })
    ]
};

// loads the todos when it shows: with the api answering, they are kept in IndexedDB, and shown from there once it
// doesn't, like after a reload without a connection.
export const WithOfflineCache: Story = {
    loaders: [startWith(true, [])],
    render: () => ({ template: '<ngx-todos-page />', moduleMetadata: { imports: [TodosPageComponent] } })
};