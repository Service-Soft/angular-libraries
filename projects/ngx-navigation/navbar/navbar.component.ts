import { Component, computed, effect, ElementRef, inject, Injector, input, InputSignal, signal, Signal, viewChild, WritableSignal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { NavElementComponent, NavElementComponents, NavElementUtilities, NavRowComponent, NavRowItem } from '@service-soft/ngx-navigation/nav-element';
import { NavbarElement, NavbarRow, NavCollapse, NavigationUtilities, NavPositionGroups } from '@service-soft/ngx-navigation/navigation';
import { ButtonComponent } from '@service-soft/ui/button';
import { DrawerComponent } from '@service-soft/ui/drawer';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { filter } from 'rxjs';

import { NavbarConfig, NavbarLabels } from './navbar-config.model';
import { NAVBAR_CONFIG } from './navbar-config.provider';

// set by the angular cli and false in production builds, which then leave out everything it guards.
declare const ngDevMode: unknown;

// in the navbar from the breakpoint after the size it collapses at, in the drawer below it. The breakpoints are the
// ones of the consumer's theme, so both follow when it changes them.
const ROW_ITEM_CLASSES: Record<NavCollapse, string> = {
    sm: 'hidden items-center md:flex',
    md: 'hidden items-center lg:flex',
    lg: 'hidden items-center xl:flex',
    always: 'hidden',
    never: 'flex items-center'
};

const DRAWER_ITEM_CLASSES: Record<Exclude<NavCollapse, 'never'>, string> = {
    sm: 'md:hidden',
    md: 'lg:hidden',
    lg: 'xl:hidden',
    always: 'block'
};

// the button that opens the drawer is there as long as any element is in it.
const MENU_BUTTON_CLASSES: Record<Exclude<NavCollapse, 'never'>, string> = {
    sm: 'flex md:hidden',
    md: 'flex lg:hidden',
    lg: 'flex xl:hidden',
    always: 'flex'
};

// from the widest screen an element is in the drawer at to the narrowest.
const COLLAPSE_ORDER: Exclude<NavCollapse, 'never'>[] = ['always', 'lg', 'md', 'sm'];

/**
 * The navigation at the top of the app, built from rows of elements, each shown by the component for its type:
 * `<ngx-navbar [rows]="navbarRows" [components]="{ title: NavTitleComponent, link: NavLinkComponent }" />`. Elements
 * move into a drawer on screens up to the width their collapse says, which a button at the end of the first row opens.
 */
@Component({
    selector: 'ngx-navbar',
    templateUrl: './navbar.component.html',
    imports: [ButtonComponent, DrawerComponent, IconComponent, NavElementComponent, NavRowComponent],
    host: {
        class: 'block'
    }
})
export class NavbarComponent {
    private readonly config: NavbarConfig = inject(NAVBAR_CONFIG);
    private readonly injector: Injector = inject(Injector);

    // read as an element: on a ui-button the reference would otherwise be the component.
    private readonly menuButton: Signal<ElementRef<HTMLButtonElement> | undefined> = viewChild('menuButton', { read: ElementRef });

    /**
     * The rows of the navbar, usually one.
     */
    readonly rows: InputSignal<NavbarRow[]> = input.required<NavbarRow[]>();

    /**
     * The component that shows each type of element the rows have, like `{ link: NavLinkComponent }`, or one of your
     * own. Only these end up in the bundle. Development builds throw for a type of the rows without a component, and
     * for a component no element of the rows needs.
     */
    readonly components: InputSignal<Partial<NavElementComponents>> = input.required<Partial<NavElementComponents>>();

    /**
     * What screen readers call the navigation of the navbar and the drawer. The default comes from provideNavbarConfig.
     */
    readonly label: InputSignal<string> = input(this.config.labels.navigation);

    /**
     * The texts to show.
     */
    protected readonly labels: NavbarLabels = this.config.labels;

    /**
     * The icon of the button that opens the drawer.
     */
    protected readonly menuIcon: IconDefinition = this.config.menuIcon;

    /**
     * Whether the drawer is open.
     */
    protected readonly drawerOpen: WritableSignal<boolean> = signal(false);

    private readonly shown: Signal<NavbarElement[][]> = computed(() => {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            NavElementUtilities.validateComponents(this.components(), this.rows().flatMap(row => row.elements), 'The navbar');
        }
        return this.rows().map(row => NavigationUtilities.findShown(row.elements, this.injector));
    });

    /**
     * The elements of each row whose condition holds, by where in the row they are.
     */
    protected readonly rowViews: Signal<NavPositionGroups<NavRowItem>[]> = computed(() => this.shown().map(elements => {
        const groups: NavPositionGroups<NavbarElement> = NavigationUtilities.groupByPosition(elements);
        return { start: this.getRowItems(groups.start), center: this.getRowItems(groups.center), end: this.getRowItems(groups.end) };
    }));

    /**
     * The elements that are in the drawer at some width, with the classes that show them there only then.
     */
    protected readonly drawerItems: Signal<NavRowItem[]> = computed(() => this.shown().flat()
        .flatMap(element => {
            const collapse: NavCollapse = this.getCollapse(element);
            return collapse === 'never' ? [] : [{ element, classes: DRAWER_ITEM_CLASSES[collapse] }];
        }));

    /**
     * The classes of the button that opens the drawer, undefined while no element can be in it.
     */
    protected readonly menuButtonClasses: Signal<string | undefined> = computed(() => {
        const collapses: NavCollapse[] = this.shown().flat()
            .map(element => this.getCollapse(element));
        const widest: Exclude<NavCollapse, 'never'> | undefined = COLLAPSE_ORDER.find(collapse => collapses.includes(collapse));
        return widest == undefined ? undefined : MENU_BUTTON_CLASSES[widest];
    });

    constructor() {
        // following a link of the drawer, or a button that navigates, leaves the drawer behind.
        inject(Router).events
            .pipe(filter(event => event instanceof NavigationEnd), takeUntilDestroyed())
            .subscribe(() => this.drawerOpen.set(false));
        this.closeDrawerOnceItIsEmpty();
    }

    private getRowItems(elements: NavbarElement[]): NavRowItem[] {
        return elements.map(element => ({ element, classes: ROW_ITEM_CLASSES[this.getCollapse(element)] }));
    }

    private getCollapse(element: NavbarElement): NavCollapse {
        return element.collapse ?? this.config.collapse;
    }

    // on a screen that got wide enough, like a tablet turned sideways, every element of the drawer is back in the navbar
    // and the button that opened it is gone. The breakpoints live in css, so the button says when that happens.
    private closeDrawerOnceItIsEmpty(): void {
        effect(onCleanup => {
            const button: HTMLButtonElement | undefined = this.menuButton()?.nativeElement;
            if (button == undefined || typeof ResizeObserver === 'undefined') {
                return;
            }
            const observer: ResizeObserver = new ResizeObserver(() => {
                if (!button.checkVisibility()) {
                    this.drawerOpen.set(false);
                }
            });
            observer.observe(button);
            onCleanup(() => observer.disconnect());
        });
    }
}