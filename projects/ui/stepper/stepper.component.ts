import { afterNextRender, booleanAttribute, Component, computed, contentChildren, ElementRef, inject, Injector, input, InputSignal, InputSignalWithTransform, model, ModelSignal, output, OutputEmitterRef, signal, Signal, WritableSignal } from '@angular/core';
import { HeadingLevel } from '@service-soft/ui/heading';

import { StepComponent } from './step.component';
import { StepperBeforeNext } from './stepper-before-next.type';
import { StepperColor } from './stepper-color.type';
import { StepperConfig } from './stepper-config.model';
import { STEPPER_CONFIG } from './stepper-config.provider';
import { StepperHeaderComponent } from './stepper-header.component';
import { StepperOrientation } from './stepper-orientation.type';
import { StepperPanelComponent } from './stepper-panel.component';
import { StepperProgressComponent } from './stepper-progress.component';
import { StepperStepState } from './stepper-step-state.type';
import { StepperStepView } from './stepper-step-view.model';

// a circle with the number of the step, or a check mark once it is done, so the state never shows by the color alone.
// The current one has a ring around it as well, an outline, which forced colors mode draws, like the borders: the done
// and the current ones have a transparent one, which keeps their circle there, where backgrounds are gone.
const MARKER_CLASSES: string = 'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-label [&_svg]:size-4';

// filled with the color under its on- color, a checked pair, neutral the text color under the surface, the reverse of
// one.
const MARKER_STATE_CLASSES: Record<'done' | 'current', Record<StepperColor, string>> = {
    done: {
        neutral: 'border-transparent bg-on-surface text-surface',
        primary: 'border-transparent bg-primary text-on-primary',
        secondary: 'border-transparent bg-secondary text-on-secondary'
    },
    current: {
        neutral: 'border-transparent bg-on-surface text-surface outline-2 outline-offset-2 outline-on-surface',
        primary: 'border-transparent bg-primary text-on-primary outline-2 outline-offset-2 outline-primary',
        secondary: 'border-transparent bg-secondary text-on-secondary outline-2 outline-offset-2 outline-secondary-text'
    }
};

// steps to come have the border of a control, in every color.
const UPCOMING_MARKER_CLASSES: string = 'border-outline bg-surface text-on-surface-variant';

// the current step is set apart by its weight as well. text-label sets the weight through a variable, which
// font-semibold sets, so it wins in any order.
const LABEL_CLASSES: Record<StepperStepState, string> = {
    done: 'min-w-0 text-label text-on-surface',
    current: 'min-w-0 text-label font-semibold text-on-surface',
    upcoming: 'min-w-0 text-label text-on-surface-variant'
};

// decorative, the markers say where each step is. In a row, it fills the space to the next step; below each other, it
// runs down to the next marker, past the content of the current step. The last step has none, an empty element keeps
// its cell in the grid below each other.
const CONNECTOR_CLASSES: Record<StepperOrientation | 'none', string> = {
    horizontal: 'h-0.5 min-w-4 flex-1 rounded-full',
    vertical: 'min-h-4 w-0.5 justify-self-center rounded-full',
    none: ''
};

// the line after a done step and the segments of the steps reached are in the color, so they show how far the user got.
const REACHED_COLOR_CLASSES: Record<StepperColor, string> = {
    neutral: 'bg-on-surface',
    primary: 'bg-primary',
    secondary: 'bg-secondary'
};

const OPEN_COLOR_CLASSES: string = 'bg-outline-variant';

// the name of a done step the user may go back to, underlined on hover, which says it can be clicked.
const HEADER_BUTTON_CLASSES: string = `
    flex min-h-6 cursor-pointer items-center gap-3 rounded-link text-start
    hover:underline
    focus-visible:outline-2 focus-visible:outline-offset-2
`;

// in a color whose contrast to the surface is checked: secondary is too light, so it is secondary-text.
const FOCUS_RING_CLASSES: Record<StepperColor, string> = {
    neutral: 'focus-visible:outline-primary',
    primary: 'focus-visible:outline-primary',
    secondary: 'focus-visible:outline-secondary-text'
};

// the bar below "Step 2 of 4" where the row of steps doesn't fit: decorative, the text says the same.
const PROGRESS_SEGMENT_CLASSES: string = 'h-1 flex-1 rounded-full';

// the heading of the current step gets the focus by script, so it can't be reached by Tab. It only shows its ring after
// the keyboard was used, like any :focus-visible. Below each other, it is the name in the list, as large as the others.
const HEADING_CLASSES: Record<StepperOrientation, string> = {
    horizontal: `
        rounded-link font-heading text-title text-on-surface
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
    `,
    vertical: `
        rounded-link font-heading text-label-lg font-semibold text-on-surface
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
    `
};

// one counter for every stepper, so no two of them give their headings the same id.
let nextId: number = 0;

/**
 * A flow of steps, like a booking: its steps, each one done, the current one, or still to come, the content of the
 * current step with its name as the heading, and buttons back and on. Every ui-step inside is one of them.
 * The content of a step is a native form, so the button that goes on is its submit button: the browser checks the
 * controls of the step, which show their errors, and only goes on when they are valid, also when the user presses enter
 * in one of them. The last step finishes instead, which (finished) says. Focus moves to the heading of the step that
 * shows. The content of every step stays rendered while it is hidden, so it keeps what the user typed.
 * Bind the current step two-way with [(step)], its index from 0.
 * Unset inputs fall back to the values provided with provideStepperConfig.
 */
@Component({
    selector: 'ui-stepper',
    templateUrl: './stepper.component.html',
    imports: [StepperHeaderComponent, StepperPanelComponent, StepperProgressComponent],
    host: {
        // a container, so the row of steps becomes "Step 2 of 4" by its own width, not the one of the screen, also in a
        // narrow column.
        class: '@container block'
    }
})
export class StepperComponent {
    private readonly config: StepperConfig = inject(STEPPER_CONFIG);
    private readonly injector: Injector = inject(Injector);
    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    private readonly id: string = `ui-stepper-${nextId++}`;

    /**
     * The steps.
     */
    protected readonly steps: Signal<readonly StepComponent[]> = contentChildren(StepComponent);

    /**
     * The index of the current step, from 0.
     */
    readonly step: ModelSignal<number> = model(0);

    /**
     * Whether the steps are in a row above the content of the current one, or below each other with the content of the
     * current step below its name.
     */
    readonly orientation: InputSignal<StepperOrientation> = input<StepperOrientation>(this.config.orientation);

    /**
     * Whether the user only moves with the buttons, or may also go back to a done step by clicking its name. Going on
     * always checks the current step, so a step can't be skipped either way.
     */
    readonly linear: InputSignalWithTransform<boolean, unknown> = input(this.config.linear, { transform: booleanAttribute });

    /**
     * The color of the done and the current steps.
     */
    readonly color: InputSignal<StepperColor> = input<StepperColor>(this.config.color);

    /**
     * The level of the heading of the current step, which is its name.
     */
    readonly headingLevel: InputSignal<HeadingLevel> = input<HeadingLevel>(this.config.headingLevel);

    /**
     * What screen readers call the list of the steps.
     */
    readonly label: InputSignal<string> = input(this.config.label);

    /**
     * The text of the button that goes back to the step before.
     */
    readonly backLabel: InputSignal<string> = input(this.config.backLabel);

    /**
     * The text of the button that goes on to the next step.
     */
    readonly nextLabel: InputSignal<string> = input(this.config.nextLabel);

    /**
     * The text of the button of the last step, like 'Book now'.
     */
    readonly finishLabel: InputSignal<string> = input(this.config.finishLabel);

    /**
     * Emits when the user finishes the last step, once its controls are valid.
     */
    readonly finished: OutputEmitterRef<void> = output();

    /**
     * A check that runs once the controls of the current step are valid, before the stepper goes on or finishes, like
     * whether the chosen car is still available. While its promise runs, the button that goes on is busy; false stays on
     * the step, so show the user why, like with the customValidation of a control.
     */
    readonly beforeNext: InputSignal<StepperBeforeNext | undefined> = input<StepperBeforeNext>();

    /**
     * Read after the name of a done step.
     */
    protected readonly doneLabel: string = this.config.doneLabel;

    /**
     * What screen readers call the spinner of the button that goes on, while beforeNext runs.
     */
    protected readonly busyLabel: string = this.config.busyLabel;

    /**
     * Whether beforeNext runs.
     */
    protected readonly isChecking: WritableSignal<boolean> = signal(false);

    /**
     * Whether the steps are below each other.
     */
    protected readonly isVertical: Signal<boolean> = computed(() => this.orientation() === 'vertical');

    /**
     * The steps with what their headers and panels show.
     */
    protected readonly views: Signal<StepperStepView[]> = computed(() => {
        const current: number = this.step();
        const steps: readonly StepComponent[] = this.steps();
        const color: StepperColor = this.color();
        return steps.map((step, index) => {
            const state: StepperStepState = index < current ? 'done' : index === current ? 'current' : 'upcoming';
            const isLast: boolean = index === steps.length - 1;
            const marker: string = state === 'upcoming' ? UPCOMING_MARKER_CLASSES : MARKER_STATE_CLASSES[state][color];
            const connector: string = index < current ? REACHED_COLOR_CLASSES[color] : OPEN_COLOR_CLASSES;
            return {
                step,
                index,
                state,
                isFirst: index === 0,
                isLast,
                isNavigable: !this.linear() && state === 'done',
                headingId: `${this.id}-heading-${index}`,
                markerClasses: `${MARKER_CLASSES} ${marker}`,
                labelClasses: LABEL_CLASSES[state],
                connectorClasses: isLast ? CONNECTOR_CLASSES.none : `${CONNECTOR_CLASSES[this.orientation()]} ${connector}`
            };
        });
    });

    /**
     * What shows in place of a row of steps that doesn't fit, like 'Step 2 of 4'.
     */
    protected readonly progressLabel: Signal<string> = computed(() => this.config.progressLabel(this.step() + 1, this.steps().length));

    /**
     * The tailwind classes of the segments of the bar below the progress label, one for each step.
     */
    protected readonly progressSegments: Signal<string[]> = computed(() => this.steps().map((_, index) => {
        const color: string = index <= this.step() ? REACHED_COLOR_CLASSES[this.color()] : OPEN_COLOR_CLASSES;
        return `${PROGRESS_SEGMENT_CLASSES} ${color}`;
    }));

    /**
     * The tailwind classes of the name of a done step that is a button.
     */
    protected readonly headerButtonClasses: Signal<string> = computed(() => `${HEADER_BUTTON_CLASSES} ${FOCUS_RING_CLASSES[this.color()]}`);

    /**
     * The tailwind classes of the heading of the current step.
     */
    protected readonly headingClasses: Signal<string> = computed(() => HEADING_CLASSES[this.orientation()]);

    /**
     * Goes on to the next step, or finishes on the last one, once beforeNext agreed. The form of the step only submits
     * when its controls are valid.
     */
    // a second submit while the check runs is dropped, so a double click doesn't skip a step. A user who went back while
    // it ran stays where they went.
    protected async next(): Promise<void> {
        const beforeNext: StepperBeforeNext | undefined = this.beforeNext();
        const index: number = this.step();
        if (this.isChecking()) {
            return;
        }
        if (beforeNext != undefined) {
            this.isChecking.set(true);
            try {
                if (!await beforeNext(index) || this.step() !== index) {
                    return;
                }
            }
            finally {
                this.isChecking.set(false);
            }
        }
        if (index >= this.steps().length - 1) {
            this.finished.emit();
            return;
        }
        this.goTo(index + 1);
    }

    /**
     * Goes back to the step before.
     */
    protected back(): void {
        this.goTo(this.step() - 1);
    }

    /**
     * Shows a step and moves the focus to its heading.
     * @param index - The index of the step.
     */
    // the button that was used hides with its step, which would drop the focus on the body. The heading says where the
    // user is now, and the next Tab goes into the step.
    protected goTo(index: number): void {
        this.step.set(index);
        const headingId: string | undefined = this.views()[index]?.headingId;
        afterNextRender(() => this.element.querySelector<HTMLElement>(`#${headingId}`)?.focus(), { injector: this.injector });
    }
}