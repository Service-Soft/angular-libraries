import { NgOptimizedImage } from '@angular/common';
import { Component, input, InputSignal } from '@angular/core';
import { IconComponent } from '@service-soft/ui/icon';

import { ExtraOptionView } from './extra-option-view.model';

/**
 * What a card of an extras input shows: its picture or icon, its title and description, and its price. The native
 * checkbox of a toggle is projected in front of them, with the attribute control-start, the buttons and number input of
 * a quantity after the price, with control-end, and the error of a quantity below.
 */
@Component({
    selector: 'ngx-extra-option-content',
    templateUrl: './extra-option-content.component.html',
    imports: [NgOptimizedImage, IconComponent],
    host: {
        // the row is the content of the card, the label or box around it
        class: 'contents'
    }
})
export class ExtraOptionContentComponent {
    /**
     * The option of the card with its ids and texts.
     */
    readonly card: InputSignal<ExtraOptionView> = input.required<ExtraOptionView>();
}