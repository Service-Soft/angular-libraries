import { Component, input, InputSignal } from '@angular/core';
import { HeadingLevel } from '@service-soft/ui/heading';

/**
 * The heading of the current step of ui-stepper, its name, which gets the focus when the step shows.
 */
// not ui-heading: the focus has to go to the heading element itself, which needs an id and a tabindex, so screen
// readers announce it as the heading it is.
@Component({
    selector: 'ui-stepper-heading',
    templateUrl: './stepper-heading.component.html',
    host: {
        class: 'contents'
    }
})
export class StepperHeadingComponent {
    /**
     * The level of the heading.
     */
    readonly level: InputSignal<HeadingLevel> = input.required<HeadingLevel>();

    /**
     * The text of the heading.
     */
    readonly text: InputSignal<string> = input.required<string>();

    /**
     * The id of the heading element, which the stepper focuses.
     */
    readonly headingId: InputSignal<string> = input.required<string>();

    /**
     * The tailwind classes of the heading element.
     */
    readonly classes: InputSignal<string> = input.required<string>();
}