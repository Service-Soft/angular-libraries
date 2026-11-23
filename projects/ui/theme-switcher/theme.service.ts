import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service, Signal, signal, WritableSignal } from '@angular/core';

import { ThemeMode } from './theme-mode.type';
import { ThemeModeUtilities } from './theme-mode.utilities';

/**
 * The color mode of the page, which the user can choose: the one of the operating system, light or dark.
 * The choice is remembered in this browser and applied to `<html>`.
 */
@Service()
export class ThemeService {
    private readonly document: Document = inject(DOCUMENT);
    private readonly window: Window | undefined = isPlatformBrowser(inject(PLATFORM_ID))
        ? this.document.defaultView ?? undefined
        : undefined;

    private readonly modeSignal: WritableSignal<ThemeMode> = signal(this.resolveInitialMode());

    /**
     * The mode the user chose. 'system' on the server, which can't know the choice of a browser.
     */
    readonly mode: Signal<ThemeMode> = this.modeSignal.asReadonly();

    constructor() {
        // the script of the head usually applied it already. Without it, the page switches now
        this.apply(this.modeSignal());
    }

    /**
     * Changes the mode of the page and remembers it in this browser.
     * @param mode - The mode. 'system' follows the operating system again.
     */
    setMode(mode: ThemeMode): void {
        this.modeSignal.set(mode);
        this.apply(mode);
        if (this.window) {
            ThemeModeUtilities.store(this.window, mode);
        }
    }

    private resolveInitialMode(): ThemeMode {
        return (this.window ? ThemeModeUtilities.findStoredMode(this.window) : undefined) ?? 'system';
    }

    // the server renders every page for every user, so it leaves <html> as it is
    private apply(mode: ThemeMode): void {
        if (this.window) {
            ThemeModeUtilities.apply(this.document.documentElement, mode);
        }
    }
}