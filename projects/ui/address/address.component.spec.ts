import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideAddressConfig } from './address-config.provider';
import { AddressComponent } from './address.component';
import { PostalAddress } from './postal-address.model';

@Component({
    selector: 'ui-address-host',
    template: `
        <ui-address name="Dental practice Example" phone="+49 (0) 2234 12 34-5" fax="+49 2234 12 34-6" email="info@example.com"
            [address]="address" [businessType]="businessType()" />
    `,
    imports: [AddressComponent]
})
class AddressHostComponent {
    readonly address: PostalAddress = { street: 'Main Street 1', postalCode: '50999', city: 'Cologne', country: 'Germany' };

    readonly businessType: WritableSignal<string | undefined> = signal('Dentist');
}

async function render(): Promise<[ComponentFixture<AddressHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<AddressHostComponent> = TestBed.createComponent(AddressHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the microdata properties of the item an element is in, with their values, like a crawler reads them.
function findProperties(root: HTMLElement): [string, string][] {
    return [...root.querySelectorAll('[itemprop]')].map(element => [element.getAttribute('itemprop') ?? '', element.textContent.trim()]);
}

describe('AddressComponent', () => {
    test('shows the address and links the phone number to its digits and the email address to an email', async () => {
        const [, root] = await render();
        const lines: string[] = [...root.querySelectorAll('address p span.block:not(:has(span.block))')].map(line => line.textContent.trim());

        expect(lines).toEqual(['Dental practice Example', 'Main Street 1', '50999 Cologne', 'Germany']);
        const links: HTMLAnchorElement[] = [...root.querySelectorAll('a')];
        expect(links.map(link => [link.getAttribute('href'), link.textContent.trim()])).toEqual([
            ['tel:+49223412345', '+49 (0) 2234 12 34-5'],
            ['mailto:info@example.com', 'info@example.com']
        ]);
        // a fax can't be called. Each contact shows an icon, and screen readers read its label instead
        expect(root.querySelectorAll('li')[1]?.textContent).toContain('+49 2234 12 34-6');
        expect([...root.querySelectorAll('li .sr-only')].map(label => label.textContent.trim())).toEqual(['Phone:', 'Fax:', 'Email:']);
        expect([...root.querySelectorAll('li svg')].map(icon => icon.getAttribute('aria-hidden'))).toEqual(['true', 'true', 'true']);
    });

    test('is a schema.org item of the business type, whose address is a PostalAddress', async () => {
        const [fixture, root] = await render();
        const address: HTMLElement | null = root.querySelector('address');

        expect(address?.hasAttribute('itemscope')).toBe(true);
        expect(address?.getAttribute('itemtype')).toBe('https://schema.org/Dentist');
        expect(root.querySelector('[itemprop="address"]')?.getAttribute('itemtype')).toBe('https://schema.org/PostalAddress');
        expect(findProperties(root).filter(([name]) => name !== 'address')).toEqual([
            ['name', 'Dental practice Example'],
            ['streetAddress', 'Main Street 1'],
            ['postalCode', '50999'],
            ['addressLocality', 'Cologne'],
            ['addressCountry', 'Germany'],
            ['telephone', '+49 (0) 2234 12 34-5'],
            ['faxNumber', '+49 2234 12 34-6'],
            ['email', 'info@example.com']
        ]);

        // without a type, its properties belong to an item of the app around it
        fixture.componentInstance.businessType.set(undefined);
        await fixture.whenStable();
        expect(address?.hasAttribute('itemscope')).toBe(false);
        expect(root.querySelector('[itemprop="telephone"]')).not.toBeNull();
    });

    test('shows labels instead of icons and leaves out the microdata as the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideAddressConfig({ icons: false, microdata: false, phoneLabel: 'Telefon' })] });
        const [, root] = await render();

        expect(root.querySelector('li svg')?.closest('span')?.classList).toContain('hidden');
        expect(root.querySelector('li .sr-only')).toBeNull();
        expect(root.querySelector('li')?.textContent).toContain('Telefon:');
        expect(root.querySelector('[itemscope], [itemprop]')).toBeNull();
    });
});