import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { NavAnchorComponent, NavElementLayout, NavLabelComponent } from '@service-soft/ngx-navigation/nav-element';
import { NavigationUtilities, NavLinkView, NavTitle } from '@service-soft/ngx-navigation/navigation';

// the name of the app, as high as a button. A link inside keeps its font and color, so a linked title looks the same.
const TITLE_CLASSES: string = 'inline-flex min-h-10 items-center gap-2 font-heading text-title text-on-surface [&_svg]:size-[1.25em]';

/**
 * Shows a title, linked when it has a link: the component for titles in the components of the navbar and the footer,
 * `{ title: NavTitleComponent }`.
 */
@Component({
    selector: 'ngx-nav-title',
    templateUrl: './nav-title.component.html',
    imports: [NavAnchorComponent, NavLabelComponent],
    host: {
        class: 'contents'
    }
})
export class NavTitleComponent {
    /**
     * The title.
     */
    readonly element: InputSignal<NavTitle> = input.required<NavTitle>();

    /**
     * Whether it is in a row or in the drawer, where a title looks the same.
     */
    readonly layout: InputSignal<NavElementLayout> = input.required<NavElementLayout>();

    /**
     * The attributes of its link, if it has one.
     */
    protected readonly link: Signal<NavLinkView | undefined> = computed(() => {
        const link: NavTitle['link'] = this.element().link;
        return link == undefined ? undefined : NavigationUtilities.getLinkView(link);
    });

    /**
     * The classes of the title.
     */
    protected readonly classes: string = TITLE_CLASSES;
}