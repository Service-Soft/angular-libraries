import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';

import { StepsContext } from './steps-context.model';
import { STEPS_CONTEXT } from './steps-context.provider';
import { StepsOrientation } from './steps-orientation.type';

// the marker and the line to the next step in a column at the start, the text next to it. Horizontal, once the list is
// wide enough, the marker and the line are a row above the text, see ORIENTATION_CLASSES of the list. Next to each
// other, every step is as high as the highest one; content-start keeps its rows at the top instead of stretching them,
// which would move the marker of a shorter step down, so the markers and the lines between them stay level.
const STEP_CLASSES: Record<StepsOrientation, string> = {
    vertical: 'group grid grid-cols-[auto_1fr] content-start gap-x-4',
    horizontal: 'group grid grid-cols-[auto_1fr] content-start gap-x-4 @3xl:grid-cols-1 @3xl:gap-y-4'
};

const MARKER_CLASSES: Record<StepsOrientation, string> = {
    vertical: 'flex flex-col items-center gap-2',
    horizontal: 'flex flex-col items-center gap-2 @3xl:flex-row'
};

// a border rather than a background, which forced colors mode would remove. The last step has no next one to join.
const LINE_CLASSES: Record<StepsOrientation, string> = {
    vertical: 'min-h-4 grow border-s-2 border-outline-variant group-last:hidden',
    horizontal: 'min-h-4 grow border-s-2 border-outline-variant group-last:hidden @3xl:min-h-0 @3xl:border-s-0 @3xl:border-t-2'
};

// the heading starts at the height of the middle of the number, next to it; below it, horizontal, it needs no offset.
const TEXT_CLASSES: Record<StepsOrientation, string> = {
    vertical: 'flex min-w-0 flex-col gap-1 pt-1.5 pb-8 group-last:pb-0',
    horizontal: 'flex min-w-0 flex-col gap-1 pt-1.5 pb-8 group-last:pb-0 @3xl:pt-0 @3xl:pe-4 @3xl:pb-0'
};

/**
 * A step of `<ui-steps>`, with its heading and your own text: `<ui-step heading="Sign up"><p>…</p></ui-step>`. Its
 * number comes from its place in the list.
 */
@Component({
    selector: 'ui-step',
    templateUrl: './step.component.html',
    host: {
        // a list item of the ordered list of ui-steps, without being an li, which only the consumer could write.
        role: 'listitem',
        '[class]': 'classes()'
    }
})
export class StepComponent {
    private readonly steps: StepsContext = inject(STEPS_CONTEXT);

    /**
     * The heading of the step, like 'Sign up'.
     */
    readonly heading: InputSignal<string> = input.required<string>();

    /**
     * The number of the step, from 1.
     */
    protected readonly number: Signal<number> = computed(() => this.steps.steps().indexOf(this) + 1);

    /**
     * The tailwind classes of the step.
     */
    protected readonly classes: Signal<string> = computed(() => STEP_CLASSES[this.steps.orientation()]);

    /**
     * The tailwind classes of the number and the line to the next step.
     */
    protected readonly markerClasses: Signal<string> = computed(() => MARKER_CLASSES[this.steps.orientation()]);

    /**
     * The tailwind classes of the line to the next step.
     */
    protected readonly lineClasses: Signal<string> = computed(() => LINE_CLASSES[this.steps.orientation()]);

    /**
     * The tailwind classes of the heading and the text.
     */
    protected readonly textClasses: Signal<string> = computed(() => TEXT_CLASSES[this.steps.orientation()]);
}