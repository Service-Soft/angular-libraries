import { Component, inject, input, InputSignal } from '@angular/core';
import { IconDefinition } from '@service-soft/ui/icon';

import { CheckListColor } from './check-list-color.type';
import { CheckListConfig } from './check-list-config.model';
import { CHECK_LIST_CONFIG } from './check-list-config.provider';

/**
 * A list whose items each start with an icon, a check by default, like the features of a plan:
 * `<ui-check-list><ui-check-list-item>Unlimited courses</ui-check-list-item>
 * <ui-check-list-item [included]="false">Personal coach</ui-check-list-item></ui-check-list>`. An item that is not
 * included shows a cross in the color of hints instead, and screen readers read that it is not included.
 * Unset inputs fall back to the values provided with provideCheckListConfig.
 */
@Component({
    selector: 'ui-check-list',
    templateUrl: './check-list.component.html',
    host: {
        class: 'block'
    }
})
export class CheckListComponent {
    private readonly config: CheckListConfig = inject(CHECK_LIST_CONFIG);

    /**
     * The color of the icons of the included items. The default comes from provideCheckListConfig.
     */
    readonly color: InputSignal<CheckListColor> = input<CheckListColor>(this.config.color);

    /**
     * The icon of the included items, unless an item has its own. The default comes from provideCheckListConfig, a check.
     */
    readonly icon: InputSignal<IconDefinition> = input<IconDefinition>(this.config.icon);
}