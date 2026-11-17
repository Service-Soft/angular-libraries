import { Component, inject, input, InputSignal } from '@angular/core';
import { faArrowRightLong } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { ChangeSetsLabels } from './change-sets-config.model';
import { CHANGE_SETS_CONFIG } from './change-sets-config.provider';
import { ChangeView } from './change-view.model';

/**
 * The values that changed in a change set, each with its value before and after. Only used by the change sets
 * component.
 */
@Component({
    selector: 'ngx-changes-table',
    templateUrl: './changes-table.component.html',
    imports: [IconComponent],
    host: {
        class: 'block'
    }
})
export class ChangesTableComponent {
    /**
     * The changes to show.
     */
    readonly changes: InputSignal<ChangeView[]> = input.required<ChangeView[]>();

    /**
     * The texts to show.
     */
    protected readonly labels: ChangeSetsLabels = inject(CHANGE_SETS_CONFIG).labels;

    /**
     * The arrow between the values before and after.
     */
    protected readonly arrow: IconDefinition = faArrowRightLong;
}