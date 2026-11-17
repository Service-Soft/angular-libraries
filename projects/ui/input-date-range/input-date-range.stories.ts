import { afterNextRender, Component, ElementRef, inject, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { InputCalendarColor, InputValidation } from '@service-soft/ui/input';
import { InputTimeUtilities } from '@service-soft/ui/input-time';
import { Meta, StoryObj } from '@storybook/angular';

import { InputDateRangeTimes } from './input-date-range-times.type';
import { InputDateRangeComponent } from './input-date-range.component';
import { InputDateRange } from './input-date-range.model';

// a rental that is open from 8 to 18 o'clock on weekdays, from 9 to 12 on Saturdays and closed on Sundays.
const OPENING_HOURS: InputDateRangeTimes = day => {
    switch (day.getDay()) {
        case 0: {
            return [];
        }
        case 6: {
            return InputTimeUtilities.resolveTimes('09:00', '12:00', 30);
        }
        default: {
            return InputTimeUtilities.resolveTimes('08:00', '18:00', 30);
        }
    }
};

const CLOSED_ON_SUNDAYS: InputValidation<Date> = day => day.getDay() === 0 ? 'We are closed on Sundays.' : undefined;

// opens the calendar once it rendered, so the story shows the range and AXE checks it. The end button opens it, so it
// chooses the end and offers only the days that make the range at least two and at most fourteen days long.
@Component({
    selector: 'ui-open-range-calendar',
    templateUrl: './input-date-range.stories.html',
    imports: [InputDateRangeComponent]
})
class OpenRangeCalendarComponent {
    readonly color: InputSignal<InputCalendarColor> = input<InputCalendarColor>('primary');
    readonly closedOnSundays: InputValidation<Date> = CLOSED_ON_SUNDAYS;
    readonly value: WritableSignal<InputDateRange> = signal({ start: new Date(2026, 10, 12), end: new Date(2026, 10, 18) });

    constructor() {
        const element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        afterNextRender(() => element.querySelectorAll<HTMLButtonElement>('button[popovertarget]')[1]?.click());
    }
}

const meta: Meta<InputDateRangeComponent> = {
    title: 'UI/Input date range',
    component: InputDateRangeComponent,
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary'] },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        size: 'md',
        color: 'primary',
        required: true,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: {
            ...args,
            openingHours: OPENING_HOURS,
            value: { start: new Date(2026, 10, 13, 9, 0), end: new Date(2026, 10, 16, 17, 30) }
        },
        template: `
            <div class="grid max-w-xl gap-2">
                <ui-input-date-range
                    label="Rental"
                    hint="Pick-up and return during our opening hours"
                    startLabel="Pick-up"
                    endLabel="Return"
                    [times]="openingHours"
                    [minDuration]="{ hours: 4 }"
                    [maxDuration]="{ days: 14 }"
                    [size]="size"
                    [color]="color"
                    [required]="required"
                    [disabled]="disabled"
                    [readonly]="readonly"
                    [(value)]="value"
                />
                <p class="text-body-sm text-on-surface-variant">Value: {{ value.start?.toString() }} – {{ value.end?.toString() }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputDateRangeComponent>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        props: {
            openingHours: OPENING_HOURS,
            holiday: { start: new Date(2026, 10, 12), end: new Date(2026, 10, 19) },
            rental: { start: new Date(2026, 10, 13, 9, 0), end: new Date(2026, 10, 16, 17, 30) }
        },
        template: `
            <div class="grid max-w-xl gap-4">
                <ui-input-date-range label="Empty" [required]="false" />
                <ui-input-date-range label="Holiday" startLabel="Arrival" endLabel="Departure" [value]="holiday" />
                <ui-input-date-range label="Rental" startLabel="Pick-up" endLabel="Return" [times]="openingHours" [value]="rental" />
                <ui-input-date-range label="Read only" readonly [times]="openingHours" [value]="rental" />
                <ui-input-date-range label="Disabled" disabled [times]="openingHours" [value]="rental" />
            </div>
        `
    })
};

export const Calendar: Story = {
    render: () => ({
        template: '<ui-open-range-calendar />',
        moduleMetadata: { imports: [OpenRangeCalendarComponent] }
    })
};

// one open calendar per story: opening a popover closes every other one.
export const CalendarNeutral: Story = {
    render: () => ({
        template: '<ui-open-range-calendar color="neutral" />',
        moduleMetadata: { imports: [OpenRangeCalendarComponent] }
    })
};

// the rules of a booking, with the errors shown right away instead of once the user left a field.
export const Validation: Story = {
    render: () => ({
        props: {
            openingHours: OPENING_HOURS,
            closedOnSundays: CLOSED_ON_SUNDAYS,
            min: new Date(2026, 10, 2),
            incomplete: { start: new Date(2026, 10, 12), end: undefined },
            reversed: { start: new Date(2026, 10, 18), end: new Date(2026, 10, 12) },
            early: { start: new Date(2026, 9, 26), end: new Date(2026, 10, 3) },
            closedDay: { start: new Date(2026, 10, 12), end: new Date(2026, 10, 15) },
            short: { start: new Date(2026, 10, 12), end: new Date(2026, 10, 13) },
            closed: { start: new Date(2026, 10, 13, 7, 0), end: new Date(2026, 10, 16, 9, 0) }
        },
        template: `
            <div class="grid max-w-xl gap-4">
                <ui-input-date-range label="Missing" [showValidationError]="true" />
                <ui-input-date-range label="Incomplete" [value]="incomplete" [showValidationError]="true" />
                <ui-input-date-range label="Reversed" [value]="reversed" [showValidationError]="true" />
                <ui-input-date-range
                    label="Too early"
                    hint="From the 2nd of November on"
                    [min]="min"
                    [value]="early"
                    [showValidationError]="true"
                />
                <ui-input-date-range
                    label="Closed day"
                    [dayValidation]="closedOnSundays"
                    [value]="closedDay"
                    [showValidationError]="true"
                />
                <ui-input-date-range
                    label="Too short"
                    hint="At least 2 nights"
                    [minDuration]="{ days: 2 }"
                    [value]="short"
                    [showValidationError]="true"
                />
                <ui-input-date-range label="Closed time" [times]="openingHours" [value]="closed" [showValidationError]="true" />
            </div>
        `
    })
};