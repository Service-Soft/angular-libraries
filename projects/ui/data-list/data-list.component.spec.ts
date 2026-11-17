import { Component, LOCALE_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideDataListConfig } from './data-list-config.provider';
import { DataListComponent } from './data-list.component';

@Component({
    selector: 'ui-data-list-host',
    template: `
        <ng-template #links><a href="https://example.com">Website</a></ng-template>
        <ui-data-list
            [items]="[
                { label: 'Customer number', value: 'MM-42' },
                { label: 'Birthday', value: birthday },
                { label: 'Birthday in full', value: birthday, dateFormat: { dateStyle: 'full' } },
                { label: 'Orders', value: 1234.5 },
                { label: 'Revenue', value: 98765.4, numberFormat: { style: 'currency', currency: 'EUR' } },
                { label: 'Notes', value: undefined },
                { label: 'Links', value: links }
            ]"
        />
    `,
    imports: [DataListComponent]
})
class DataListHostComponent {
    readonly birthday: Date = new Date(1990, 4, 17);
}

/**
 * A label and the text of its value, as screen readers read them.
 */
type Entry = [string, string];

async function render(): Promise<HTMLElement> {
    const fixture: ComponentFixture<DataListHostComponent> = TestBed.createComponent(DataListHostComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

// Intl puts non-breaking spaces into some formats, like the one before € in German
function findEntries(root: HTMLElement): Entry[] {
    const normalize: (text: string | null | undefined) => string = text => text?.replace(/\s+/g, ' ').trim() ?? '';
    return Array.from(root.querySelectorAll('dt'), label => {
        const value: Element | null = label.nextElementSibling;
        return [normalize(label.textContent), value?.tagName === 'DD' ? normalize(value.textContent) : '(no dd)'];
    });
}

describe('DataListComponent', () => {
    test('shows each label with its value on a description list, numbers and dates in the language of the app', async () => {
        const root: HTMLElement = await render();

        expect(root.querySelectorAll('dl > :not(dt, dd)')).toHaveLength(0);
        expect(findEntries(root)).toEqual([
            ['Customer number', 'MM-42'],
            ['Birthday', 'May 17, 1990'],
            ['Birthday in full', 'Thursday, May 17, 1990'],
            ['Orders', '1,234.5'],
            ['Revenue', '€98,765.40'],
            ['Notes', ''],
            ['Links', 'Website']
        ]);
        expect(root.querySelector('dd a')?.getAttribute('href')).toBe('https://example.com');
    });

    test('writes numbers and dates in the language and the formats the app provides', async () => {
        TestBed.configureTestingModule({
            providers: [
                { provide: LOCALE_ID, useValue: 'de' },
                provideDataListConfig({ dateFormat: { dateStyle: 'short' }, numberFormat: { maximumFractionDigits: 0 } })
            ]
        });
        const root: HTMLElement = await render();

        expect(findEntries(root).slice(1, 5)).toEqual([
            ['Birthday', '17.05.90'],
            ['Birthday in full', 'Donnerstag, 17. Mai 1990'],
            ['Orders', '1.235'],
            ['Revenue', '98.765,40 €']
        ]);
    });
});
