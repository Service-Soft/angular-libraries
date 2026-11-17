import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from '@service-soft/ui/button';
import { provideCardConfig } from '@service-soft/ui/card';
import { CheckListComponent, CheckListItemComponent } from '@service-soft/ui/check-list';
import { PriceComponent } from '@service-soft/ui/price';
import { describe, expect, test } from 'vitest';

import { PricingCardActionsComponent } from './pricing-card-actions.component';
import { providePricingCardConfig } from './pricing-card-config.provider';
import { PricingCardComponent } from './pricing-card.component';

@Component({
    selector: 'ui-pricing-card-host',
    template: `
        <ui-pricing-card name="Family" description="For two adults and their children." [highlighted]="highlighted()"><ui-pricing-card-actions>
            <a ui-button href="/join">Join</a></ui-pricing-card-actions><ui-check-list><ui-check-list-item>Every course</ui-check-list-item></ui-check-list>
            <ui-price [amount]="25" period="month" /></ui-pricing-card>
    `,
    imports: [ButtonComponent, CheckListComponent, CheckListItemComponent, PriceComponent, PricingCardActionsComponent, PricingCardComponent]
})
class PricingCardHostComponent {
    readonly highlighted: WritableSignal<boolean> = signal(false);
}

async function render(): Promise<[ComponentFixture<PricingCardHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<PricingCardHostComponent> = TestBed.createComponent(PricingCardHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the parts of the card in the order they show.
function getParts(root: HTMLElement): string[] {
    const content: Element | null | undefined = root.querySelector('ui-card')?.firstElementChild;
    return [...content?.children ?? []].map(part => part.tagName.toLowerCase());
}

describe('PricingCardComponent', () => {
    test('is a card with the name of the plan as a heading, its price, its features and its actions at the bottom', async () => {
        const [, root] = await render();

        expect(root.querySelector('h3')?.textContent).toBe('Family');
        expect(root.querySelector('h3 + p, ui-heading + p')?.textContent).toBe('For two adults and their children.');
        // the actions come last wherever they are written, and the features take the space that is left
        expect(getParts(root)).toEqual(['div', 'ui-price', 'div', 'ui-pricing-card-actions']);
        expect(root.querySelector('ui-card > div > div.grow ui-check-list')).not.toBeNull();
        expect(root.querySelector('ui-card')?.classList).toContain('h-full');
    });

    test('a highlighted plan gets the highlight color and a badge before its name', async () => {
        const [fixture, root] = await render();
        expect(root.querySelector('ui-card')?.classList).toContain('border-transparent');
        expect(root.querySelector('ui-card')?.classList).not.toContain('border-t-primary');

        fixture.componentInstance.highlighted.set(true);
        await fixture.whenStable();
        const heading: Element | null = root.querySelector('ui-heading');

        expect(root.querySelector('ui-card')?.classList).toContain('border-t-primary');
        expect(heading?.previousElementSibling?.textContent).toBe('Recommended');
    });

    test('takes the badge, the heading level and the highlight color from the app, in the variant of the cards', async () => {
        TestBed.configureTestingModule({
            providers: [provideCardConfig({ variant: 'filled' }), providePricingCardConfig({ badge: 'Empfohlen', headingLevel: 2, highlightColor: 'secondary' })]
        });
        const [fixture, root] = await render();
        fixture.componentInstance.highlighted.set(true);
        await fixture.whenStable();

        expect(root.querySelector('h2')?.textContent).toBe('Family');
        expect(root.querySelector('ui-card')?.classList).toContain('surface-secondary');
        expect(root.querySelector('ui-heading')?.previousElementSibling?.textContent).toBe('Empfohlen');
    });
});