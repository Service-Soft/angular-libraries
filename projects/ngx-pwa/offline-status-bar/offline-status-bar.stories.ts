import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { CachedRequest, offlineInterceptor } from '@service-soft/ngx-pwa/offline';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { OfflineStatusBarComponent } from './offline-status-bar.component';

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

const meta: Meta<OfflineStatusBarComponent> = {
    title: 'PWA/Offline status bar',
    component: OfflineStatusBarComponent,
    decorators: [applicationConfig({ providers: [provideHttpClient(withInterceptors([offlineInterceptor]))] })]
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