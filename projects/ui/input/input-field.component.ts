import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, computed, input, InputSignal, InputSignalWithTransform, Signal, TemplateRef } from '@angular/core';

import { InputFieldLayout } from './input-field-layout.type';
import { InputFieldState } from './input-field-state.model';
import { InputSize } from './input-size.type';

// the row opens from 0fr to 1fr, which slides the content below instead of letting it jump. Closed it takes no space,
// so inputs line up with what is next to them.
const MESSAGE_ROW_CLASSES: Record<'open' | 'closed', string> = {
    open: 'grid grid-rows-[1fr] motion-safe:transition-[grid-template-rows]',
    closed: 'grid grid-rows-[0fr] motion-safe:transition-[grid-template-rows]'
};

// the label of an inline control is as high as an input of the same size, so both line up next to each other, and
// the whole row is a target for the control. Padding rather than a min-h, so a label of several lines keeps it too,
// which the message below moves into. A flex box drops the space before the star of a required one, the gap puts it
// back.
const INLINE_LABEL_CLASSES: Record<InputSize, string> = {
    sm: 'flex cursor-pointer items-center gap-1 py-1 text-body text-on-surface',
    md: 'flex cursor-pointer items-center gap-1 py-2 text-body text-on-surface',
    lg: 'flex cursor-pointer items-center gap-1 py-3 text-body text-on-surface'
};

const STACKED_LABEL_CLASSES: string = 'mb-1.5 text-label text-on-surface';

// relative, so a control can place a button over its native element, like the one that shows a password. Filling, it
// takes the height the field gets beyond its own, as a column its control can grow in.
const CONTROL_CLASSES: Record<'fill' | 'fit', string> = {
    fill: 'relative flex grow flex-col',
    fit: 'relative'
};

// still the name of the control for screen readers, and what a click on it focuses, only not shown.
const HIDDEN_LABEL_CLASSES: string = 'sr-only';

// the open message of an inline control moves up by the padding of the label, so it is as close to the label as the
// message of a stacked one is to its input. Closed it doesn't, so the row keeps the height of an input.
const INLINE_MESSAGE_CLASSES: Record<InputSize | 'closed', string> = {
    sm: 'col-start-2 -mt-1 motion-safe:transition-[margin]',
    md: 'col-start-2 -mt-2 motion-safe:transition-[margin]',
    lg: 'col-start-2 -mt-3 motion-safe:transition-[margin]',
    closed: 'col-start-2 motion-safe:transition-[margin]'
};

/**
 * The label of a control and the hint or validation error below it, around the native element it projects. Stacked,
 * the label is above the control; inline, it is after it, like for a checkbox; group, it is the legend of a fieldset
 * around several native elements, like radio buttons, which the hint and the error describe.
 * The controls of ui render it; a control of your own extends BaseInputDirective and passes itself as the field.
 */
@Component({
    selector: 'ui-input-field',
    templateUrl: './input-field.component.html',
    imports: [NgTemplateOutlet],
    host: {
        // the label, the control and the message are rows of the flex column of the control
        class: 'contents'
    }
})
export class InputFieldComponent {
    /**
     * The control whose label, hint and error to show.
     */
    readonly field: InputSignal<InputFieldState> = input.required<InputFieldState>();

    /**
     * Whether the label is above the control, after it, or the legend of a fieldset around a group of native elements.
     */
    readonly layout: InputSignal<InputFieldLayout> = input<InputFieldLayout>('stacked');

    /**
     * The size of the control, which sets the height of the label of an inline one.
     */
    readonly size: InputSignal<InputSize> = input<InputSize>('md');

    /**
     * Whether an inline control keeps the space of a stacked label above it, so it lines up with the stacked inputs next
     * to it rather than with their labels.
     */
    readonly alignWithInputs: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether a stacked control fills the height its field gets beyond its own, like a textarea spanning two rows of a
     * grid. The control grows with it, the message stays right below it.
     */
    readonly fill: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Content the label shows in place of the label text of the field, like a text with a link in it. Links are fine
     * inside a label: following one doesn't change the control.
     */
    readonly labelTemplate: InputSignal<TemplateRef<unknown> | undefined> = input<TemplateRef<unknown>>();

    /**
     * The tailwind classes of the box around a stacked control.
     */
    protected readonly controlClasses: Signal<string> = computed(() => CONTROL_CLASSES[this.fill() ? 'fill' : 'fit']);

    /**
     * The tailwind classes of the space of a stacked label above an inline control, hidden while it doesn't align with
     * inputs.
     */
    // the classes of a stacked label, so it is as high as one in every theme. A class instead of an @if keeps the
    // template within the complexity limit.
    protected readonly labelSpaceClasses: Signal<string> = computed(
        () => this.alignWithInputs() ? `invisible ${STACKED_LABEL_CLASSES}` : 'hidden'
    );

    /**
     * Whether the row below the control is open, because anything shows or keeps its space there.
     */
    protected readonly isMessageRowOpen: Signal<boolean> = computed(() => {
        const field: InputFieldState = this.field();
        return field.reservedError() != undefined || field.hint() != undefined;
    });

    /**
     * The tailwind classes of the row below the control.
     */
    protected readonly messageRowClasses: Signal<string> = computed(() => MESSAGE_ROW_CLASSES[this.isMessageRowOpen() ? 'open' : 'closed']);

    /**
     * The tailwind classes of the label of an inline control.
     */
    protected readonly inlineLabelClasses: Signal<string> = computed(
        () => this.field().hideLabel() ? HIDDEN_LABEL_CLASSES : INLINE_LABEL_CLASSES[this.size()]
    );

    /**
     * The tailwind classes of the label of a stacked control.
     */
    protected readonly stackedLabelClasses: Signal<string> = computed(
        () => this.field().hideLabel() ? HIDDEN_LABEL_CLASSES : STACKED_LABEL_CLASSES
    );

    /**
     * The tailwind classes around the message of an inline control.
     */
    protected readonly inlineMessageClasses: Signal<string> = computed(
        () => INLINE_MESSAGE_CLASSES[this.isMessageRowOpen() ? this.size() : 'closed']
    );
}