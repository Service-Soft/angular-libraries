import { DOCUMENT } from '@angular/common';
import { inject, Injector, Service } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import type { ConfirmDialogData } from '@service-soft/ui/dialog';
import { filter } from 'rxjs';

import { UpdatesConfig } from './updates-config.model';
import { UPDATES_CONFIG } from './updates-config.provider';

/**
 * Asks the user to reload once the service worker has downloaded a new version of the app, or when parts of the
 * running version can't be loaded anymore. Created by provideUpdates.
 */
@Service()
export class UpdateService {
    private readonly injector: Injector = inject(Injector);

    private readonly document: Document = inject(DOCUMENT);

    private readonly config: UpdatesConfig = inject(UPDATES_CONFIG);

    private asking: boolean = false;

    constructor() {
        const swUpdate: SwUpdate = inject(SwUpdate);
        if (!swUpdate.isEnabled) {
            return;
        }
        swUpdate.versionUpdates
            .pipe(filter(event => event.type === 'VERSION_READY'), takeUntilDestroyed())
            .subscribe(() => void this.askToReload(this.config.labels.newVersionTitle, this.config.labels.newVersionMessage));
        // the service worker deleted files the running version still needs, like after an update while the app was
        // open for long. Lazy routes fail from then on, only a reload helps.
        swUpdate.unrecoverable
            .pipe(takeUntilDestroyed())
            .subscribe(() => void this.askToReload(this.config.labels.unrecoverableTitle, this.config.labels.unrecoverableMessage));
    }

    private async askToReload(title: string, message: string): Promise<void> {
        // whatever happens while the user still decides is solved by the same reload.
        if (this.asking) {
            return;
        }
        this.asking = true;
        try {
            // every page creates this service, the dialog is only loaded once it is needed.
            const { ConfirmDialogComponent, DialogService } = await import('@service-soft/ui/dialog');
            const data: ConfirmDialogData = {
                title,
                paragraphs: [message],
                confirmButtonLabel: this.config.labels.reload,
                cancelButtonLabel: this.config.labels.notNow
            };
            const reload: boolean | undefined = await this.injector.get(DialogService).open<boolean>(ConfirmDialogComponent, data).closed;
            if (reload === true) {
                this.document.location.reload();
            }
        }
        finally {
            this.asking = false;
        }
    }
}