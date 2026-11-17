import { afterNextRender, Component, ElementRef, inject, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { faArrowRotateLeft, faClockRotateLeft } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent } from '@service-soft/ui/icon';
import { Meta, StoryObj } from '@storybook/angular';

import { MenuItemComponent } from './menu-item.component';
import { MenuLinkComponent } from './menu-link.component';
import { MenuTriggerDirective } from './menu-trigger.directive';
import { MenuComponent } from './menu.component';

// a component with state, which the template of a story doesn't have.
@Component({
    selector: 'ui-reset-menu',
    templateUrl: './menu.stories.html',
    imports: [ButtonComponent, IconComponent, MenuComponent, MenuItemComponent, MenuTriggerDirective]
})
class ResetMenuComponent {
    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly faArrowRotateLeft: typeof faArrowRotateLeft = faArrowRotateLeft;
    readonly faClockRotateLeft: typeof faClockRotateLeft = faClockRotateLeft;
    readonly chosen: WritableSignal<string> = signal('');

    // shows the story with the menu open.
    readonly openOnRender: InputSignal<boolean> = input(false);

    constructor() {
        afterNextRender(() => {
            if (this.openOnRender()) {
                this.element.querySelector('button')?.click();
            }
        });
    }
}

// links and a submenu, like a navigation has them.
@Component({
    selector: 'ui-account-menu',
    template: `
        <button ui-button type="button" variant="text" [uiMenuTrigger]="menu">Account</button>
        <ui-menu #menu>
            <a ui-menu-link href="#profile">Profile</a>
            <ui-menu-item [submenu]="settings">Settings</ui-menu-item>
            <ui-menu #settings>
                <a ui-menu-link href="#password">Password</a>
                <a ui-menu-link href="#second-factors">Second factors</a>
            </ui-menu>
            <ui-menu-item (click)="chosen.set('Logged out.')">Log out</ui-menu-item>
        </ui-menu>
        <p class="mt-4 text-body-sm text-on-surface-variant" role="status">{{ chosen() }}</p>
    `,
    imports: [ButtonComponent, MenuComponent, MenuItemComponent, MenuLinkComponent, MenuTriggerDirective]
})
class AccountMenuComponent {
    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly chosen: WritableSignal<string> = signal('');

    // shows the story with the menu and its submenu open.
    readonly openOnRender: InputSignal<boolean> = input(false);

    constructor() {
        afterNextRender(() => {
            if (this.openOnRender()) {
                this.element.querySelector('button')?.click();
                this.element.querySelector<HTMLButtonElement>('ui-menu-item button')?.click();
            }
        });
    }
}

const meta: Meta<MenuComponent> = {
    title: 'UI/Menu',
    component: MenuComponent
};
export default meta;

type Story = StoryObj<MenuComponent>;

export const Default: Story = {
    render: () => ({ template: '<ui-reset-menu />', moduleMetadata: { imports: [ResetMenuComponent] } })
};

export const Open: Story = {
    render: () => ({ template: '<ui-reset-menu [openOnRender]="true" />', moduleMetadata: { imports: [ResetMenuComponent] } })
};

export const WithLinksAndASubmenu: Story = {
    render: () => ({ template: '<ui-account-menu />', moduleMetadata: { imports: [AccountMenuComponent] } })
};

export const SubmenuOpen: Story = {
    render: () => ({ template: '<ui-account-menu [openOnRender]="true" />', moduleMetadata: { imports: [AccountMenuComponent] } })
};