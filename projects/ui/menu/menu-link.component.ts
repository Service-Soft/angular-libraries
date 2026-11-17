import { Component, inject } from '@angular/core';
import { LinkUtilities } from '@service-soft/ui/link';

import { MenuComponent } from './menu.component';

/**
 * A link inside a `<ui-menu>`: `<a ui-menu-link href="…">` or `<a ui-menu-link routerLink="…">`, drawn like a ui-link
 * with the appearance of a menu item, like the actions next to it. It stays your own link, so middle clicks, new tabs
 * and crawlers work as with any other. Following it closes the menu, with every menu it is in.
 */
@Component({
    selector: 'a[ui-menu-link]',
    templateUrl: './menu-link.component.html',
    host: {
        '[class]': 'classes',
        '(click)': 'menu.root.close()'
    }
})
export class MenuLinkComponent {
    /**
     * The menu the link is in, whose root it closes.
     */
    protected readonly menu: MenuComponent = inject(MenuComponent);

    /**
     * The classes of a link that is an item of a menu.
     */
    protected readonly classes: string = LinkUtilities.getClasses('menu', true);
}