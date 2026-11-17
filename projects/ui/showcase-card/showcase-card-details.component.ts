import { Component, inject, input, InputSignal } from '@angular/core';
import { EXPANDABLE_TEXT_CONFIG, ExpandableTextComponent, ExpandableTextLines } from '@service-soft/ui/expandable-text';

/**
 * The longer text of a showcase card, whose first lines show with a button that shows all of it in place:
 * `<ui-showcase-card-details><p>…</p></ui-showcase-card-details>`. It is a `<ui-expandable-text>`, whose texts come from
 * provideExpandableTextConfig.
 */
@Component({
    selector: 'ui-showcase-card-details',
    templateUrl: './showcase-card-details.component.html',
    imports: [ExpandableTextComponent],
    host: {
        class: 'block'
    }
})
export class ShowcaseCardDetailsComponent {
    /**
     * How many lines show while it is closed. The default comes from provideExpandableTextConfig.
     */
    readonly lines: InputSignal<ExpandableTextLines> = input<ExpandableTextLines>(inject(EXPANDABLE_TEXT_CONFIG).lines);
}