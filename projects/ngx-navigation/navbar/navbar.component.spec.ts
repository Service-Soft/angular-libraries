import { Component, inject, InjectionToken, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NavButtonComponent } from '@service-soft/ngx-navigation/nav-button';
import { NavElementComponents, NavElementLayout } from '@service-soft/ngx-navigation/nav-element';
import { NavLinkComponent } from '@service-soft/ngx-navigation/nav-link';
import { NavMenuComponent } from '@service-soft/ngx-navigation/nav-menu';
import { NavTitleComponent } from '@service-soft/ngx-navigation/nav-title';
import { NavbarRow, NavLink, NavRouteCondition, provideNavigationConfig } from '@service-soft/ngx-navigation/navigation';
import { MenuComponent, MenuItemComponent } from '@service-soft/ui/menu';
import { DialogTestingUtilities } from 'testing/dialog';
import { ErrorHandlerTestingUtilities } from 'testing/error-handler';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

import { provideNavbarConfig } from './navbar-config.provider';
import { NavbarComponent } from './navbar.component';

@Component({ selector: 'ngx-page', template: '' })
class PageComponent {}

// a component of the app in place of the one for links, with the same inputs.
@Component({ selector: 'ngx-star-link', template: '<a class="star" [attr.data-layout]="layout()">★ {{ element().name }}</a>' })
class StarLinkComponent {
    readonly element: InputSignal<NavLink> = input.required<NavLink>();
    readonly layout: InputSignal<NavElementLayout> = input.required<NavElementLayout>();
}

/**
 * The data of a route of the tests that only a role may open.
 */
type RoleRouteData = {
    /**
     * The role that may open it.
     */
    role?: string
};

const LOGGED_IN: InjectionToken<WritableSignal<boolean>> = new InjectionToken('LOGGED_IN', { providedIn: 'root', factory: () => signal(false) });

const ROWS: NavbarRow[] = [
    {
        elements: [
            { type: 'title', title: 'Shop', link: { route: '' }, collapse: 'never' },
            { type: 'link', name: 'Orders', route: 'orders', collapse: 'md' },
            { type: 'link', name: 'Docs', url: 'https://example.com/docs', openInNewTab: true, position: 'center' },
            { type: 'menu', name: 'Account', position: 'end', elements: [{ type: 'link', name: 'Profile', route: 'profile' }] },
            { type: 'button', name: 'Log out', position: 'end', condition: () => inject(LOGGED_IN)(), action: () => inject(LOGGED_IN).set(false) }
        ]
    }
];

const COMPONENTS: Partial<NavElementComponents> = {
    title: NavTitleComponent,
    link: NavLinkComponent,
    menu: NavMenuComponent,
    button: NavButtonComponent
};

@Component({
    selector: 'ngx-navbar-host',
    template: '<ngx-navbar [rows]="rows" [components]="components" /><p>Page</p>',
    imports: [NavbarComponent]
})
class NavbarHostComponent {
    rows: NavbarRow[] = ROWS;
    components: Partial<NavElementComponents> = COMPONENTS;
}

async function render(
    rows: NavbarRow[] = ROWS,
    components: Partial<NavElementComponents> = COMPONENTS
): Promise<[ComponentFixture<NavbarHostComponent>, HTMLElement]> {
    TestBed.configureTestingModule({
        providers: [provideRouter([{ path: '', component: PageComponent }, { path: 'orders', component: PageComponent }])]
    });
    const fixture: ComponentFixture<NavbarHostComponent> = TestBed.createComponent(NavbarHostComponent);
    fixture.componentInstance.rows = rows;
    fixture.componentInstance.components = components;
    // like the first navigation of an app, which tells the links which one is the current page
    await TestBed.inject(Router).navigateByUrl('/');
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findTexts(elements: Iterable<Element>): string[] {
    return [...elements].map(element => element.textContent.replaceAll(/\s+/g, ' ').trim());
}

describe('NavbarComponent', () => {
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
    });

    afterEach(() => {
        removeModalDialogs();
    });

    test('places the elements at the start, in the center and at the end of their row, and links them', async () => {
        const [, root] = await render();
        const groups: Element[] = [...root.querySelectorAll('header > nav > ngx-nav-row > div')];

        // the menu is in the page while it is closed, after the button that opens it
        // the link to another site says to screen readers that it opens in a new tab
        expect(findTexts(groups)).toEqual(['Shop Orders', 'Docs (opens in a new tab)', 'Account Profile']);
        expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Navigation');
        const links: HTMLAnchorElement[] = [...root.querySelectorAll<HTMLAnchorElement>('header > nav a')];
        expect(links.map(link => link.getAttribute('href'))).toEqual(['/', '/orders', 'https://example.com/docs', '/profile']);
        expect(links[2]?.target).toBe('_blank');
        expect(links[2]?.rel).toBe('noopener noreferrer');
        // the start page is the current page
        expect(links[0]?.getAttribute('aria-current')).toBe('page');
        expect(links[1]?.hasAttribute('aria-current')).toBe(false);
    });

    test('draws the navigation on the surface, or in a theme color while the drawer keeps its own, above the page', async () => {
        TestBed.configureTestingModule({ providers: [provideNavbarConfig({ color: 'primary' })] });
        const [, root] = await render();

        expect(root.querySelector('header > nav')?.className).toBe('surface-primary');
        // stacked above the page that follows, with the shadow of dark mode, which shows on a section of its color
        expect(root.querySelector('header')?.className).toBe('dark relative shadow-1 z-10');
        // the drawer keeps the mode of the page and its own color
        expect(root.querySelector('header dialog')).toBeNull();
        expect(root.querySelector('dialog')?.className).not.toContain('surface-primary');
    });

    test('draws the navigation on the surface by default, with the shadow of the mode of the page', async () => {
        const [, root] = await render();

        expect(root.querySelector('header > nav')?.className).toBe('bg-surface text-on-surface');
        expect(root.querySelector('header')?.className).toBe('relative shadow-1 z-10');
    });

    test('moves elements into the drawer up to their collapse, with a button that opens it for as long', async () => {
        const [fixture, root] = await render();
        const items: Element[] = [...root.querySelectorAll('header > nav > ngx-nav-row > div > div')];
        const drawerItems: Element[] = [...root.querySelector('dialog ul')?.children ?? []];

        expect(items.map(item => item.className)).toEqual([
            'flex items-center',
            'hidden items-center lg:flex',
            'hidden items-center md:flex',
            'hidden items-center md:flex',
            'flex lg:hidden'
        ]);
        // the title never collapses, so the drawer has the others, only below the width they collapse at
        expect(findTexts(drawerItems)).toEqual(['Orders', 'Docs (opens in a new tab)', 'Account Profile']);
        expect(drawerItems.map(item => item.className)).toEqual(['lg:hidden', 'md:hidden', 'md:hidden']);
        // a menu is a section that opens in the drawer
        expect(drawerItems[2]?.querySelector('details summary')?.textContent).toContain('Account');

        const menuButton: HTMLButtonElement | null = root.querySelector('button[aria-label="Open the navigation"]');
        menuButton?.click();
        await fixture.whenStable();
        expect(root.querySelector('dialog')?.open).toBe(true);

        // following a link leaves the drawer behind
        await TestBed.inject(Router).navigateByUrl('/orders');
        await fixture.whenStable();
        expect(root.querySelector('dialog')?.open).toBe(false);
    });

    test('has no button for the drawer while nothing collapses, and takes the default collapse from the config', async () => {
        TestBed.configureTestingModule({ providers: [provideNavbarConfig({ collapse: 'never', labels: { navigation: 'Main' } })] });
        const [, root] = await render([{ elements: [{ type: 'link', name: 'Orders', route: 'orders' }] }], { link: NavLinkComponent });

        expect(root.querySelector('button[aria-label="Open the navigation"]')).toBeNull();
        expect(root.querySelector('dialog ul')?.children).toHaveLength(0);
        expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Main');
    });

    test('shows an element while its condition holds, following the signals it reads, and runs buttons in an injection context', async () => {
        const [fixture, root] = await render();
        expect(root.textContent).not.toContain('Log out');

        TestBed.inject(LOGGED_IN).set(true);
        await fixture.whenStable();
        const logOut: HTMLButtonElement | undefined = [...root.querySelectorAll<HTMLButtonElement>('header > nav button')]
            .find(button => button.textContent.includes('Log out'));
        logOut?.click();
        await fixture.whenStable();

        expect(TestBed.inject(LOGGED_IN)()).toBe(false);
        expect(root.textContent).not.toContain('Log out');
    });

    test('shows a link to a route while the routeCondition passes for the route and its parents, following the signals it reads', async () => {
        const role: WritableSignal<string> = signal('clerk');
        // like the permissions of a route the permissionGuard of ngx-auth reads from its data
        const routeCondition: NavRouteCondition = route => {
            const data: RoleRouteData = route.data ?? {};
            return data.role == undefined || data.role === role();
        };
        TestBed.configureTestingModule({
            providers: [
                provideRouter([
                    { path: '', component: PageComponent },
                    { path: 'orders', component: PageComponent, data: { role: 'clerk' } },
                    { path: 'admin', data: { role: 'admin' }, children: [{ path: 'users', component: PageComponent }] }
                ]),
                provideNavigationConfig({ routeCondition })
            ]
        });
        const fixture: ComponentFixture<NavbarHostComponent> = TestBed.createComponent(NavbarHostComponent);
        fixture.componentInstance.rows = [
            {
                elements: [
                    { type: 'link', name: 'Orders', route: 'orders', collapse: 'never' },
                    { type: 'link', name: 'Users', route: '/admin/users', collapse: 'never' },
                    { type: 'link', name: 'Reports', route: { path: 'reports', title: 'Reports', data: { role: 'admin' } }, collapse: 'never' },
                    { type: 'link', name: 'Unknown', route: 'orders/1', collapse: 'never' },
                    { type: 'link', name: 'Docs', url: 'https://example.com/docs', collapse: 'never' }
                ]
            }
        ];
        fixture.componentInstance.components = { link: NavLinkComponent };
        await fixture.whenStable();
        const root: HTMLElement = fixture.nativeElement as HTMLElement;
        expect(findTexts(root.querySelectorAll('header > nav a'))).toEqual(['Orders', 'Unknown', 'Docs']);

        role.set('admin');
        await fixture.whenStable();
        expect(findTexts(root.querySelectorAll('header > nav a'))).toEqual(['Users', 'Reports', 'Unknown', 'Docs']);
    });

    test('shows a type with a component of the app in place of the one of the library', async () => {
        const [, root] = await render([{ elements: [{ type: 'link', name: 'Orders', route: 'orders', collapse: 'always' }] }], { link: StarLinkComponent });

        expect(root.querySelector('header > nav a.star')?.textContent).toBe('★ Orders');
        expect(root.querySelector('header > nav a.star')?.getAttribute('data-layout')).toBe('row');
        expect(root.querySelector('dialog a.star')?.getAttribute('data-layout')).toBe('drawer');
    });

    test('throws in development builds for a type without a component, and for a component nothing uses', async () => {
        const { button, ...withoutButton } = COMPONENTS;
        expect(button).toBe(NavButtonComponent);
        // the error handler of the app gets them first, whose default would log them
        const errors: unknown[] = [];
        TestBed.configureTestingModule({ providers: [ErrorHandlerTestingUtilities.provideErrorList(errors)] });
        // the button is hidden by its condition, but it may show later, so it needs its component anyway
        await expect(render(ROWS, withoutButton))
            .rejects.toThrow('The navbar needs a component for "button", which are used but missing in its components.');

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: [ErrorHandlerTestingUtilities.provideErrorList(errors)] });
        await expect(render([{ elements: [{ type: 'link', name: 'Orders', route: 'orders' }] }], { link: NavLinkComponent, menu: NavMenuComponent }))
            .rejects.toThrow('The navbar has a component for "menu", which nothing uses.');
        expect(errors).toHaveLength(2);
    });

    test('shows a custom component inside a menu, as menu items there and as itself in the drawer', async () => {
        const rows: NavbarRow[] = [
            {
                elements: [
                    {
                        type: 'menu',
                        name: 'Language',
                        collapse: 'md',
                        elements: [{ type: 'custom', component: LanguageSwitchComponent, inputs: { languages: ['English', 'Deutsch'] } }]
                    }
                ]
            }
        ];
        const [, root] = await render(rows, { menu: NavMenuComponent });

        expect(findTexts(root.querySelectorAll('header > nav ui-menu button'))).toEqual(['English', 'Deutsch']);
        expect(findTexts(root.querySelectorAll('dialog ngx-language-switch span'))).toEqual(['English', 'Deutsch']);
    });
});

// a component of the app inside a menu: menu items there, plain texts in the drawer.
@Component({
    selector: 'ngx-language-switch',
    template: `@for (language of languages(); track language) {
        @if (menu) { <ui-menu-item>{{ language }}</ui-menu-item> } @else { <span>{{ language }}</span> }
    }`,
    imports: [MenuItemComponent]
})
class LanguageSwitchComponent {
    readonly languages: InputSignal<string[]> = input.required<string[]>();
    protected readonly menu: MenuComponent | null = inject(MenuComponent, { optional: true });
}