import { Component, LOCALE_ID, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideRatingConfig } from './rating-config.provider';
import { RatingComponent } from './rating.component';
import { RatingUtilities } from './rating.utilities';

@Component({
    selector: 'ui-rating-host',
    template: '<ui-rating [value]="value()" />',
    imports: [RatingComponent]
})
class RatingHostComponent {
    readonly value: WritableSignal<number> = signal(4.4);
}

async function render(): Promise<[ComponentFixture<RatingHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<RatingHostComponent> = TestBed.createComponent(RatingHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the empty stars, and the filled ones on top of them.
function getLayers(root: HTMLElement): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>('[role="img"] > span')];
}

describe('RatingComponent', () => {
    test('is one image named by the value, whose filled stars are cut off after it', async () => {
        const [fixture, root] = await render();
        const image: HTMLElement | null = root.querySelector('[role="img"]');
        expect(image?.getAttribute('aria-label')).toBe('4.4 out of 5 stars');

        const [empty, filled] = getLayers(root);
        expect([empty, filled].map(layer => layer?.getAttribute('aria-hidden'))).toEqual(['true', 'true']);
        expect([empty, filled].map(layer => layer?.querySelectorAll('svg').length)).toEqual([5, 5]);
        // four stars with their gaps of 0.125em, and 0.4 of the fifth
        expect(filled?.style.width).toBe('4.9em');

        fixture.componentInstance.value.set(5);
        await fixture.whenStable();
        expect(image?.getAttribute('aria-label')).toBe('5.0 out of 5 stars');
    });

    test('writes the value in the language of the app, with the label the app provides', async () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: LOCALE_ID, useValue: 'de' },
                provideRatingConfig({ max: 10, label: (value, max) => `${value} von ${max} Sternen` })
            ]
        });
        const [, root] = await render();

        expect(root.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('4,4 von 10 Sternen');
        expect(getLayers(root)[0]?.querySelectorAll('svg').length).toBe(10);
    });
});

describe('RatingUtilities', () => {
    test('calculates the width of the filled stars, limited to between no and all stars', () => {
        expect(RatingUtilities.calculateFillWidth(0, 5)).toBe(0);
        expect(RatingUtilities.calculateFillWidth(1, 5)).toBe(1.125);
        expect(RatingUtilities.calculateFillWidth(2.5, 5)).toBe(2.75);
        expect(RatingUtilities.calculateFillWidth(-1, 5)).toBe(0);
        expect(RatingUtilities.calculateFillWidth(7, 5)).toBe(5.625);
    });
});