import { booleanAttribute, Component, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef } from '@angular/core';
import { HeadingLevel } from '@service-soft/ui/heading';

import { StepperHeadingComponent } from './stepper-heading.component';
import { StepperMarkerComponent } from './stepper-marker.component';
import { StepperStepView } from './stepper-step-view.model';

/**
 * The circle and the name of a step in the list of ui-stepper: a button that goes back to a done step when the stepper
 * isn't linear. Below each other, the name of the current step is its heading, which would only repeat it right below.
 */
@Component({
    selector: 'ui-stepper-header',
    templateUrl: './stepper-header.component.html',
    imports: [StepperMarkerComponent, StepperHeadingComponent],
    host: {
        class: 'contents'
    }
})
export class StepperHeaderComponent {
    /**
     * The step.
     */
    readonly step: InputSignal<StepperStepView> = input.required<StepperStepView>();

    /**
     * Whether the name of the current step is its heading, as the steps are below each other.
     */
    readonly showsHeading: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The level of the heading.
     */
    readonly headingLevel: InputSignal<HeadingLevel> = input.required<HeadingLevel>();

    /**
     * The tailwind classes of the heading.
     */
    readonly headingClasses: InputSignal<string> = input.required<string>();

    /**
     * The tailwind classes of the button of a done step.
     */
    readonly buttonClasses: InputSignal<string> = input.required<string>();

    /**
     * Read after the name of a done step.
     */
    readonly doneLabel: InputSignal<string> = input.required<string>();

    /**
     * Emits when the user goes back to the step by its name.
     */
    readonly chosen: OutputEmitterRef<void> = output();
}