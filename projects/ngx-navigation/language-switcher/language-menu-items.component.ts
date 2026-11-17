import { Component, input, InputSignal } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { MenuLinkComponent } from '@service-soft/ui/menu';

import { LanguageSwitcherItem } from './language-switcher-item.model';

/**
 * The languages of the switcher as links of the ui-menu they are in, the current one marked with a check.
 */
@Component({
    selector: 'ngx-language-menu-items',
    templateUrl: './language-menu-items.component.html',
    imports: [MenuLinkComponent, IconComponent],
    host: {
        class: 'contents'
    }
})
export class LanguageMenuItemsComponent {
    /**
     * The languages with their links.
     */
    readonly items: InputSignal<LanguageSwitcherItem[]> = input.required<LanguageSwitcherItem[]>();

    /**
     * The mark of the current language.
     */
    protected readonly currentIcon: IconDefinition = faCheck;
}