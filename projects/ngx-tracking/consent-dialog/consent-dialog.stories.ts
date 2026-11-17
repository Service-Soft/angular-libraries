import { afterNextRender, Component, inject, Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ConsentService, GdprCategory, provideTrackingConsent, Tracking, TrackingService } from '@service-soft/ngx-tracking/consent';
import { PrivacySettingsComponent } from '@service-soft/ngx-tracking/privacy-settings';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { provideConsentDialogConfig } from './consent-dialog-config.provider';
import { ConsentDialogUi } from './consent-dialog-ui.service';
import { ConsentDialogComponent } from './consent-dialog.component';

// trackings that track nothing: the story is about the choices.
abstract class StoryTracking extends TrackingService {
    protected override onNavigationEnd(): void {
        // nothing to track in a story.
    }
}

@Service()
class AbuseProtectionTracking extends StoryTracking {
    override readonly storageKey: string = 'storyAbuseProtection';
    override readonly gdprCategory: GdprCategory = GdprCategory.TECHNICAL_NECESSARY;
}

@Service()
class ShopAnalyticsTracking extends StoryTracking {
    override readonly storageKey: string = 'storyShopAnalytics';
    override readonly gdprCategory: GdprCategory = GdprCategory.ENABLED_BY_DEFAULT;
}

@Service()
class ErrorReportsTracking extends StoryTracking {
    override readonly storageKey: string = 'storyErrorReports';
    override readonly gdprCategory: GdprCategory = GdprCategory.ENABLED_BY_DEFAULT;
}

@Service()
class AdsTracking extends StoryTracking {
    override readonly storageKey: string = 'storyAds';
    override readonly gdprCategory: GdprCategory = GdprCategory.DISABLED_BY_DEFAULT;
}

const TRACKINGS: Tracking[] = [
    { name: 'Abuse protection', description: ['Recognizes bots that misuse the shop.'], service: AbuseProtectionTracking },
    {
        name: 'Shop analytics',
        description: ['Counts which pages are visited, on our own servers.', 'Kept for 14 months.'],
        service: ShopAnalyticsTracking
    },
    { name: 'Error reports', description: ['Sends errors of the shop to us, so we can fix them.'], service: ErrorReportsTracking },
    { name: 'Ads', description: ['Measures which ads brought you here. Shared with the ad network.'], service: AdsTracking }
];

// opens the dialog like the consentGuard does on the first visit, and offers to open it again with the button of the
// privacy settings.
@Component({
    selector: 'ngx-consent-story',
    template: '<ngx-privacy-settings />',
    imports: [PrivacySettingsComponent]
})
class ConsentStoryComponent {
    private readonly consentService: ConsentService = inject(ConsentService);

    constructor() {
        afterNextRender(() => void this.consentService.openDialog());
    }
}

const meta: Meta<ConsentDialogComponent> = {
    title: 'Tracking/Consent dialog',
    component: ConsentDialogComponent,
    render: () => ({ template: '<ngx-consent-story />', moduleMetadata: { imports: [ConsentStoryComponent] } })
};
export default meta;

type Story = StoryObj<ConsentDialogComponent>;

// the ui loads like with a dynamic import in an app.
const consent: ReturnType<typeof provideTrackingConsent> = provideTrackingConsent({
    trackings: TRACKINGS,
    ui: async () => await Promise.resolve(ConsentDialogUi)
});

export const Default: Story = {
    decorators: [applicationConfig({ providers: [provideRouter([]), consent] })]
};

export const OnlyCategories: Story = {
    decorators: [applicationConfig({ providers: [provideRouter([]), consent, provideConsentDialogConfig({ showOnlyCategories: true })] })]
};