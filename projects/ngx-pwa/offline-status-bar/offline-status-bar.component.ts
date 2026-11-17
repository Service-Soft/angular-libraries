import { Component, computed, inject, Signal } from '@angular/core';
import { faArrowsRotate, faCloudArrowUp, faPlugCircleXmark } from '@fortawesome/free-solid-svg-icons';
import { OfflineService } from '@service-soft/ngx-pwa/offline';
import { ButtonComponent } from '@service-soft/ui/button';
import { DialogService } from '@service-soft/ui/dialog';
import { IconComponent } from '@service-soft/ui/icon';

import { OfflineStatusBarLabels } from './offline-status-bar-config.model';
import { OFFLINE_STATUS_BAR_CONFIG } from './offline-status-bar-config.provider';
import { OfflineStatusView } from './offline-status-view.model';

// the line in the warning color is decoration, the text says what is wrong. Text and button stay on a surface, where
// their contrast is checked.
const BAR_CLASSES: string = `
    flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-b-4 border-warning bg-surface-container px-4 py-1
`;

/**
 * A bar that says when the user is offline or has changes that aren't synced, with a button that opens the sync
 * dialog. Shows nothing otherwise. Put it at the top of the app: `<ngx-offline-status-bar />`.
 */
@Component({
    selector: 'ngx-offline-status-bar',
    templateUrl: './offline-status-bar.component.html',
    imports: [ButtonComponent, IconComponent],
    host: {
        class: 'block'
    }
})
export class OfflineStatusBarComponent {
    private readonly offlineService: OfflineService = inject(OfflineService);

    private readonly dialogService: DialogService = inject(DialogService);

    /**
     * The texts of the bar.
     */
    protected readonly labels: OfflineStatusBarLabels = inject(OFFLINE_STATUS_BAR_CONFIG).labels;

    /**
     * The icon of the sync button.
     */
    protected readonly faArrowsRotate: typeof faArrowsRotate = faArrowsRotate;

    /**
     * How many changes aren't synced.
     */
    protected readonly count: Signal<number> = computed(() => this.offlineService.cachedRequests().length);

    /**
     * What the bar says, or undefined while there is nothing to say.
     */
    protected readonly status: Signal<OfflineStatusView | undefined> = computed(() => {
        if (this.offlineService.offline()) {
            return { message: this.labels.offline, icon: faPlugCircleXmark };
        }
        return this.count() ? { message: this.labels.unsavedChanges, icon: faCloudArrowUp } : undefined;
    });

    /**
     * The classes of the bar, which has no box while it says nothing.
     */
    protected readonly barClasses: Signal<string> = computed(() => this.status() ? BAR_CLASSES : '');

    /**
     * Opens the sync dialog.
     */
    protected async openSyncDialog(): Promise<void> {
        // the bar is on every page, the dialog is only loaded once the user opens it.
        const { SyncDialogComponent } = await import('@service-soft/ngx-pwa/sync-dialog');
        this.dialogService.open(SyncDialogComponent);
    }
}