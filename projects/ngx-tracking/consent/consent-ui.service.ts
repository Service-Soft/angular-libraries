/**
 * What the user sees of the consent: the dialog where they choose, and the notice when their browser chose for them.
 * ConsentDialogUi from '@service-soft/ngx-tracking/consent-dialog' implements it. Extend it for a ui of your own.
 */
export abstract class ConsentUi {
    /**
     * Opens the dialog where the user chooses which trackings to allow, and saves the choices with the ConsentService.
     * @returns A promise that resolves once the dialog closed.
     */
    abstract openDialog(): Promise<void>;

    /**
     * Tells the user that every tracking that needs consent was turned off, because their browser asked not to be
     * tracked.
     */
    abstract showDoNotTrackNotice(): void;
}