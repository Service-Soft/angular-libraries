import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { afterNextRender, Component, inject, input, InputSignal } from '@angular/core';
import { CachedRequest, offlineInterceptor } from '@service-soft/ngx-pwa/offline';
import { ButtonComponent } from '@service-soft/ui/button';
import { DialogService } from '@service-soft/ui/dialog';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { SyncDialogData } from './sync-dialog-data.model';
import { SyncDialogComponent } from './sync-dialog.component';

// a new todo, a change of it that waits for it, and a deleted one.
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
    {
        id: 'offline-2',
        method: 'PATCH',
        url: '/api/todos/offline-1',
        body: { done: true },
        type: 'todo',
        idKey: 'id',
        displayValue: 'Buy milk is done'
    },
    { id: 'offline-3', method: 'DELETE', url: '/api/todos/3', body: undefined, type: 'todo', idKey: 'id', displayValue: '/api/todos/3' }
];

// what the OfflineService finds in the browser when the app starts. Storybook can't take the browser offline, so the
// stories tell the app what the browser would say.
function startWith(online: boolean): () => Promise<object> {
    return async () => {
        Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
        localStorage.setItem('offlineRequests', JSON.stringify(REQUESTS));
        return await Promise.resolve({});
    };
}

// opens the dialog right away, like the sync button of the offline status bar, and offers to open it again.
@Component({
    selector: 'ngx-sync-button',
    template: '<button ui-button type="button" variant="outlined" (click)="open()">Sync</button>',
    imports: [ButtonComponent]
})
class SyncButtonComponent {
    private readonly dialogService: DialogService = inject(DialogService);

    /**
     * Whether the dialog asks before the user logs out, like syncBeforeLogout opens it.
     */
    readonly beforeLogout: InputSignal<boolean> = input(false);

    constructor() {
        afterNextRender(() => this.open());
    }

    open(): void {
        const data: SyncDialogData = { beforeLogout: this.beforeLogout() };
        this.dialogService.open(SyncDialogComponent, data);
    }
}

const meta: Meta<SyncDialogComponent> = {
    title: 'PWA/Sync dialog',
    component: SyncDialogComponent,
    decorators: [applicationConfig({ providers: [provideHttpClient(withInterceptors([offlineInterceptor]))] })],
    render: () => ({ template: '<ngx-sync-button />', moduleMetadata: { imports: [SyncButtonComponent] } })
};
export default meta;

type Story = StoryObj<SyncDialogComponent>;

export const Default: Story = {
    loaders: [startWith(true)]
};

export const Offline: Story = {
    loaders: [startWith(false)]
};

export const BeforeLogout: Story = {
    loaders: [startWith(true)],
    render: () => ({ template: '<ngx-sync-button [beforeLogout]="true" />', moduleMetadata: { imports: [SyncButtonComponent] } })
};