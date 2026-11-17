import { inject, Injectable, Injector } from '@angular/core';

import { UnsavedChangesConfig } from './unsaved-changes-config.model';
import { UNSAVED_CHANGES_CONFIG } from './unsaved-changes-config.provider';

/**
 * Asks the user whether to lose the changes they didn't save.
 */
@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
    private readonly injector: Injector = inject(Injector);

    private readonly config: UnsavedChangesConfig = inject(UNSAVED_CHANGES_CONFIG);

    /**
     * Asks whether to discard the changes, in a dialog whose cancel button keeps them.
     * @returns Whether the user discards them.
     */
    async askToDiscard(): Promise<boolean> {
        // loaded when it is first asked, so the routes that use the guard don't put the dialogs into the main bundle.
        const { ConfirmDialogComponent, DialogService } = await import('@service-soft/ui/dialog');
        const discard: boolean | undefined = await this.injector.get(DialogService).open<boolean>(ConfirmDialogComponent, {
            title: this.config.title,
            paragraphs: this.config.paragraphs,
            confirmButtonLabel: this.config.discardLabel,
            cancelButtonLabel: this.config.keepEditingLabel,
            confirmButtonColor: 'error'
        }).closed;
        return discard === true;
    }
}