import { Component, input, InputSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavButtonComponent } from '@service-soft/ngx-navigation/nav-button';
import { NavImageComponent } from '@service-soft/ngx-navigation/nav-image';
import { NavLinkComponent } from '@service-soft/ngx-navigation/nav-link';
import { NavMenuComponent } from '@service-soft/ngx-navigation/nav-menu';
import { NavTextComponent } from '@service-soft/ngx-navigation/nav-text';
import { NavTitleComponent } from '@service-soft/ngx-navigation/nav-title';
import { NavElement, NavMenuElement } from '@service-soft/ngx-navigation/navigation';
import { describe, expect, test } from 'vitest';

import { NavElementComponents } from './nav-element-components.model';
import { NavElementLayout } from './nav-element-layout.type';
import { NavElementComponent } from './nav-element.component';

@Component({ selector: 'ngx-language-switch', template: '<span>{{ language() }}</span>' })
class LanguageSwitchComponent {
    readonly language: InputSignal<string> = input.required<string>();
}

const COMPONENTS: NavElementComponents = {
    title: NavTitleComponent,
    image: NavImageComponent,
    link: NavLinkComponent,
    button: NavButtonComponent,
    menu: NavMenuComponent,
    text: NavTextComponent
};

async function render(
    element: NavElement | NavMenuElement,
    layout: NavElementLayout = 'row',
    components: Partial<NavElementComponents> = COMPONENTS
): Promise<HTMLElement> {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture: ComponentFixture<NavElementComponent> = TestBed.createComponent(NavElementComponent);
    fixture.componentRef.setInput('element', element);
    fixture.componentRef.setInput('layout', layout);
    fixture.componentRef.setInput('components', components);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

describe('NavElementComponent', () => {
    test('shows nothing for a type without a component', async () => {
        const root: HTMLElement = await render({ type: 'link', name: 'Orders', route: 'orders' }, 'row', { title: NavTitleComponent });

        expect(root.innerHTML).not.toContain('Orders');
    });

    test('shows an image with its size, linked when it has a link, and a title as text without one', async () => {
        const image: HTMLElement = await render({ type: 'image', url: '/logo.svg', alt: 'Home', width: 40, height: 32, link: { route: '' } });
        const img: HTMLImageElement | null = image.querySelector('a[href="/"] img');
        expect(img?.getAttribute('alt')).toBe('Home');
        expect([img?.getAttribute('width'), img?.getAttribute('height')]).toEqual(['40', '32']);

        TestBed.resetTestingModule();
        const title: HTMLElement = await render({ type: 'title', title: 'Shop' });
        expect(title.querySelector('a')).toBeNull();
        expect(title.querySelector('span')?.textContent.trim()).toBe('Shop');
    });

    test('shows a component of your own with its inputs, and text', async () => {
        const custom: HTMLElement = await render({ type: 'custom', component: LanguageSwitchComponent, inputs: { language: 'Deutsch' } });
        expect(custom.querySelector('ngx-language-switch')?.textContent).toBe('Deutsch');

        TestBed.resetTestingModule();
        const text: HTMLElement = await render({ type: 'text', text: '© Service Soft' });
        expect(text.textContent.trim()).toBe('© Service Soft');
    });

    test('puts a menu into a popover in a row, with links, buttons and submenus, and leaves out what its condition hides', async () => {
        const menu: HTMLElement = await render({
            type: 'menu',
            name: 'Account',
            elements: [
                { type: 'link', name: 'Profile', route: 'profile' },
                { type: 'link', name: 'Hidden', route: 'hidden', condition: () => false },
                { type: 'menu', name: 'Settings', elements: [{ type: 'link', name: 'Password', url: 'https://example.com/password' }] },
                { type: 'button', name: 'Log out', action: () => undefined }
            ]
        });
        const trigger: HTMLButtonElement | null = menu.querySelector('button[popovertarget]');
        const popover: HTMLElement | null = menu.querySelector(`#${trigger?.getAttribute('popovertarget') ?? ''}`);

        expect(trigger?.textContent).toContain('Account');
        expect([...popover?.querySelectorAll(':scope > ngx-nav-menu-items > ngx-nav-menu-link > a') ?? []].map(link => link.getAttribute('href'))).toEqual(['/profile']);
        expect(popover?.querySelector('ui-menu ui-menu a')?.getAttribute('href')).toBe('https://example.com/password');
        expect(popover?.textContent).toContain('Log out');
        expect(popover?.textContent).not.toContain('Hidden');
    });

    test('draws a link with a variant as a button in a row, like a call to action, and as a link in the drawer', async () => {
        const element: NavElement = { type: 'link', name: 'Contact', route: 'contact', fragment: 'form', variant: 'filled', color: 'secondary' };
        const row: HTMLElement = await render(element);
        const button: HTMLAnchorElement | null = row.querySelector('a');
        expect(button?.getAttribute('href')).toBe('/contact#form');
        expect(button?.classList).toContain('bg-secondary');
        expect(button?.textContent).toContain('Contact');

        TestBed.resetTestingModule();
        const drawer: HTMLElement = await render(element, 'drawer');
        expect(drawer.querySelector('a')?.classList).toContain('w-full');
        expect(drawer.querySelector('a')?.classList).not.toContain('bg-secondary');
    });

    test('shows a link over the full width in the drawer, and a button like it', async () => {
        const link: HTMLElement = await render({ type: 'link', name: 'Orders', route: 'orders' }, 'drawer');
        expect(link.querySelector('a')?.classList).toContain('w-full');

        TestBed.resetTestingModule();
        const button: HTMLElement = await render({ type: 'button', name: 'Log out', action: () => undefined }, 'drawer');
        expect(button.querySelector('button')?.classList).toContain('w-full');
    });
});