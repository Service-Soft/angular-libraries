import { booleanAttribute, Component, input, InputSignal, InputSignalWithTransform, Signal, TemplateRef, viewChild } from '@angular/core';

/**
 * One tab of ui-tabs: its label in the list of tabs, and its content, which shows while it is selected.
 */
@Component({
    selector: 'ui-tab',
    templateUrl: './tab.component.html',
    host: {
        // the content renders in the panel of ui-tabs, so the element itself takes no space
        class: 'hidden'
    }
})
export class TabComponent {
    /**
     * What identifies the tab, which ui-tabs selects it by.
     */
    readonly value: InputSignal<string> = input.required<string>();

    /**
     * What the tab shows in the list of tabs.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * Whether the tab can't be selected.
     */
    readonly disabled: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The content of the tab, which ui-tabs renders in its panel.
     */
    readonly content: Signal<TemplateRef<unknown>> = viewChild.required<TemplateRef<unknown>>('content');
}