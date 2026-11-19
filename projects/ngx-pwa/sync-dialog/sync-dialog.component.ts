import { afterNextRender, Component, computed, ElementRef, inject, Injector, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { faCloudArrowUp, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { CachedRequest, OfflineService } from '@service-soft/ngx-pwa/offline';
import { ButtonComponent } from '@service-soft/ui/button';
import { ConfirmDialogComponent, ConfirmDialogData, DIALOG_DATA, DialogRef, DialogService } from '@service-soft/ui/dialog';
import { IconComponent } from '@service-soft/ui/icon';
import { SnackbarService } from '@service-soft/ui/snackbar';

import { SyncDialogLabels } from './sync-dialog-config.model';
import { SYNC_DIALOG_CONFIG } from './sync-dialog-config.provider';
import { SyncDialogData } from './sync-dialog-data.model';
import { SyncRequestView } from './sync-request-view.model';

/**
 * The dialog where the user syncs or discards the changes they made offline, opened with the DialogService:
 * `dialogService.open(SyncDialogComponent)`. The OfflineStatusBarComponent opens it from its sync button. It closes by
 * itself once no change is left, with true. Opened with the SyncDialogData `{ beforeLogout: true }`, it asks before
 * the user logs out, see syncBeforeLogout.
 */
@Component({
    selector: 'ngx-sync-dialog',
    templateUrl: './sync-dialog.component.html',
    imports: [ButtonComponent, IconComponent]
})
export class SyncDialogComponent {
    private readonly snackbarService: SnackbarService = inject(SnackbarService);

    private readonly injector: Injector = inject(Injector);

    private readonly dialogService: DialogService = inject(DialogService);

    private readonly list: Signal<ElementRef<HTMLElement> | undefined> = viewChild<ElementRef<HTMLElement>>('list');

    // a second click while a request is on its way would send it twice.
    private syncing: boolean = false;

    /**
     * The changes made offline and whether the user is offline.
     */
    protected readonly offlineService: OfflineService = inject(OfflineService);

    /**
     * The dialog, to close it.
     */
    protected readonly dialogRef: DialogRef = inject(DialogRef);

    /**
     * The texts of the dialog.
     */
    protected readonly labels: SyncDialogLabels = inject(SYNC_DIALOG_CONFIG).labels;

    /**
     * Whether the dialog asks before the user logs out.
     */
    protected readonly beforeLogout: boolean = inject<SyncDialogData | undefined>(DIALOG_DATA)?.beforeLogout === true;

    /**
     * The button that closes the dialog, which keeps the user logged in before a logout.
     */
    protected readonly closeLabel: string = this.beforeLogout ? this.labels.stayLoggedIn : this.labels.close;

    /**
     * The icon of the buttons that sync a change.
     */
    protected readonly faCloudArrowUp: typeof faCloudArrowUp = faCloudArrowUp;

    /**
     * The icon of the buttons that discard a change.
     */
    protected readonly faTrashCan: typeof faTrashCan = faTrashCan;

    /**
     * Whether the list can take the focus, only while the button the user pressed is gone.
     */
    // a dialog that opens focuses the first element that can take the focus, which a list with a tabindex would be.
    protected readonly listFocusable: WritableSignal<boolean> = signal(false);

    /**
     * What the last action did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    /**
     * The changes, oldest first.
     */
    protected readonly requests: Signal<SyncRequestView[]> = computed(() => {
        const offline: boolean = this.offlineService.offline();
        return this.offlineService.cachedRequests().map(request => ({
            request,
            methodLabel: this.labels.methods[request.method],
            descriptionId: `ngx-sync-request-${request.id}`,
            canSync: !offline && !this.offlineService.hasUnresolvedDependency(request)
        }));
    });

    /**
     * Syncs one change.
     * @param request - The request of the change.
     */
    protected async sync(request: CachedRequest): Promise<void> {
        await this.runSync(async () => await this.offlineService.sync(request));
    }

    /**
     * Syncs every change, oldest first.
     */
    protected async syncAll(): Promise<void> {
        await this.runSync(async () => await this.offlineService.syncAll());
    }

    /**
     * Discards one change.
     * @param request - The request of the change.
     */
    protected discard(request: CachedRequest): void {
        this.offlineService.remove(request);
        if (!this.offlineService.cachedRequests().length) {
            this.dialogRef.close(true);
            return;
        }
        this.status.set(this.labels.discarded);
        this.focusList();
    }

    /**
     * Asks whether to discard every change, and discards them and closes the dialog when the user confirms.
     */
    protected async discardAll(): Promise<void> {
        const data: ConfirmDialogData = {
            title: this.labels.discardAllTitle,
            paragraphs: [this.labels.discardAllMessage],
            confirmButtonLabel: this.labels.discardAll,
            cancelButtonLabel: this.labels.cancel,
            confirmButtonColor: 'error'
        };
        const confirmed: boolean | undefined = await this.dialogService.open<boolean>(ConfirmDialogComponent, data).closed;
        if (confirmed !== true) {
            return;
        }
        this.offlineService.removeAll();
        this.dialogRef.close(true);
    }

    private async runSync(syncRequests: () => Promise<void>): Promise<void> {
        if (this.syncing) {
            return;
        }
        this.syncing = true;
        try {
            await syncRequests();
        }
        catch {
            this.status.set(this.labels.syncFailed);
            return;
        }
        finally {
            this.syncing = false;
        }
        if (!this.offlineService.cachedRequests().length) {
            this.dialogRef.close(true);
            this.snackbarService.open(this.labels.allSynced);
            return;
        }
        this.status.set(this.labels.synced);
        this.focusList();
    }

    // the button the user pressed is gone with its change, which would leave the focus nowhere.
    private focusList(): void {
        this.listFocusable.set(true);
        afterNextRender(() => this.list()?.nativeElement.focus(), { injector: this.injector });
    }
}