import { Component, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { providePriceConfig } from '@service-soft/ui/price';
import { describe, expect, test } from 'vitest';

import { provideOrderSummaryConfig } from './order-summary-config.provider';
import { OrderSummaryDiscount } from './order-summary-discount.model';
import { OrderSummaryItem } from './order-summary-item.model';
import { OrderSummaryComponent } from './order-summary.component';

@Component({
    selector: 'ngx-compact-host',
    template: '<ngx-order-summary [items]="items" [discounts]="discounts" />',
    imports: [OrderSummaryComponent]
})
class CompactHostComponent {
    readonly items: OrderSummaryItem[] = [
        { label: 'Double room', quantity: 2, unitPrice: 8900, taxRate: 7 },
        { label: 'Breakfast', quantity: 2, unitPrice: 1500, taxRate: 19 }
    ];
    readonly discounts: OrderSummaryDiscount[] = [{ label: 'Voucher', type: 'amount', value: 1000 }];
}

@Component({
    selector: 'ngx-detailed-host',
    template: '<ngx-order-summary variant="detailed" taxMode="net" [taxRate]="19" [items]="items" [discounts]="discounts" />',
    imports: [OrderSummaryComponent]
})
class DetailedHostComponent {
    readonly items: OrderSummaryItem[] = [{ label: 'Consulting', description: 'In hours', quantity: 1.5, unitPrice: 6667 }];
    readonly discounts: OrderSummaryDiscount[] = [{ label: 'Members', type: 'percentage', value: 10 }];
}

async function render<T>(component: new () => T): Promise<HTMLElement> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

// Intl puts non-breaking spaces into some formats, like the one before € in German
function normalize(text: string | null | undefined): string {
    return text?.replaceAll(/\s+/g, ' ').trim() ?? '';
}

function getTexts(root: HTMLElement, selector: string): string[] {
    return Array.from(root.querySelectorAll(selector), element => normalize(element.textContent));
}

// what screen readers read for each row below the items: its heading and its amount.
function getRows(root: HTMLElement): string[][] {
    return Array.from(root.querySelectorAll('tfoot tr'), row => [
        normalize(row.querySelector('th[scope="row"]')?.textContent),
        normalize(row.querySelector('td')?.textContent)
    ]);
}

describe('OrderSummaryComponent', () => {
    test('sums up a compact order of gross prices with what they include of each tax', async () => {
        const root: HTMLElement = await render(CompactHostComponent);

        expect(root.querySelector('caption')?.textContent.trim()).toBe('Order summary');
        // the headings of the columns are only for screen readers in the compact variant
        expect(root.querySelector('thead')?.classList.contains('sr-only')).toBe(true);
        expect(getTexts(root, 'thead th')).toEqual(['Item', 'Amount']);
        expect(getTexts(root, 'tbody td')).toEqual(['2 × Double room', '€178.00', '2 × Breakfast', '€30.00']);
        // the voucher takes 8.56 € off the room and 1.44 € off the breakfast, which then include 11.08 € and 4.56 €
        expect(getRows(root)).toEqual([
            ['Subtotal', '€208.00'],
            ['Voucher', '-€10.00'],
            ['Total', '€198.00'],
            ['Includes VAT 7%', '€11.08'],
            ['Includes VAT 19%', '€4.56']
        ]);
    });

    // the currency of the prices of ui is the one of the summary as well
    test('shows the quantity, unit price and net total of a detailed order of net prices, in the language and currency of the app', async () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: LOCALE_ID, useValue: 'de' },
                providePriceConfig({ currency: 'CHF' }),
                provideOrderSummaryConfig({ labels: { total: 'Gesamt' } })
            ]
        });
        const root: HTMLElement = await render(DetailedHostComponent);

        expect(getTexts(root, 'thead th')).toEqual(['Item', 'Quantity', 'Unit price', 'Amount']);
        expect(getTexts(root, 'tbody td')).toEqual(['Consulting In hours', '1,5', '66,67 CHF', '100,01 CHF']);
        expect(getRows(root)).toEqual([
            ['Subtotal', '100,01 CHF'],
            ['Members', '-10,00 CHF'],
            ['Net total', '90,01 CHF'],
            ['VAT 19 %', '17,10 CHF'],
            ['Gesamt', '107,11 CHF']
        ]);
        // the headings of the rows span the columns of the items, so the amounts stay in their column
        expect(root.querySelector('tfoot th')?.getAttribute('colspan')).toBe('3');
    });
});