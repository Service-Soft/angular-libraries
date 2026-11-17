import { Component, input, InputSignal, Signal, TemplateRef, viewChild } from '@angular/core';

/**
 * One step of ui-stepper: its label in the list of steps and as the heading of its content, and its content, which
 * shows while it is the current step.
 */
@Component({
    selector: 'ui-step',
    templateUrl: './step.component.html',
    host: {
        // the content renders in the panel of ui-stepper, so the element itself takes no space
        class: 'hidden'
    }
})
export class StepComponent {
    /**
     * The name of the step, like 'Choose a car'.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * The content of the step, which ui-stepper renders in its panel.
     */
    readonly content: Signal<TemplateRef<unknown>> = viewChild.required<TemplateRef<unknown>>('content');
}