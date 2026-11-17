import { booleanAttribute, Component, inject, input, InputSignal, InputSignalWithTransform } from '@angular/core';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { IconComponent } from '@service-soft/ui/icon';
import { LinkUtilities } from '@service-soft/ui/link';

import { MenuComponent } from './menu.component';

/**
 * An action inside a `<ui-menu>`: `<ui-menu-item (click)="…">`. Clicking it closes the menu, with every menu it is in,
 * and returns focus to the trigger, before your click handler runs. Icons inside it are sized like in buttons.
 * With a submenu, `<ui-menu-item [submenu]="more">`, it opens that menu beside it instead.
 */
@Component({
    selector: 'ui-menu-item',
    templateUrl: './menu-item.component.html',
    imports: [IconComponent],
    host: {
        // no box of its own, so a click can only come from the button inside and bubble up to the handler of the
        // consumer. A disabled button gets no clicks at all.
        class: 'contents'
    }
})
export class MenuItemComponent {
    /**
     * Whether the action can't be chosen right now.
     */
    readonly disabled: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The menu the item opens beside it, a `<ui-menu>` inside of the menu of the item. Choosing the item then keeps
     * the menus open.
     */
    readonly submenu: InputSignal<MenuComponent | undefined> = input<MenuComponent>();

    /**
     * The menu the item is in, whose root it closes.
     */
    protected readonly menu: MenuComponent = inject(MenuComponent);

    /**
     * The icon that shows an item opens a submenu.
     */
    protected readonly submenuIcon: typeof faChevronRight = faChevronRight;

    /**
     * The classes of the button, which is drawn like a link that is an item of a menu.
     */
    protected readonly classes: string = LinkUtilities.getClasses('menu', true);

    /**
     * Closes every menu the item is in, unless it opens a submenu.
     */
    // the root hides the submenus it holds first, each giving the focus back to the item that opened it, so it ends up
    // at the trigger of the root.
    protected close(): void {
        if (this.submenu() == undefined) {
            this.menu.root.close();
        }
    }
}