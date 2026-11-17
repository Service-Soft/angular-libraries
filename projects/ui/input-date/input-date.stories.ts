import { afterEveryRender, afterNextRender, booleanAttribute, Component, ElementRef, inject, input, InputSignal, InputSignalWithTransform, signal, WritableSignal } from '@angular/core';
import { InputCalendarColor } from '@service-soft/ui/input';
import { Meta, StoryObj } from '@storybook/angular';

import { InputDateComponent } from './input-date.component';

// opens the calendar once it rendered, so the story shows it and AXE checks it. With showYears, it then switches the
// calendar to the years, once the calendar rendered as well.
@Component({
    selector: 'ui-open-calendar',
    templateUrl: './input-date.stories.html',
    imports: [InputDateComponent]
})
class OpenCalendarComponent {
    readonly showYears: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });
    readonly color: InputSignal<InputCalendarColor> = input<InputCalendarColor>('primary');
    readonly min: Date = new Date(2026, 10, 2);
    readonly value: WritableSignal<Date | undefined> = signal(new Date(2026, 10, 12));
    private yearsShown: boolean = false;

    constructor() {
        const element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        afterNextRender(() => element.querySelector<HTMLButtonElement>('button[popovertarget]')?.click());
        afterEveryRender(() => {
            const header: HTMLButtonElement | null = element.querySelector('button[aria-expanded="false"]');
            if (this.showYears() && !this.yearsShown && header != null) {
                this.yearsShown = true;
                header.click();
            }
        });
    }
}

const meta: Meta<InputDateComponent> = {
    title: 'UI/Input date',
    component: InputDateComponent,
    argTypes: {
        type: { control: 'inline-radio', options: ['date', 'datetime-local'] },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary'] },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        type: 'date',
        size: 'md',
        color: 'primary',
        required: true,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, value: new Date(2026, 10, 12, 9, 30) },
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-date
                    label="Deadline"
                    hint="The day it is due"
                    [type]="type"
                    [size]="size"
                    [color]="color"
                    [required]="required"
                    [disabled]="disabled"
                    [readonly]="readonly"
                    [(value)]="value"
                />
                <p class="text-body-sm text-on-surface-variant">Value: {{ value?.toString() }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputDateComponent>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        props: { date: new Date(2026, 10, 12, 9, 30) },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-date label="Empty" [required]="false" />
                <ui-input-date label="Day" [value]="date" />
                <ui-input-date label="Day and time" type="datetime-local" [value]="date" />
                <ui-input-date label="Read only" readonly [value]="date" />
                <ui-input-date label="Disabled" disabled [value]="date" />
            </div>
        `
    })
};

export const Calendar: Story = {
    render: () => ({
        template: '<ui-open-calendar />',
        moduleMetadata: { imports: [OpenCalendarComponent] }
    })
};

// one open calendar per story: opening a popover closes every other one.
export const CalendarSecondary: Story = {
    render: () => ({
        template: '<ui-open-calendar color="secondary" />',
        moduleMetadata: { imports: [OpenCalendarComponent] }
    })
};

export const CalendarNeutral: Story = {
    render: () => ({
        template: '<ui-open-calendar color="neutral" />',
        moduleMetadata: { imports: [OpenCalendarComponent] }
    })
};

export const CalendarYears: Story = {
    render: () => ({
        template: '<ui-open-calendar showYears />',
        moduleMetadata: { imports: [OpenCalendarComponent] }
    })
};

// the native validation of the browser, with the errors shown right away instead of once the user left a field.
export const Validation: Story = {
    render: () => ({
        props: {
            early: new Date(2026, 0, 5),
            min: new Date(2026, 1, 1),
            validateWeekday: (value: Date | undefined) => value?.getDay() === 0 ? 'No deliveries on Sundays.' : undefined,
            weekend: new Date(2026, 10, 15)
        },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-date label="Deadline" [showValidationError]="true" />
                <ui-input-date label="Start" hint="From February on" [min]="min" [value]="early" [showValidationError]="true" />
                <ui-input-date label="Delivery" [customValidation]="validateWeekday" [value]="weekend" [showValidationError]="true" />
            </div>
        `
    })
};