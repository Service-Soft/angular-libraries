import { Component, PLATFORM_ID, Provider, Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, provideRouter, Router } from '@angular/router';
import { afterEach, describe, expect, test } from 'vitest';

import { ConsentAskOn } from './consent-ask-on.type';
import { ConsentConfigChanges } from './consent-config-changes.model';
import { ConsentUi } from './consent-ui.service';
import { consentGuard } from './consent.guard';
import { ConsentService } from './consent.service';
import { GdprCategory } from './gdpr-category.enum';
import { provideTrackingConsent } from './tracking-consent.provider';
import { Tracking } from './tracking.model';
import { TrackingService } from './tracking.service';

// records the pages it tracked.
abstract class RecordingTracking extends TrackingService {
    readonly tracked: string[] = [];

    protected override onNavigationEnd(event: NavigationEnd): void {
        this.tracked.push(event.urlAfterRedirects);
    }
}

@Service()
class AnalyticsTracking extends RecordingTracking {
    override readonly storageKey: string = 'analytics';
    override readonly gdprCategory: GdprCategory = GdprCategory.ENABLED_BY_DEFAULT;
}

@Service()
class MarketingTracking extends RecordingTracking {
    override readonly storageKey: string = 'marketing';
    override readonly gdprCategory: GdprCategory = GdprCategory.DISABLED_BY_DEFAULT;
}

@Service()
class AbuseProtectionTracking extends RecordingTracking {
    override readonly storageKey: string = 'abuseProtection';
    override readonly gdprCategory: GdprCategory = GdprCategory.TECHNICAL_NECESSARY;
}

// what the user would see, which only counts here.
@Service()
class TestConsentUi extends ConsentUi {
    openedDialogs: number = 0;
    notices: number = 0;

    override async openDialog(): Promise<void> {
        this.openedDialogs++;
        await Promise.resolve();
    }

    override showDoNotTrackNotice(): void {
        this.notices++;
    }
}

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

const TRACKINGS: Tracking[] = [
    { name: 'Analytics', description: ['Counts visits.'], service: AnalyticsTracking },
    { name: 'Marketing', description: ['Shows ads.'], service: MarketingTracking },
    { name: 'Abuse protection', description: ['Blocks bots.'], service: AbuseProtectionTracking }
];

function setUp(config: Partial<ConsentConfigChanges> = {}, ...providers: Provider[]): ConsentService {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([{ path: '**', component: PageComponent, canActivate: [consentGuard] }]),
            provideTrackingConsent({ trackings: TRACKINGS, ui: async () => await Promise.resolve(TestConsentUi), ...config }),
            ...providers
        ]
    });
    return TestBed.inject(ConsentService);
}

function setPrivacySignal(globalPrivacyControl: boolean | undefined): void {
    Object.defineProperty(navigator, 'globalPrivacyControl', { value: globalPrivacyControl, configurable: true });
}

// an app that asks by askOn, with no consentGuard on its routes.
async function startWith(askOn: ConsentAskOn | undefined, ...providers: Provider[]): Promise<TestConsentUi> {
    TestBed.configureTestingModule({
        providers: [
            provideRouter([{ path: '**', component: PageComponent }]),
            provideTrackingConsent({ trackings: TRACKINGS, ui: async () => await Promise.resolve(TestConsentUi), askOn }),
            ...providers
        ]
    });
    await TestBed.inject(Router).navigateByUrl('/');
    // what an open dialog would need to arrive
    await new Promise(resolve => setTimeout(resolve));
    return TestBed.inject(TestConsentUi);
}

// what the user does on the page, in the order a visitor often does it.
async function interact(): Promise<void> {
    for (const type of ['mousemove', 'scroll', 'pointerdown', 'keydown']) {
        document.dispatchEvent(new Event(type));
    }
    await new Promise(resolve => setTimeout(resolve));
}

describe('ConsentService', () => {
    afterEach(() => {
        localStorage.clear();
        setPrivacySignal(undefined);
    });

    test('asks at the first interaction with the page, once, and not before', async () => {
        const ui: TestConsentUi = await startWith('interaction');
        await TestBed.inject(Router).navigateByUrl('/other');
        expect(ui.openedDialogs).toBe(0);

        await interact();
        expect(ui.openedDialogs).toBe(1);
        await interact();
        expect(ui.openedDialogs).toBe(1);
    });

    test('asks at no interaction once the user chose, and nowhere on the server', async () => {
        localStorage.setItem('trackingConsentChoices', JSON.stringify({ madeAt: new Date().toISOString() }));
        const chosen: TestConsentUi = await startWith('interaction');
        await interact();
        expect(chosen.openedDialogs).toBe(0);

        TestBed.resetTestingModule();
        localStorage.clear();
        const onServer: TestConsentUi = await startWith('interaction', { provide: PLATFORM_ID, useValue: 'server' });
        await interact();
        expect(onServer.openedDialogs).toBe(0);
    });

    test('asks at the end of a navigation with askOn navigation, and only where the consentGuard is without askOn', async () => {
        const ui: TestConsentUi = await startWith('navigation');
        await expect.poll(() => ui.openedDialogs).toBe(1);

        TestBed.resetTestingModule();
        const unasked: TestConsentUi = await startWith(undefined);
        await interact();
        expect(unasked.openedDialogs).toBe(0);
    });

    test('asks on the first navigation, and not again once the user chose, until the choices expire', async () => {
        const consentService: ConsentService = setUp({ choicesDuration: 1000 });
        const ui: TestConsentUi = TestBed.inject(TestConsentUi);

        await TestBed.inject(Router).navigateByUrl('/');
        await expect.poll(() => ui.openedDialogs).toBe(1);
        expect(consentService.hasMadeChoices).toBe(false);

        await consentService.allowAll();
        await consentService.requestChoices();
        expect(ui.openedDialogs).toBe(1);

        localStorage.setItem('trackingConsentChoices', JSON.stringify({ madeAt: new Date(Date.now() - 1001).toISOString() }));
        expect(consentService.hasMadeChoices).toBe(false);
        await consentService.requestChoices();
        expect(ui.openedDialogs).toBe(2);
    });

    test('allows what the user chose and forbids the rest, except what is technically necessary', async () => {
        const consentService: ConsentService = setUp();
        await consentService.saveChoices([TRACKINGS[1]]);

        expect(TestBed.inject(AnalyticsTracking).enabled()).toBe(false);
        expect(TestBed.inject(MarketingTracking).enabled()).toBe(true);
        expect(TestBed.inject(AbuseProtectionTracking).enabled()).toBe(true);

        await consentService.allowOnlyRequired();
        expect(TestBed.inject(MarketingTracking).enabled()).toBe(false);
        expect(TestBed.inject(AbuseProtectionTracking).enabled()).toBe(true);
    });

    test('tracks navigations only while the user allowed it', async () => {
        const consentService: ConsentService = setUp();
        const router: Router = TestBed.inject(Router);

        await router.navigateByUrl('/before');
        await consentService.saveChoices([TRACKINGS[0]]);
        await router.navigateByUrl('/after');

        expect(TestBed.inject(AnalyticsTracking).tracked).toEqual(['/after']);
        expect(TestBed.inject(MarketingTracking).tracked).toEqual([]);
        expect(TestBed.inject(AbuseProtectionTracking).tracked).toEqual(['/before', '/after']);
    });

    test('allows only what is required without asking when the browser asks not to be tracked, and says so', async () => {
        setPrivacySignal(true);
        const consentService: ConsentService = setUp();
        const ui: TestConsentUi = TestBed.inject(TestConsentUi);
        localStorage.setItem('marketing', JSON.stringify({ enabled: true }));

        await consentService.requestChoices();

        expect(ui.openedDialogs).toBe(0);
        expect(ui.notices).toBe(1);
        expect(TestBed.inject(MarketingTracking).enabled()).toBe(false);
        expect(consentService.hasMadeChoices).toBe(true);
    });

    test('asks anyway when the browser asks not to be tracked, if that isn\'t respected', async () => {
        setPrivacySignal(true);
        const consentService: ConsentService = setUp({ respectDoNotTrack: false });
        await consentService.requestChoices();
        expect(TestBed.inject(TestConsentUi).openedDialogs).toBe(1);
    });

    test('neither asks nor tracks on the server', async () => {
        const consentService: ConsentService = setUp({}, { provide: PLATFORM_ID, useValue: 'server' });
        localStorage.setItem('analytics', JSON.stringify({ enabled: true }));

        await consentService.requestChoices();
        await TestBed.inject(Router).navigateByUrl('/');

        expect(consentService.hasMadeChoices).toBe(true);
        expect(TestBed.inject(TestConsentUi).openedDialogs).toBe(0);
        expect(TestBed.inject(AnalyticsTracking).enabled()).toBe(false);
        expect(TestBed.inject(AnalyticsTracking).tracked).toEqual([]);
    });

    test('says how to set it up when the config is missing', () => {
        expect(() => TestBed.inject(ConsentService)).toThrow('Add provideTrackingConsent({ trackings, ui }) to the providers of your app.');
    });
});