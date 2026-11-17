import { afterNextRender, Component, ElementRef, inject, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { InputCalendarColor } from '@service-soft/ui/input';
import { Meta, StoryObj } from '@storybook/angular';

import { InputTimeComponent } from './input-time.component';

// opens the picker once it rendered, so the story shows it and AXE checks it.
@Component({
    selector: 'ui-open-time-picker',
    templateUrl: './input-time.stories.html',
    imports: [InputTimeComponent]
})
class OpenTimePickerComponent {
    readonly color: InputSignal<InputCalendarColor> = input<InputCalendarColor>('primary');
    readonly value: WritableSignal<string | undefined> = signal('10:30');

    constructor() {
        const element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        afterNextRender(() => element.querySelector<HTMLButtonElement>('button[popovertarget]')?.click());
    }
}

const meta: Meta<InputTimeComponent> = {
    title: 'UI/Input time',
    component: InputTimeComponent,
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary'] },
        step: { control: 'number' },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        size: 'md',
        color: 'primary',
        step: 30,
        required: true,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, value: '09:30' },
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-time
                    label="Start"
                    hint="Between 8 AM and 6 PM"
                    min="08:00"
                    max="18:00"
                    [step]="step"
                    [size]="size"
                    [color]="color"
                    [required]="required"
                    [disabled]="disabled"
                    [readonly]="readonly"
                    [(value)]="value"
                />
                <p class="text-body-sm text-on-surface-variant">Value: {{ value }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputTimeComponent>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        props: { slots: ['09:00', '10:15', '14:30'] },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-time label="Empty" [required]="false" />
                <ui-input-time label="Time" value="09:30" />
                <ui-input-time label="Slots" hint="Only the free appointments" value="10:15" [times]="slots" />
                <ui-input-time label="Small" size="sm" value="09:30" />
                <ui-input-time label="Large" size="lg" value="09:30" />
                <ui-input-time label="Read only" readonly value="09:30" />
                <ui-input-time label="Disabled" disabled value="09:30" />
            </div>
        `
    })
};

export const Picker: Story = {
    render: () => ({
        template: '<ui-open-time-picker />',
        moduleMetadata: { imports: [OpenTimePickerComponent] }
    })
};

// one open picker per story: opening a popover closes every other one.
export const PickerSecondary: Story = {
    render: () => ({
        template: '<ui-open-time-picker color="secondary" />',
        moduleMetadata: { imports: [OpenTimePickerComponent] }
    })
};

export const PickerNeutral: Story = {
    render: () => ({
        template: '<ui-open-time-picker color="neutral" />',
        moduleMetadata: { imports: [OpenTimePickerComponent] }
    })
};

// as narrow as the input of a time next to another field: the picker grows to fit its times.
export const Narrow: Story = {
    render: () => ({
        template: '<div class="max-w-36"><ui-input-time label="Time" value="09:30" /></div>'
    })
};

// the native validation of the browser, with the errors shown right away instead of once the user left a field.
export const Validation: Story = {
    render: () => ({
        props: { slots: ['09:00', '10:15', '14:30'] },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-time label="Missing" [showValidationError]="true" />
                <ui-input-time label="Too early" hint="From 8 AM on" min="08:00" value="07:30" [showValidationError]="true" />
                <ui-input-time label="Off the steps" hint="Every half hour" value="09:45" [showValidationError]="true" />
                <ui-input-time label="Not a slot" [times]="slots" value="10:00" [showValidationError]="true" />
            </div>
        `
    })
};