import { Component, Service, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConsentGateComponent } from '@service-soft/ui/consent-gate';
import { MapComponent, MapLocation } from '@service-soft/ui/map';
import { afterEach, describe, expect, test } from 'vitest';

import { ConsentTrackingDirective } from './consent-tracking.directive';
import { EmbedTrackingService } from './embed-tracking.service';

@Service()
class VideoConsent extends EmbedTrackingService {
    override readonly storageKey: string = 'videoConsent';
}

@Component({
    selector: 'ngx-consent-tracking-host',
    template: `
        <ui-consent-gate provider="YouTube" alwaysAllow [ngxConsentTracking]="videoConsent"><ng-template><p class="video">The video</p></ng-template></ui-consent-gate>
        <ui-map [location]="location" [ngxConsentTracking]="videoConsent" />
    `,
    imports: [ConsentGateComponent, ConsentTrackingDirective, MapComponent]
})
class ConsentTrackingHostComponent {
    readonly videoConsent: Type<VideoConsent> = VideoConsent;

    readonly location: MapLocation = { address: 'Main Street 1, Cologne' };
}

async function render(): Promise<[ComponentFixture<ConsentTrackingHostComponent>, HTMLElement]> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture: ComponentFixture<ConsentTrackingHostComponent> = TestBed.createComponent(ConsentTrackingHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

describe('ConsentTrackingDirective', () => {
    afterEach(() => {
        localStorage.clear();
    });

    test('loads the content right away where the user allowed the tracking', async () => {
        localStorage.setItem('videoConsent', JSON.stringify({ enabled: true }));
        const [, root] = await render();

        expect(root.querySelector('.video')).not.toBeNull();
        expect(root.querySelector('ui-map iframe')).not.toBeNull();
    });

    test('shows the placeholder without consent, and allows the tracking when the user always allows the provider', async () => {
        const [fixture, root] = await render();
        expect(root.querySelector('.video')).toBeNull();
        expect(root.querySelector('ui-map iframe')).toBeNull();

        [...root.querySelectorAll('button')].find(button => button.textContent.trim() === 'Always allow YouTube')?.click();
        await fixture.whenStable();

        expect(root.querySelector('.video')).not.toBeNull();
        expect(TestBed.inject(VideoConsent).enabled()).toBe(true);
        expect(JSON.parse(localStorage.getItem('videoConsent') ?? '{}')).toEqual({ enabled: true });
    });

    test('follows a choice of the consent dialog right away: allowed, the content loads, forbidden, it is removed', async () => {
        const [fixture, root] = await render();
        const consent: VideoConsent = TestBed.inject(VideoConsent);

        // what the consent dialog does when the user saves their choices
        await consent.enable();
        await fixture.whenStable();
        expect(root.querySelector('.video')).not.toBeNull();
        expect(root.querySelector('ui-map iframe')).not.toBeNull();

        consent.disable();
        await fixture.whenStable();
        expect(root.querySelector('.video')).toBeNull();
        expect(root.querySelector('ui-map iframe')).toBeNull();
        expect(root.textContent).toContain('Content from YouTube');
    });

    test('keeps content the user loaded this once, until the tracking changes', async () => {
        const [fixture, root] = await render();
        [...root.querySelectorAll('button')].find(button => button.textContent.trim() === 'Load YouTube')?.click();
        await fixture.whenStable();

        expect(root.querySelector('.video')).not.toBeNull();
        expect(TestBed.inject(VideoConsent).enabled()).toBe(false);
    });
});