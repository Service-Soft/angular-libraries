import { Component, computed, contentChildren, inject, input, InputSignal, Signal } from '@angular/core';

import { StepComponent } from './step.component';
import { StepsConfig } from './steps-config.model';
import { STEPS_CONFIG } from './steps-config.provider';
import { StepsContext } from './steps-context.model';
import { STEPS_CONTEXT } from './steps-context.provider';
import { StepsOrientation } from './steps-orientation.type';

// horizontal, the steps share the width equally once the list is 48rem wide, and stand below each other like vertical
// ones where it is narrower, so a step never gets too narrow for its text.
const ORIENTATION_CLASSES: Record<StepsOrientation, string> = {
    vertical: 'flex flex-col',
    horizontal: 'flex flex-col @3xl:grid @3xl:auto-cols-fr @3xl:grid-flow-col @3xl:gap-x-4'
};

/**
 * The steps of a process, like how to become a member, as a numbered list:
 * `<ui-steps><ui-step heading="Sign up">…</ui-step><ui-step heading="Try it">…</ui-step></ui-steps>`. Each step shows
 * its number in a circle, joined to the next one by a line, with its heading and your own text. Horizontal steps stand
 * next to each other from a width of 48rem of the list on, and below each other where it is narrower.
 * Unset inputs fall back to the values provided with provideStepsConfig.
 */
@Component({
    selector: 'ui-steps',
    templateUrl: './steps.component.html',
    providers: [{ provide: STEPS_CONTEXT, useExisting: StepsComponent }],
    host: {
        // a container, so the steps decide by the width of the list whether they fit next to each other.
        class: 'block @container'
    }
})
export class StepsComponent implements StepsContext {
    private readonly config: StepsConfig = inject(STEPS_CONFIG);

    /**
     * How the steps follow each other: below each other, or next to each other where there is room for it. The default
     * comes from provideStepsConfig.
     */
    readonly orientation: InputSignal<StepsOrientation> = input<StepsOrientation>(this.config.orientation);

    /**
     * The steps, in their order, which gives each one its number.
     */
    readonly steps: Signal<readonly StepComponent[]> = contentChildren(StepComponent);

    /**
     * The tailwind classes of the list.
     */
    protected readonly classes: Signal<string> = computed(() => ORIENTATION_CLASSES[this.orientation()]);
}