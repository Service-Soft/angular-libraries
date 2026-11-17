import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, computed, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef, Signal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { HeadingLevel } from '@service-soft/ui/heading';
import { SpinnerComponent } from '@service-soft/ui/spinner';

import { StepperHeadingComponent } from './stepper-heading.component';
import { StepperStepView } from './stepper-step-view.model';

/**
 * The content of a step of ui-stepper with the buttons back and on, in a native form: its submit button goes on, which
 * the browser only lets through once the controls of the step are valid, and ui-form shows their errors and focuses
 * the first invalid one. Hidden while it isn't the current step, not removed, so the step keeps its state.
 */
@Component({
    selector: 'ui-stepper-panel',
    templateUrl: './stepper-panel.component.html',
    imports: [NgTemplateOutlet, ButtonComponent, FormComponent, SpinnerComponent, StepperHeadingComponent],
    host: {
        class: 'contents'
    }
})
export class StepperPanelComponent {
    /**
     * The step.
     */
    readonly step: InputSignal<StepperStepView> = input.required<StepperStepView>();

    /**
     * Whether the name of the step is the heading above its content, as it isn't in the list of the steps.
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
     * The text of the button back.
     */
    readonly backLabel: InputSignal<string> = input.required<string>();

    /**
     * The text of the button that goes on.
     */
    readonly nextLabel: InputSignal<string> = input.required<string>();

    /**
     * The text of the button of the last step.
     */
    readonly finishLabel: InputSignal<string> = input.required<string>();

    /**
     * Whether the check before going on runs, which the button that goes on shows.
     */
    readonly busy: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * What screen readers call the spinner of the busy button.
     */
    readonly busyLabel: InputSignal<string> = input.required<string>();

    /**
     * Emits when the user goes on, once the controls of the step are valid.
     */
    readonly next: OutputEmitterRef<void> = output();

    /**
     * Emits when the user goes back.
     */
    readonly back: OutputEmitterRef<void> = output();

    /**
     * The text of the submit button: finish on the last step, next on the others.
     */
    protected readonly submitLabel: Signal<string> = computed(() => this.step().isLast ? this.finishLabel() : this.nextLabel());
}