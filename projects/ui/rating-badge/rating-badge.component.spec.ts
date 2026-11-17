import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideRatingBadgeConfig } from './rating-badge-config.provider';
import { RatingBadgeComponent } from './rating-badge.component';

@Component({
    selector: 'ui-rating-badge-host',
    template: `
        <a ui-rating-badge href="https://example.com/reviews" target="_blank" [value]="4.4"></a>
        <a ui-rating-badge href="/reviews" [value]="3"></a>
    `,
    imports: [RatingBadgeComponent]
})
class RatingBadgeHostComponent {}

async function render(): Promise<HTMLElement[]> {
    const fixture: ComponentFixture<RatingBadgeHostComponent> = TestBed.createComponent(RatingBadgeHostComponent);
    await fixture.whenStable();
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll('a')];
}

// what screen readers read for the link: the alt of the logo, the label of the stars and the visible text they don't
// skip.
function resolveAccessibleText(link: HTMLElement): string {
    return [...link.querySelectorAll<HTMLElement>('img, [role="img"], span:not([aria-hidden]):not([role])')]
        .filter(element => element.closest('[aria-hidden="true"]') == undefined)
        .map(element => element.getAttribute('alt') ?? element.getAttribute('aria-label') ?? element.textContent.trim())
        .join(' ');
}

describe('RatingBadgeComponent', () => {
    test('stays the link it was given, which shows the logo of Google, the stars and the value', async () => {
        const [badge, sameTab] = await render();

        expect(badge?.getAttribute('href')).toBe('https://example.com/reviews');
        expect(badge?.querySelector('img')?.getAttribute('src')).toMatch(/^data:image\/svg\+xml,/);
        expect(badge?.querySelector(':scope > span[aria-hidden="true"]')?.textContent.trim()).toBe('4.4');
        expect(resolveAccessibleText(badge ?? document.body)).toBe('Google 4.4 out of 5 stars (opens in a new tab)');
        // only a link with target="_blank" says it opens in a new tab
        expect(resolveAccessibleText(sameTab ?? document.body)).toBe('Google 3.0 out of 5 stars');
    });

    test('shows the logo the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideRatingBadgeConfig({ logo: { src: '/logos/reviews.svg', alt: 'Reviews' } })] });
        const [badge] = await render();

        expect(badge?.querySelector('img')?.getAttribute('src')).toBe('/logos/reviews.svg');
        expect(badge?.querySelector('img')?.getAttribute('alt')).toBe('Reviews');
    });
});