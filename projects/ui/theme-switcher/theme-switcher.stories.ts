import { ButtonComponent } from '@service-soft/ui/button';
import { MenuComponent, MenuItemComponent, MenuTriggerDirective } from '@service-soft/ui/menu';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { ThemeSwitcherComponent } from './theme-switcher.component';

const meta: Meta<ThemeSwitcherComponent> = {
    title: 'Navigation/Theme switcher',
    component: ThemeSwitcherComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent, MenuComponent, MenuItemComponent, MenuTriggerDirective] })],
    render: () => ({
        template: '<ui-theme-switcher />'
    })
};
export default meta;

type Story = StoryObj<ThemeSwitcherComponent>;

// a button with the icon of the current mode, which opens a menu of the three.
export const Menu: Story = {};

// inside a menu of its own, the modes are items of it, like in a menu of the navbar.
export const InMenu: Story = {
    render: () => ({
        template: `
            <button ui-button type="button" variant="text" [uiMenuTrigger]="settings">Settings</button>
            <ui-menu #settings>
                <ui-menu-item>Notifications</ui-menu-item>
                <ui-theme-switcher />
            </ui-menu>
        `
    })
};