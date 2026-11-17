import { provideRouter, withHashLocation } from '@angular/router';
import { ButtonComponent } from '@service-soft/ui/button';
import { MenuComponent, MenuItemComponent, MenuTriggerDirective } from '@service-soft/ui/menu';
import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { LanguageSwitcherLanguage } from './language-switcher-language.model';
import { LanguageSwitcherComponent } from './language-switcher.component';

const LANGUAGES: LanguageSwitcherLanguage[] = [
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
    { code: 'nl', label: 'Nederlands', href: 'https://example.nl' }
];

const meta: Meta<LanguageSwitcherComponent> = {
    title: 'Navigation/Language switcher',
    component: LanguageSwitcherComponent,
    // the hash keeps the router off the path of the iframe storybook renders in.
    decorators: [
        applicationConfig({ providers: [provideRouter([], withHashLocation())] }),
        moduleMetadata({ imports: [ButtonComponent, MenuComponent, MenuItemComponent, MenuTriggerDirective] })
    ],
    argTypes: {
        appearance: { control: 'inline-radio', options: ['menu', 'list'] },
        current: { control: 'inline-radio', options: ['de', 'en', 'fr', 'nl'] }
    },
    args: {
        appearance: 'menu',
        current: 'en'
    },
    render: args => ({
        props: { ...args, languages: LANGUAGES },
        template: '<ngx-language-switcher [appearance]="appearance" [current]="current" [languages]="languages" />'
    })
};
export default meta;

type Story = StoryObj<LanguageSwitcherComponent>;

// a button with the current language, which opens a menu of all of them.
export const Menu: Story = {};

// a row of links, like in the footer.
export const List: Story = {
    args: { appearance: 'list' }
};

// inside a menu of its own, the languages are items of it, like in a menu of the navbar.
export const InMenu: Story = {
    render: () => ({
        props: { languages: LANGUAGES },
        template: `
            <button ui-button type="button" variant="text" [uiMenuTrigger]="settings">Settings</button>
            <ui-menu #settings>
                <ui-menu-item>Dark mode</ui-menu-item>
                <ngx-language-switcher current="de" [languages]="languages" />
            </ui-menu>
        `
    })
};