import { Component, input, InputSignal } from '@angular/core';

/**
 * What a horizontal ui-stepper shows in place of its steps where they don't fit: a text like 'Step 2 of 4', and a bar
 * of a segment for each step below it.
 */
@Component({
    selector: 'ui-stepper-progress',
    templateUrl: './stepper-progress.component.html',
    host: {
        class: 'grid gap-2'
    }
})
export class StepperProgressComponent {
    /**
     * The text, like 'Step 2 of 4'.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * The tailwind classes of the segment of each step.
     */
    readonly segments: InputSignal<string[]> = input.required<string[]>();
}