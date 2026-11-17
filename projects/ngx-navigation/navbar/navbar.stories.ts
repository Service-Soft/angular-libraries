import { afterNextRender, Component, ElementRef, inject, input, InputSignal } from '@angular/core';
import { provideRouter, Routes, withHashLocation } from '@angular/router';
import { faBox, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { NavButtonComponent } from '@service-soft/ngx-navigation/nav-button';
import { NavElementComponents } from '@service-soft/ngx-navigation/nav-element';
import { NavImageComponent } from '@service-soft/ngx-navigation/nav-image';
import { NavLinkComponent } from '@service-soft/ngx-navigation/nav-link';
import { NavMenuComponent } from '@service-soft/ngx-navigation/nav-menu';
import { NavTitleComponent } from '@service-soft/ngx-navigation/nav-title';
import { NavbarRow } from '@service-soft/ngx-navigation/navigation';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { NavbarComponent } from './navbar.component';

@Component({ selector: 'ngx-story-page', template: '' })
class StoryPageComponent {}

// every link of the stories leads somewhere, so following one ends in a navigation like in an app.
const ROUTES: Routes = [{ path: '**', component: StoryPageComponent }];

const ROWS: NavbarRow[] = [
    {
        elements: [
            { type: 'image', url: '/logo.svg', alt: 'Shop, the start page', width: 40, height: 40, link: { route: '' }, collapse: 'never' },
            { type: 'title', title: 'Shop', collapse: 'never' },
            { type: 'link', name: 'Products', route: 'products', icon: faBox },
            { type: 'link', name: 'Orders', route: 'orders', collapse: 'md' },
            {
                type: 'menu',
                name: 'Help',
                position: 'center',
                collapse: 'md',
                elements: [
                    { type: 'link', name: 'Questions and answers', route: 'faq' },
                    { type: 'link', name: 'Documentation', url: 'https://example.com/docs', openInNewTab: true },
                    {
                        type: 'menu',
                        name: 'Contact',
                        elements: [
                            { type: 'link', name: 'Write to us', route: 'contact' },
                            { type: 'link', name: 'Call us', url: 'tel:+49123456789' }
                        ]
                    }
                ]
            },
            { type: 'link', name: 'Status', url: 'https://status.example.com', openInNewTab: true, position: 'end', collapse: 'lg' },
            { type: 'button', name: 'Log out', icon: faRightFromBracket, position: 'end', action: () => undefined }
        ]
    }
];

// exactly the types the rows have, which development builds check.
const COMPONENTS: Partial<NavElementComponents> = {
    image: NavImageComponent,
    title: NavTitleComponent,
    link: NavLinkComponent,
    menu: NavMenuComponent,
    button: NavButtonComponent
};

// opens the drawer once the navbar is there.
@Component({
    selector: 'ngx-navbar-story',
    template: '<ngx-navbar [rows]="rows()" [components]="components" />',
    imports: [NavbarComponent]
})
class NavbarStoryComponent {
    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly rows: InputSignal<NavbarRow[]> = input.required<NavbarRow[]>();
    readonly openDrawer: InputSignal<boolean> = input(false);
    readonly components: Partial<NavElementComponents> = COMPONENTS;

    constructor() {
        afterNextRender(() => {
            if (this.openDrawer()) {
                this.element.querySelector<HTMLButtonElement>('button[aria-label="Open the navigation"]')?.click();
            }
        });
    }
}

/**
 * The inputs of the navbar stories.
 */
type NavbarStoryArgs = {
    /**
     * The rows of the navbar.
     */
    rows: NavbarRow[],
    /**
     * Whether the story opens the drawer.
     */
    openDrawer: boolean
};

const meta: Meta<NavbarStoryArgs> = {
    title: 'Navigation/Navbar',
    component: NavbarComponent,
    // the hash keeps the router off the path of the iframe storybook renders in.
    decorators: [applicationConfig({ providers: [provideRouter(ROUTES, withHashLocation())] })],
    args: { rows: ROWS, openDrawer: false },
    render: args => ({
        props: args,
        template: '<ngx-navbar-story [rows]="rows" [openDrawer]="openDrawer" />',
        moduleMetadata: { imports: [NavbarStoryComponent] }
    })
};
export default meta;

type Story = StoryObj<NavbarStoryArgs>;

export const Default: Story = {};

// everything that collapses is in the drawer at every width, so the story shows it open on any screen.
const ALWAYS_IN_THE_DRAWER: NavbarRow[] = ROWS.map(row => ({
    elements: row.elements.map(element => element.collapse === 'never' ? element : { ...element, collapse: 'always' })
}));

export const DrawerOpen: Story = {
    args: { rows: ALWAYS_IN_THE_DRAWER, openDrawer: true }
};