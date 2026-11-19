import { inject } from '@angular/core';
import { OfflineService } from '@service-soft/ngx-pwa/offline';
import { DialogService } from '@service-soft/ui/dialog';

/**
 * Asks the user to sync or discard the changes they made offline before they log out, in the sync dialog, which is
 * only loaded when there are any. Made for the beforeLogout of provideAuth of `@service-soft/ngx-auth`:
 * `provideAuth(AppAuthService, { apiUrl, strategy, beforeLogout: syncBeforeLogout })`. Call it in an injection context.
 * @returns Whether to log out: true once no change is left, false when the user stays logged in.
 */
export function syncBeforeLogout(): boolean | Promise<boolean> {
    const offlineService: OfflineService = inject(OfflineService);
    if (!offlineService.cachedRequests().length) {
        // answered at once, so the logout doesn't wait for anything
        return true;
    }
    const dialogService: DialogService = inject(DialogService);
    return (async () => {
        const { SyncDialogComponent } = await import('@service-soft/ngx-pwa/sync-dialog');
        return await dialogService.open<boolean>(SyncDialogComponent, { beforeLogout: true }).closed === true;
    })();
}