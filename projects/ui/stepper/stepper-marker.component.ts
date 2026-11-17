import { Component, input, InputSignal } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { StepperStepView } from './stepper-step-view.model';

/**
 * The circle of a step of ui-stepper: its number, or a check mark once it is done.
 */
@Component({
    selector: 'ui-stepper-marker',
    templateUrl: './stepper-marker.component.html',
    imports: [IconComponent],
    host: {
        // decorative: the name and the state are read with the name, and the list counts the steps
        'aria-hidden': 'true',
        '[class]': 'step().markerClasses'
    }
})
export class StepperMarkerComponent {
    /**
     * The step.
     */
    readonly step: InputSignal<StepperStepView> = input.required<StepperStepView>();

    /**
     * The check mark of a done step.
     */
    protected readonly doneIcon: IconDefinition = faCheck;
}