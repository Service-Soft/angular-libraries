import { Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { GdprCategory, provideTrackingConsent, Tracking, TrackingService } from '@service-soft/ngx-tracking/consent';
import { ConsentDialogUi } from '@service-soft/ngx-tracking/consent-dialog';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { PrivacySettingsComponent } from './privacy-settings.component';

// a tracking that tracks nothing: the story is about opening the choices.
@Service()
class ShopAnalyticsTracking extends TrackingService {
    override readonly storageKey: string = 'storyPrivacySettingsAnalytics';
    override readonly gdprCategory: GdprCategory = GdprCategory.ENABLED_BY_DEFAULT;

    protected override onNavigationEnd(): void {
        // nothing to track in a story.
    }
}

const TRACKINGS: Tracking[] = [
    {
        name: 'Shop analytics',
        description: ['Counts which pages are visited, on our own servers.'],
        service: ShopAnalyticsTracking
    }
];

const meta: Meta<PrivacySettingsComponent> = {
    title: 'Tracking/Privacy settings',
    component: PrivacySettingsComponent,
    decorators: [
        applicationConfig({
            providers: [
                provideRouter([]),
                provideTrackingConsent({ trackings: TRACKINGS, ui: async () => await Promise.resolve(ConsentDialogUi) })
            ]
        })
    ]
};
export default meta;

type Story = StoryObj<PrivacySettingsComponent>;

// in the bottom start corner, where a click opens the consent dialog.
export const Default: Story = {};