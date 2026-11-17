import { NgOptimizedImage } from '@angular/common';
import { Component, computed, input, InputSignal, Signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavElementLayout } from '@service-soft/ngx-navigation/nav-element';
import { NavigationUtilities, NavImage, NavLinkView } from '@service-soft/ngx-navigation/navigation';
import { LinkComponent } from '@service-soft/ui/link';

/**
 * Shows an image with NgOptimizedImage, linked when it has a link: the component for images in the components of the
 * navbar and the footer, `{ image: NavImageComponent }`.
 */
@Component({
    selector: 'ngx-nav-image',
    templateUrl: './nav-image.component.html',
    imports: [LinkComponent, NgOptimizedImage, RouterLink, RouterLinkActive],
    host: {
        class: 'contents'
    }
})
export class NavImageComponent {
    /**
     * The image.
     */
    readonly element: InputSignal<NavImage> = input.required<NavImage>();

    /**
     * Whether it is in a row or in the drawer, where an image looks the same.
     */
    readonly layout: InputSignal<NavElementLayout> = input.required<NavElementLayout>();

    /**
     * The attributes of its link, if it has one.
     */
    protected readonly link: Signal<NavLinkView | undefined> = computed(() => {
        const link: NavImage['link'] = this.element().link;
        return link == undefined ? undefined : NavigationUtilities.getLinkView(link);
    });
}