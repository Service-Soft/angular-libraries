import { Component, LOCALE_ID, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { providePriceConfig } from './price-config.provider';
import { PriceComponent } from './price.component';

@Component({
    selector: 'ui-price-host',
    template: '<ui-price [amount]="49" [period]="period()" [oldAmount]="oldAmount()" />',
    imports: [PriceComponent]
})
class PriceHostComponent {
    readonly period: WritableSignal<string | undefined> = signal('month');

    readonly oldAmount: WritableSignal<number | undefined> = signal(59);
}

async function render(): Promise<[ComponentFixture<PriceHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<PriceHostComponent> = TestBed.createComponent(PriceHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the texts in the order screen readers read them, without the ones they skip.
function getReadTexts(root: HTMLElement): string[] {
    const price: Element | null = root.querySelector('ui-price');
    const walker: TreeWalker = document.createTreeWalker(price ?? root, NodeFilter.SHOW_TEXT);
    const texts: string[] = [];
    for (let node: Node | null = walker.nextNode(); node != undefined; node = walker.nextNode()) {
        const text: string = node.textContent?.trim() ?? '';
        if (text && node.parentElement?.closest('[aria-hidden="true"]') == undefined) {
            texts.push(text);
        }
    }
    return texts;
}

describe('PriceComponent', () => {
    test('is read as the price per its period and the old price before it, which shows struck through', async () => {
        const [, root] = await render();

        expect(getReadTexts(root)).toEqual(['€49.00', 'per', 'month', 'previously', '€59.00']);
        expect(root.querySelector('[aria-hidden="true"]')?.textContent).toBe('/');
        expect(root.querySelector('s')?.textContent).toBe('€59.00');
    });

    test('is only the amount without a period and an old price', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.period.set(undefined);
        fixture.componentInstance.oldAmount.set(undefined);
        await fixture.whenStable();

        expect(getReadTexts(root)).toEqual(['€49.00']);
    });

    test('takes the currency, the format and the texts from the app, in its language', async () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: LOCALE_ID, useValue: 'de' },
                providePriceConfig({ currency: 'CHF', format: { maximumFractionDigits: 0 }, perLabel: 'pro', oldPriceLabel: 'vorher' })
            ]
        });
        const [, root] = await render();

        // Intl keeps the amount and the currency together with a no-break space
        expect(getReadTexts(root)).toEqual(['49 CHF', 'pro', 'month', 'vorher', '59 CHF']);
    });
});