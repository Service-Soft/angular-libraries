import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { MenuItemComponent } from '@service-soft/ui/menu';

import { ThemeMode } from './theme-mode.type';
import { ThemeSwitcherOption } from './theme-switcher-option.model';

/**
 * The modes of the theme switcher as items of the ui-menu they are in, the current one marked with a check.
 */
@Component({
    selector: 'ui-theme-menu-items',
    templateUrl: './theme-menu-items.component.html',
    imports: [MenuItemComponent, IconComponent],
    host: {
        class: 'contents'
    }
})
export class ThemeMenuItemsComponent {
    /**
     * The modes, the current one marked.
     */
    readonly options: InputSignal<ThemeSwitcherOption[]> = input.required<ThemeSwitcherOption[]>();

    /**
     * Emits the mode the user chose.
     */
    readonly chosen: OutputEmitterRef<ThemeMode> = output<ThemeMode>();

    /**
     * The mark of the current mode.
     */
    protected readonly currentIcon: IconDefinition = faCheck;
}