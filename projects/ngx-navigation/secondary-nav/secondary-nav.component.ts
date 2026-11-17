import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, InputSignal, Signal, viewChild } from '@angular/core';
import { NavAnchorComponent } from '@service-soft/ngx-navigation/nav-element';
import { NavigationUtilities, NavLink } from '@service-soft/ngx-navigation/navigation';

import { SecondaryNavItem } from './secondary-nav-item.model';

/**
 * A row of pills that link to the pages of a section, like the training, the teams and the news of a sport, below the
 * navbar or the heading of the section: `<ngx-secondary-nav label="Football" [links]="links" />`. The link of the
 * current page is filled and tells screen readers that it is the current one.
 * Pills that don't fit, like on a phone, scroll sideways in their row, and the current one is scrolled into view.
 */
@Component({
    selector: 'ngx-secondary-nav',
    templateUrl: './secondary-nav.component.html',
    imports: [NavAnchorComponent],
    host: {
        class: 'block'
    }
})
export class SecondaryNavComponent {
    private readonly injector: Injector = inject(Injector);

    private readonly list: Signal<ElementRef<HTMLElement>> = viewChild.required<ElementRef<HTMLElement>>('list');

    /**
     * What screen readers call the navigation, like the name of the section. Required, as it sits on a page with the
     * main navigation, which screen readers have to tell apart.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * The links to the pages of the section, in the order they show. Their condition says whether they show, like in
     * the navbar.
     */
    readonly links: InputSignal<NavLink[]> = input.required<NavLink[]>();

    /**
     * The links that show, with the attributes of their `<a>`.
     */
    protected readonly items: Signal<SecondaryNavItem[]> = computed(() => NavigationUtilities.findShown(this.links(), this.injector)
        .map(link => ({ link, view: NavigationUtilities.getLinkView(link) })));

    /**
     * Scrolls the link of the current page into the middle of the row, once a link became the current one.
     * @param isCurrent - Whether the link that changed is the current page now.
     */
    // after the render, which only runs in the browser and has the layout. Only sideways: scrollIntoView would scroll the
    // page as well, to wherever the row is. The list is the offsetParent of its links. In right to left the offsets and
    // the scroll position count from the same edge, so the same formula holds.
    protected revealCurrent(isCurrent: boolean): void {
        if (!isCurrent) {
            return;
        }
        afterNextRender(() => {
            const list: HTMLElement = this.list().nativeElement;
            const current: HTMLElement | null = list.querySelector<HTMLElement>('[aria-current="page"]');
            if (current != undefined) {
                list.scrollLeft = current.offsetLeft - ((list.clientWidth - current.offsetWidth) / 2);
            }
        }, { injector: this.injector });
    }
}