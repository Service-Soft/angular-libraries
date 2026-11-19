import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injector, PLATFORM_ID, Service } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

import { ConsentConfig } from './consent-config.model';
import { CONSENT_CONFIG } from './consent-config.provider';
import { ConsentUi } from './consent-ui.service';
import { Tracking } from './tracking.model';
import { TrackingService } from './tracking.service';

const CHOICES_KEY: string = 'trackingConsentChoices';

// what counts as the user doing something with the page: a click or tap, a key, scrolling, and moving the mouse,
// which opens the dialog within the first second on a desktop, but doesn't end the measurement of the largest paint.
const INTERACTIONS: (keyof DocumentEventMap)[] = ['pointerdown', 'keydown', 'touchstart', 'scroll', 'wheel', 'mousemove'];

/**
 * When the user made their choices, as it is stored in the browser.
 */
type StoredChoices = {
    /**
     * When the user made their choices, as an ISO string.
     */
    madeAt: string
};

/**
 * The browser apis that tell whether the user asked not to be tracked. Not every browser has them.
 */
type PrivacySignals = {
    /**
     * Global Privacy Control, which the law of some places treats as an objection.
     */
    globalPrivacyControl?: boolean,
    /**
     * The older Do Not Track header, '1' when it is set.
     */
    doNotTrack?: string | null
};

/**
 * Asks the user which trackings they allow and keeps their choices. The consentGuard or the askOn of
 * provideTrackingConsent ask; call openDialog to let the user change their choices later, like from a link in the footer.
 */
@Service()
export class ConsentService {
    private readonly config: ConsentConfig = inject(CONSENT_CONFIG);

    private readonly injector: Injector = inject(Injector);

    private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

    private readonly document: Document = inject(DOCUMENT);

    private readonly destroyRef: DestroyRef = inject(DestroyRef);

    private dialogOpen: boolean = false;

    /**
     * Every tracking the user is asked about.
     */
    readonly trackings: Tracking[] = this.config.trackings;

    /**
     * Whether the user made their choices within the choices duration. Always true on the server, where nobody can
     * be asked.
     * @returns Whether the user made their choices.
     */
    get hasMadeChoices(): boolean {
        if (!this.isBrowser) {
            return true;
        }
        const madeAt: number = new Date(this.findStoredChoices()?.madeAt ?? Number.NaN).getTime();
        return Date.now() - madeAt < this.config.choicesDuration;
    }

    /**
     * Asks the user for their choices, unless they made them already. A browser that asks not to be tracked gets
     * only what is technically necessary instead, and a notice that says so.
     */
    async requestChoices(): Promise<void> {
        if (this.hasMadeChoices) {
            return;
        }
        if (this.config.respectDoNotTrack && this.isDoNotTrackRequested()) {
            await this.allowOnlyRequired();
            (await this.resolveUi()).showDoNotTrackNotice();
            return;
        }
        await this.openDialog();
    }

    /**
     * Starts asking the user for their choices when the askOn of the config says, unless they made them: at the end of
     * every navigation, or once at their first interaction with the page. Only in the browser, so nothing of the dialog
     * is in prerendered html. Called by provideTrackingConsent.
     */
    startAsking(): void {
        if (!this.isBrowser || this.config.askOn == undefined) {
            return;
        }
        if (this.config.askOn === 'navigation') {
            this.injector.get(Router).events
                .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
                .subscribe(() => void this.requestChoices());
            return;
        }
        // nobody who chose already waits for their first interaction, which would only ask nothing
        if (this.hasMadeChoices) {
            return;
        }
        // the visitor sees the page first, and the dialog is not what it loaded with: one that opens with the page
        // counts as its largest paint, rated as the page loading slowly.
        const firstInteraction: AbortController = new AbortController();
        this.destroyRef.onDestroy(() => firstInteraction.abort());
        for (const interaction of INTERACTIONS) {
            this.document.addEventListener(
                interaction,
                () => {
                    firstInteraction.abort();
                    void this.requestChoices();
                },
                { once: true, passive: true, signal: firstInteraction.signal }
            );
        }
    }

    /**
     * Opens the dialog where the user chooses which trackings to allow, also when they made their choices already.
     * Does nothing while it is open already.
     */
    async openDialog(): Promise<void> {
        if (!this.isBrowser || this.dialogOpen) {
            return;
        }
        this.dialogOpen = true;
        try {
            await (await this.resolveUi()).openDialog();
        }
        finally {
            this.dialogOpen = false;
        }
    }

    /**
     * Allows the given trackings and forbids every other one, except the technically necessary ones, and keeps these
     * choices for the choices duration.
     * @param allowed - The trackings the user allowed.
     */
    async saveChoices(allowed: Tracking[]): Promise<void> {
        for (const tracking of this.trackings) {
            const service: TrackingService = this.getTrackingService(tracking);
            if (allowed.includes(tracking)) {
                await service.enable();
            }
            else {
                service.disable();
            }
        }
        const choices: StoredChoices = { madeAt: new Date().toISOString() };
        localStorage.setItem(CHOICES_KEY, JSON.stringify(choices));
    }

    /**
     * Allows every tracking.
     */
    async allowAll(): Promise<void> {
        await this.saveChoices(this.trackings);
    }

    /**
     * Allows only the technically necessary trackings.
     */
    async allowOnlyRequired(): Promise<void> {
        await this.saveChoices([]);
    }

    /**
     * Gets the service of a tracking.
     * @param tracking - The tracking.
     * @returns Its service, the same instance that tracks.
     */
    getTrackingService(tracking: Tracking): TrackingService {
        return this.injector.get(tracking.service);
    }

    private async resolveUi(): Promise<ConsentUi> {
        return this.injector.get(await this.config.ui());
    }

    private isDoNotTrackRequested(): boolean {
        const signals: PrivacySignals = navigator;
        return signals.globalPrivacyControl === true || signals.doNotTrack === '1';
    }

    private findStoredChoices(): StoredChoices | undefined {
        const stored: string | null = localStorage.getItem(CHOICES_KEY);
        if (stored == undefined) {
            return undefined;
        }
        try {
            return JSON.parse(stored) as StoredChoices;
        }
        catch {
            return undefined;
        }
    }
}