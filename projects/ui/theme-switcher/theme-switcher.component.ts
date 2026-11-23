import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';
import { IS_IN_DRAWER } from '@service-soft/ui/drawer';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { LinkComponent } from '@service-soft/ui/link';
import { MenuComponent, MenuTriggerDirective } from '@service-soft/ui/menu';

import { ThemeMenuItemsComponent } from './theme-menu-items.component';
import { ThemeMode } from './theme-mode.type';
import { ThemeSwitcherConfig } from './theme-switcher-config.model';
import { THEME_SWITCHER_CONFIG } from './theme-switcher-config.provider';
import { ThemeSwitcherOption } from './theme-switcher-option.model';
import { ThemeService } from './theme.service';

/**
 * The modes in the order the menu shows them.
 */
const MODES: ThemeMode[] = ['system', 'light', 'dark'];

/**
 * Lets the user choose the color mode of the page: the one of the operating system, light or dark,
 * like in the navbar: `<ui-theme-switcher />`. A button with the icon of the current mode opens a menu of the three.
 * Inside of a ui-menu, like a menu of the navbar, the modes are items of that menu. Inside of a ui-drawer, the button is
 * a row of it, which names the current mode beside its icon.
 * The choice is kept by the ThemeService. Add ThemeModeUtilities.INIT_SCRIPT to your index.html, so pages show in it
 * from the start. Unset inputs fall back to the values provided with provideThemeSwitcherConfig.
 */
@Component({
    selector: 'ui-theme-switcher',
    templateUrl: './theme-switcher.component.html',
    imports: [ButtonComponent, IconComponent, LinkComponent, MenuComponent, MenuTriggerDirective, ThemeMenuItemsComponent],
    host: {
        class: 'contents'
    }
})
export class ThemeSwitcherComponent {
    private readonly config: ThemeSwitcherConfig = inject(THEME_SWITCHER_CONFIG);
    private readonly themeService: ThemeService = inject(ThemeService);

    /**
     * Whether it is inside of a ui-menu, whose items its modes then are.
     */
    protected readonly isInMenu: boolean = inject(MenuComponent, { optional: true }) != undefined;

    /**
     * Whether it is inside of a ui-drawer, which has the room to name the current mode beside its icon.
     */
    protected readonly isInDrawer: boolean = inject(IS_IN_DRAWER);

    /**
     * What screen readers call the switcher.
     */
    readonly label: InputSignal<string> = input(this.config.label);

    /**
     * The modes, the current one marked.
     */
    protected readonly options: Signal<ThemeSwitcherOption[]> = computed(() => {
        const current: ThemeMode = this.themeService.mode();
        return MODES.map(mode => ({
            mode,
            label: this.config.modeLabels[mode],
            icon: this.config.modeIcons[mode],
            isCurrent: mode === current
        }));
    });

    /**
     * The icon of the button, the one of the current mode.
     */
    protected readonly buttonIcon: Signal<IconDefinition> = computed(() => this.config.modeIcons[this.themeService.mode()]);

    /**
     * The name of the current mode, like 'Dark'.
     */
    protected readonly modeLabel: Signal<string> = computed(() => this.config.modeLabels[this.themeService.mode()]);

    /**
     * The name of the button, the label and the current mode, like 'Theme: Dark'.
     */
    protected readonly buttonLabel: Signal<string> = computed(() => `${this.label()}: ${this.modeLabel()}`);

    /**
     * Changes the mode of the page.
     * @param mode - The chosen mode.
     */
    protected choose(mode: ThemeMode): void {
        this.themeService.setMode(mode);
    }
}