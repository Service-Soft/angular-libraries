// the DialogService renders the content of a dialog into a div, so the tests find it by its dialog.
import { ApplicationRef, Service } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ConsentService, GdprCategory, provideConsentDialogConfig, provideTrackingConsent, Tracking, TrackingService } from '@service-soft/ngx-tracking/consent';
import { DialogTestingUtilities } from 'testing/dialog';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { ConsentDialogUi } from './consent-dialog-ui.service';

abstract class TestTracking extends TrackingService {
    protected override onNavigationEnd(): void {
        // tracks nothing, only whether it is allowed matters here.
    }
}

@Service()
class AbuseProtectionTracking extends TestTracking {
    override readonly storageKey: string = 'abuseProtection';
    override readonly gdprCategory: GdprCategory = GdprCategory.TECHNICAL_NECESSARY;
}

@Service()
class VisitsTracking extends TestTracking {
    override readonly storageKey: string = 'visits';
    override readonly gdprCategory: GdprCategory = GdprCategory.ENABLED_BY_DEFAULT;
}

@Service()
class ErrorsTracking extends TestTracking {
    override readonly storageKey: string = 'errors';
    override readonly gdprCategory: GdprCategory = GdprCategory.ENABLED_BY_DEFAULT;
}

@Service()
class AdsTracking extends TestTracking {
    override readonly storageKey: string = 'ads';
    override readonly gdprCategory: GdprCategory = GdprCategory.DISABLED_BY_DEFAULT;
}

const TRACKINGS: Tracking[] = [
    { name: 'Abuse protection', description: ['Blocks bots.'], service: AbuseProtectionTracking },
    { name: 'Visits', description: ['Counts visits.'], service: VisitsTracking },
    { name: 'Errors', description: ['Reports errors.'], service: ErrorsTracking },
    { name: 'Ads', description: ['Shows ads.'], service: AdsTracking }
];

/**
 * A checkbox of the dialog, as the test reads it.
 */
type CheckboxState = {
    label: string,
    checked: boolean,
    indeterminate: boolean,
    disabled: boolean
};

function getCheckbox(label: string): HTMLInputElement {
    const checkbox: HTMLInputElement | undefined = [...document.querySelectorAll<HTMLInputElement>('dialog input[type="checkbox"]')]
        .find(input => input.labels?.[0]?.textContent.trim() === label);
    if (!checkbox) {
        throw new Error(`No checkbox ${label}`);
    }
    return checkbox;
}

function findButton(text: string): HTMLButtonElement | undefined {
    return [...document.querySelectorAll<HTMLButtonElement>('dialog button')].find(button => button.textContent?.trim() === text);
}

// the categories with the state of their checkboxes, in the order they show: the one of the category first.
function getCategories(): [string, CheckboxState[]][] {
    return [...document.querySelectorAll('dialog ngx-consent-category')].map(category => [
        category.querySelector('summary')?.textContent?.trim() ?? '',
        [...category.querySelectorAll('input')].map(input => ({
            label: input.labels?.[0]?.textContent.trim() ?? '',
            checked: input.checked,
            indeterminate: input.indeterminate,
            disabled: input.disabled
        }))
    ]);
}

async function render(): Promise<void> {
    await TestBed.inject(ApplicationRef).whenStable();
}

/**
 * An open dialog. An async function can't return a promise without awaiting it, so it is wrapped.
 */
type OpenDialog = {
    closed: Promise<void>
};

// opens the dialog like the consentGuard does.
async function openDialog(): Promise<OpenDialog> {
    const closed: Promise<void> = TestBed.inject(ConsentService).openDialog();
    await expect.poll(() => document.querySelector('dialog')).not.toBeNull();
    await render();
    return { closed };
}

describe('ConsentDialogComponent', () => {
    // opening and closing is all the consent dialog needs of a modal dialog.
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
        TestBed.configureTestingModule({
            providers: [provideRouter([]), provideTrackingConsent({ trackings: TRACKINGS, ui: async () => await Promise.resolve(ConsentDialogUi) })]
        });
    });

    afterEach(() => {
        removeModalDialogs();
        localStorage.clear();
        for (const element of document.querySelectorAll('ui-dialog, ui-snackbar')) {
            element.remove();
        }
    });

    test('shows every category with its trackings, checking only what needs no consent or is checked at first', async () => {
        await openDialog();

        expect(document.querySelector('dialog')?.getAttribute('closedby')).toBe('none');
        expect(getCategories()).toEqual([
            [
                'Technically necessary', [
                    { label: 'Technically necessary', checked: true, indeterminate: false, disabled: true },
                    { label: 'Abuse protection', checked: true, indeterminate: false, disabled: true }
                ]
            ],
            [
                'Analytics', [
                    { label: 'Analytics', checked: true, indeterminate: false, disabled: false },
                    { label: 'Visits', checked: true, indeterminate: false, disabled: false },
                    { label: 'Errors', checked: true, indeterminate: false, disabled: false }
                ]
            ],
            [
                'Marketing', [
                    { label: 'Marketing', checked: false, indeterminate: false, disabled: false },
                    { label: 'Ads', checked: false, indeterminate: false, disabled: false }
                ]
            ]
        ]);
        // the trackings only show once their category is opened
        expect([...document.querySelectorAll<HTMLDetailsElement>('dialog details')].map(details => details.open)).toEqual([false, false, false]);
        // nothing is allowed before the user chose
        expect(TestBed.inject(VisitsTracking).enabled()).toBe(false);
    });

    test('saves what the user checked, and shows those choices when it opens again', async () => {
        const { closed } = await openDialog();
        getCheckbox('Errors').click();
        getCheckbox('Ads').click();
        await render();
        expect(getCheckbox('Analytics').indeterminate).toBe(true);

        findButton('Save choices')?.click();
        await closed;

        expect([VisitsTracking, ErrorsTracking, AdsTracking].map(service => TestBed.inject<TrackingService>(service).enabled())).toEqual([true, false, true]);
        expect(TestBed.inject(ConsentService).hasMadeChoices).toBe(true);
        expect(document.querySelector('dialog')).toBeNull();

        await openDialog();
        expect(getCheckbox('Errors').checked).toBe(false);
        expect(getCheckbox('Ads').checked).toBe(true);
    });

    test('checks or unchecks a whole category at once', async () => {
        await openDialog();
        getCheckbox('Analytics').click();
        await render();
        expect([getCheckbox('Visits').checked, getCheckbox('Errors').checked]).toEqual([false, false]);

        getCheckbox('Analytics').click();
        await render();
        expect([getCheckbox('Visits').checked, getCheckbox('Errors').checked]).toEqual([true, true]);
    });

    test('allows everything or only what is required with a single button', async () => {
        let dialog: OpenDialog = await openDialog();
        findButton('Allow all')?.click();
        await dialog.closed;
        expect(TestBed.inject(AdsTracking).enabled()).toBe(true);

        dialog = await openDialog();
        findButton('Only required')?.click();
        await dialog.closed;
        expect([VisitsTracking, AdsTracking, AbuseProtectionTracking].map(service => TestBed.inject<TrackingService>(service).enabled()))
            .toEqual([false, false, true]);
    });

    test('shows the texts and links of the config, which the app gives it without loading the dialog', async () => {
        // from /consent, which an app imports anyway, unlike the dialog, which loads once it shows
        TestBed.configureTestingModule({
            providers: [provideConsentDialogConfig({ paragraphs: ['Wir nutzen Cookies.'], privacyUrl: 'datenschutz', labels: { title: 'Datenschutz' } })]
        });
        await openDialog();

        expect(document.querySelector('dialog h2')?.textContent.trim()).toBe('Datenschutz');
        expect([...document.querySelectorAll('dialog p')].map(p => p.textContent.trim())[0]).toBe('Wir nutzen Cookies.');
        expect(document.querySelector('dialog a')?.getAttribute('href')).toBe('datenschutz');
        // what it doesn't change keeps its default
        expect(findButton('Allow all')).toBeDefined();
    });

    test('tells the user in a snackbar when their browser asked not to be tracked', async () => {
        TestBed.inject(ConsentDialogUi).showDoNotTrackNotice();
        await expect.poll(() => document.querySelector('ui-snackbar')?.textContent?.trim())
            .toBe('Your browser asked not to be tracked, so we turned off everything that isn\'t required.');
    });
});