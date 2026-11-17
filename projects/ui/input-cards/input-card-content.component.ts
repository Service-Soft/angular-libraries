import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, input, InputSignal } from '@angular/core';
import { IconComponent } from '@service-soft/ui/icon';

import { InputCardMetaDirective } from './input-card-meta.directive';
import { InputCardView } from './input-card-view.model';

/**
 * What a card of a cards input shows: its image, its title and description, and its meta. The native radio button or
 * checkbox is projected in front of the title.
 */
@Component({
    selector: 'ui-input-card-content',
    templateUrl: './input-card-content.component.html',
    imports: [NgOptimizedImage, NgTemplateOutlet, IconComponent],
    host: {
        // the image and the row are the content of the card, the label around it
        class: 'contents'
    }
})
export class InputCardContentComponent<T> {
    /**
     * The option of the card with its ids.
     */
    readonly card: InputSignal<InputCardView<T>> = input.required<InputCardView<T>>();

    /**
     * What the card shows at its end, like a price.
     */
    readonly meta: InputSignal<InputCardMetaDirective<T> | undefined> = input<InputCardMetaDirective<T>>();
}