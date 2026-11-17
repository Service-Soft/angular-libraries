import { Component, input, InputSignal, output, OutputEmitterRef } from '@angular/core';
import { Tracking } from '@service-soft/ngx-tracking/consent';
import { DetailsComponent, SummaryComponent } from '@service-soft/ui/details';
import { InputBooleanComponent } from '@service-soft/ui/input-boolean';

import { ConsentCategoryView } from './consent-category-view.model';

/**
 * One category of the consent dialog: a checkbox for the whole category beside its title, which opens the checkboxes of
 * its trackings with their descriptions. Internal to the consent dialog.
 */
@Component({
    selector: 'ngx-consent-category',
    templateUrl: './consent-category.component.html',
    imports: [DetailsComponent, InputBooleanComponent, SummaryComponent],
    host: { class: 'block' }
})
export class ConsentCategoryComponent {
    /**
     * The category to show.
     */
    readonly category: InputSignal<ConsentCategoryView> = input.required<ConsentCategoryView>();

    /**
     * Whether only the checkbox of the category shows, without its trackings.
     */
    readonly showOnlyCategory: InputSignal<boolean> = input.required<boolean>();

    /**
     * Emits when the user checked or unchecked the whole category.
     */
    readonly categoryToggled: OutputEmitterRef<void> = output();

    /**
     * Emits the tracking the user checked or unchecked.
     */
    readonly trackingToggled: OutputEmitterRef<Tracking> = output();
}