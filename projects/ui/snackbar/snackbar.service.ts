import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, inject, PLATFORM_ID, Service } from '@angular/core';

import { SnackbarConfig } from './snackbar-config.model';
import { SNACKBAR_CONFIG } from './snackbar-config.provider';
import { SnackbarComponent } from './snackbar.component';

// screen readers only announce a change of a live region that was there before. A region that is added together with
// its message is often read late or not at all, so a new one gets its message after the browser had time to notice it.
const NEW_REGION_DELAY: number = 100;

/**
 * Shows short messages at the bottom of the screen, which screen readers announce without moving the focus, like
 * 'Saved.'. One message shows at a time: a new one replaces the one before.
 */
@Service()
export class SnackbarService {
    private readonly document: Document = inject(DOCUMENT);
    private readonly applicationRef: ApplicationRef = inject(ApplicationRef);
    private readonly environmentInjector: EnvironmentInjector = inject(EnvironmentInjector);
    private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));
    private readonly config: SnackbarConfig = inject(SNACKBAR_CONFIG);

    private snackbar?: ComponentRef<SnackbarComponent>;
    private hideTimeout?: ReturnType<typeof setTimeout>;

    /**
     * Shows a message, which hides itself after the duration of the config.
     * Only for information the user doesn't have to act on: the message goes away by itself.
     * @param message - The message, like 'Saved.'.
     * @param options - How this message behaves, like how long it shows and its color.
     */
    open(message: string, options: Partial<SnackbarConfig> = {}): void {
        if (!this.isBrowser) {
            return;
        }
        const config: SnackbarConfig = { ...this.config, ...options };
        if (this.snackbar) {
            this.show(this.snackbar, message, config);
            return;
        }
        const snackbar: ComponentRef<SnackbarComponent> = this.createSnackbar();
        setTimeout(() => this.show(snackbar, message, config), NEW_REGION_DELAY);
    }

    private show(snackbar: ComponentRef<SnackbarComponent>, message: string, { duration, color }: SnackbarConfig): void {
        clearTimeout(this.hideTimeout);
        snackbar.setInput('message', message);
        snackbar.setInput('color', color);
        snackbar.changeDetectorRef.detectChanges();
        this.hideTimeout = setTimeout(() => {
            snackbar.setInput('message', '');
            snackbar.changeDetectorRef.detectChanges();
        }, duration);
    }

    private createSnackbar(): ComponentRef<SnackbarComponent> {
        const snackbar: ComponentRef<SnackbarComponent> = createComponent(SnackbarComponent, {
            environmentInjector: this.environmentInjector
        });
        this.applicationRef.attachView(snackbar.hostView);
        this.document.body.append(snackbar.location.nativeElement as Node);
        snackbar.changeDetectorRef.detectChanges();
        this.snackbar = snackbar;
        return snackbar;
    }
}