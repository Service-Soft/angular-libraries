import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { NavLinkComponent } from '@service-soft/ngx-navigation/nav-link';
import { NavigationConfig, NAVIGATION_CONFIG, NavigationService, NavLink } from '@service-soft/ngx-navigation/navigation';

/**
 * Links to the sections of the current page, from the anchors in the data of its route, like below the navbar:
 * `<ngx-nav-anchors />`. Nothing while the page has none.
 */
@Component({
    selector: 'ngx-nav-anchors',
    templateUrl: './nav-anchors.component.html',
    imports: [NavLinkComponent],
    host: {
        class: 'block'
    }
})
export class NavAnchorsComponent {
    private readonly config: NavigationConfig = inject(NAVIGATION_CONFIG);
    private readonly navigation: NavigationService = inject(NavigationService);

    /**
     * What screen readers call the links. The default comes from provideNavigationConfig.
     */
    readonly label: InputSignal<string> = input(this.config.labels.anchors);

    /**
     * Links to the sections of the current page.
     */
    protected readonly anchors: Signal<NavLink[]> = computed(() => this.navigation.anchors().map(anchor => ({
        type: 'link',
        name: anchor.name,
        icon: anchor.icon,
        route: this.navigation.path(),
        fragment: anchor.fragment
    })));
}