import { Component, inject, input, InputSignal } from '@angular/core';
import { faCookieBite } from '@fortawesome/free-solid-svg-icons';
import { ConsentService } from '@service-soft/ngx-tracking/consent';
import { ButtonColor, ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { PrivacySettingsConfig } from './privacy-settings-config.model';
import { PRIVACY_SETTINGS_CONFIG } from './privacy-settings-config.provider';

/**
 * A button in the bottom start corner of the screen that opens the privacy settings again, so the user can change their
 * choices on every page, as easily as they made them. Put it once in the layout of the app, next to
 * provideTrackingConsent. It is round, by the token --radius-floating-button of ui. Its color and text come from
 * providePrivacySettingsConfig.
 */
@Component({
    selector: 'ngx-privacy-settings',
    templateUrl: './privacy-settings.component.html',
    imports: [ButtonComponent, IconComponent],
    host: {
        // below the snackbar, which covers it while a message shows. The scroll padding of the page keeps the button off
        // an element that is scrolled into view, like by the focus: the variant styles the root while this is on the page.
        class: 'fixed start-4 bottom-4 z-40 [:root:has(&)]:scroll-pb-20',
        // the ui-button inside is rounded by --radius-button, which takes the radius of floating buttons in here
        style: '--radius-button: var(--radius-floating-button)'
    }
})
export class PrivacySettingsComponent {
    private readonly consentService: ConsentService = inject(ConsentService);

    private readonly config: PrivacySettingsConfig = inject(PRIVACY_SETTINGS_CONFIG);

    /**
     * The color token the button is drawn with, filled. The default comes from providePrivacySettingsConfig.
     */
    readonly color: InputSignal<ButtonColor> = input(this.config.color);

    /**
     * The texts of the button.
     */
    protected readonly labels: PrivacySettingsConfig = this.config;

    /**
     * The icon the button shows, which consent to tracking is known by.
     */
    protected readonly icon: IconDefinition = faCookieBite;

    /**
     * Opens the privacy settings.
     */
    protected async open(): Promise<void> {
        await this.consentService.openDialog();
    }
}