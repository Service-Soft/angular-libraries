import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { describe, expect, test } from 'vitest';

import { provideLinkConfig } from './link-config.provider';
import { LinkComponent } from './link.component';
import { LinkUtilities } from './link.utilities';

@Component({
    selector: 'ui-link-host',
    template: `<a ui-link href="https://example.com/terms">Terms</a><a ui-link appearance="nav" routerLink="/orders" aria-current="page">Orders</a>
        <button ui-link type="button" appearance="nav" block>Log out</button>`,
    imports: [LinkComponent, RouterLink]
})
class LinkHostComponent {}

@Component({
    selector: 'ui-external-link-host',
    template: `
        <a ui-link href="https://example.com/terms">Terms</a>
        <a ui-link href="/help" target="_blank">Help</a>
        <a ui-link routerLink="/orders">Orders</a>
        <a ui-link [href]="href()">Shop</a>
        <button ui-link type="button">Log out</button>
    `,
    imports: [LinkComponent, RouterLink]
})
class ExternalLinkHostComponent {
    readonly href: WritableSignal<string> = signal('/shop');
}

async function render(): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture: ComponentFixture<LinkHostComponent> = TestBed.createComponent(LinkHostComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

describe('LinkComponent', () => {
    test('styles a link with an href or a routerLink, and a button, which all stay native elements', async () => {
        const root: HTMLElement = await render();
        const [terms, orders] = [...root.querySelectorAll('a')];
        const logOut: HTMLButtonElement | null = root.querySelector('button');

        expect(terms?.getAttribute('href')).toBe('https://example.com/terms');
        expect(orders?.getAttribute('href')).toBe('/orders');
        // inline in the text, underlined
        expect(terms?.classList).toContain('underline');
        expect(terms?.classList).toContain('inline');
        // a navigation item, which marks the current page
        expect(orders?.classList).toContain('inline-flex');
        expect(orders?.classList).toContain('aria-[current=page]:underline');
        // a button drawn like a navigation item, over the full width
        expect(logOut?.classList).toContain('min-h-10');
        expect(logOut?.classList).toContain('w-full');
        expect(logOut?.classList).not.toContain('inline-flex');
    });

    test('draws a menu item over the full width with its focus ring inside, and the current page inside text as text', () => {
        const menu: string[] = LinkUtilities.getClasses('menu', false).split(/\s+/);
        expect(menu).toContain('w-full');
        expect(menu).toContain('focus-visible:-outline-offset-2');
        expect(menu).not.toContain('focus-visible:outline-offset-2');

        expect(LinkUtilities.getClasses('inline', false).split(/\s+/)).toContain('aria-[current=page]:no-underline');
    });

    test('underlines a subtle link only on hover, and a plain one never', () => {
        const subtle: string[] = LinkUtilities.getClasses('subtle', false).split(/\s+/);
        expect(subtle).toContain('no-underline');
        expect(subtle).toContain('hover:underline');

        expect(LinkUtilities.getClasses('plain', false).split(/\s+/)).not.toContain('hover:underline');
    });

    test('takes the appearance from the config', async () => {
        TestBed.configureTestingModule({ providers: [provideLinkConfig({ appearance: 'plain' })] });
        const root: HTMLElement = await render();

        expect(root.querySelector('a')?.classList).toContain('min-h-6');
        expect(root.querySelector('a')?.classList).not.toContain('underline');
    });

    test('marks a link to another site or a new tab with an icon, and a new tab for screen readers', async () => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        const fixture: ComponentFixture<ExternalLinkHostComponent> = TestBed.createComponent(ExternalLinkHostComponent);
        await fixture.whenStable();
        const root: HTMLElement = fixture.nativeElement as HTMLElement;
        const [terms, help, orders, bound] = [...root.querySelectorAll('a')];

        // another site: the icon, decorative, and nothing else to read
        expect(terms?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        expect(terms?.querySelector('.sr-only')).toBeNull();
        // a page of this site in a new tab: the icon, and screen readers hear that it opens a new tab
        expect(help?.querySelector('svg')).not.toBeNull();
        expect(help?.textContent?.replaceAll(/\s+/g, ' ').trim()).toBe('Help (opens in a new tab)');
        // routerLink is a page of this site
        expect(orders?.querySelector('svg')).toBeNull();
        expect(root.querySelector('button svg')).toBeNull();

        // a bound href is followed when it changes
        expect(bound?.querySelector('svg')).toBeNull();
        fixture.componentInstance.href.set('https://example.com/shop');
        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve));
        await fixture.whenStable();
        expect(bound?.querySelector('svg')).not.toBeNull();
    });

    test('says that a link opens in a new tab in the words of the config', async () => {
        TestBed.configureTestingModule({ providers: [provideRouter([]), provideLinkConfig({ newTabLabel: 'öffnet in einem neuen Tab' })] });
        const fixture: ComponentFixture<ExternalLinkHostComponent> = TestBed.createComponent(ExternalLinkHostComponent);
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).querySelector('.sr-only')?.textContent.trim()).toBe('(öffnet in einem neuen Tab)');
    });
});

describe('LinkUtilities.isExternal', () => {
    test('is true for a web address of another origin only', () => {
        const origin: string = 'https://shop.example.com';

        expect(LinkUtilities.isExternal('https://example.com/terms', origin)).toBe(true);
        expect(LinkUtilities.isExternal('http://shop.example.com/orders', origin)).toBe(true);
        expect(LinkUtilities.isExternal('//other.example.com', origin)).toBe(true);
        expect(LinkUtilities.isExternal('https://shop.example.com/orders', origin)).toBe(false);
        expect(LinkUtilities.isExternal('/orders', origin)).toBe(false);
        expect(LinkUtilities.isExternal('#terms', origin)).toBe(false);
        expect(LinkUtilities.isExternal('mailto:help@example.com', origin)).toBe(false);
        expect(LinkUtilities.isExternal('tel:+49123', origin)).toBe(false);
        expect(LinkUtilities.isExternal(null, origin)).toBe(false);
    });
});

describe('LinkUtilities contact hrefs', () => {
    test('call the digits of a number, without the trunk prefix of an international one', () => {
        expect(LinkUtilities.resolvePhoneHref('+49 (0) 2234 12 34-5')).toBe('tel:+49223412345');
        expect(LinkUtilities.resolvePhoneHref('0049 2234 / 12345')).toBe('tel:+49223412345');
        expect(LinkUtilities.resolvePhoneHref('02234 12345')).toBe('tel:0223412345');
    });

    test('write an email and message a number on WhatsApp by its country code', () => {
        expect(LinkUtilities.resolveEmailHref(' info@example.com ')).toBe('mailto:info@example.com');
        expect(LinkUtilities.resolveWhatsAppHref('+49 171 1234567')).toBe('https://wa.me/491711234567');
        expect(LinkUtilities.resolveWhatsAppHref('0049 (0) 171 1234567')).toBe('https://wa.me/491711234567');
    });
});