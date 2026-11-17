import { LOCALE_ID } from '@angular/core';
import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { provideDatePeriodConfig } from './date-period-config.provider';
import { DatePeriodComponent } from './date-period.component';
import { DatePeriodPipe } from './date-period.pipe';

const meta: Meta<DatePeriodComponent> = {
    title: 'UI/Date period',
    component: DatePeriodComponent,
    decorators: [moduleMetadata({ imports: [DatePeriodPipe] })],
    render: args => ({
        props: args,
        template: '<p class="text-body text-on-surface"><ui-date-period [start]="start" [end]="end" /></p>'
    }),
    argTypes: {
        end: { control: 'inline-radio', options: ['2024-03', 'open', undefined] }
    },
    args: {
        start: '2022-02',
        end: 'open'
    }
};
export default meta;

type Story = StoryObj<DatePeriodComponent>;

export const Playground: Story = {};

// a closed period, one that is still going on and a single date, as time elements and with the pipe.
export const Kinds: Story = {
    render: () => ({
        template: `
            <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-body text-on-surface">
                <dt class="font-semibold">Closed</dt><dd><ui-date-period start="2022-02" end="2024-03" /></dd>
                <dt class="font-semibold">Open</dt><dd><ui-date-period start="2022-02" end="open" /></dd>
                <dt class="font-semibold">Single</dt><dd><ui-date-period start="2022-02-14" /></dd>
                <dt class="font-semibold">Same month</dt><dd><ui-date-period start="2024-03-01" end="2024-03-20" /></dd>
                <dt class="font-semibold">Pipe</dt><dd>{{ '2022-02' | uiDatePeriod: '2024-03' }}</dd>
            </dl>
        `
    })
};

// the options of Intl.DateTimeFormat, or a function that writes the date itself.
export const Formats: Story = {
    render: () => ({
        props: {
            writeQuarter: (date: Date) => `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`
        },
        template: `
            <dl class="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-body text-on-surface">
                <dt class="font-semibold">Short month</dt>
                <dd><ui-date-period start="2022-02" end="2024-03" [format]="{ month: 'short', year: 'numeric' }" /></dd>
                <dt class="font-semibold">Years</dt>
                <dd><ui-date-period start="2022-02" end="open" [format]="{ year: 'numeric' }" /></dd>
                <dt class="font-semibold">Days</dt>
                <dd><ui-date-period start="2026-07-03" end="2026-07-05" [format]="{ dateStyle: 'medium' }" /></dd>
                <dt class="font-semibold">Function</dt>
                <dd><ui-date-period start="2022-02" end="2024-11" [format]="writeQuarter" /></dd>
            </dl>
        `
    })
};

// the language of the app, with a translated open end from provideDatePeriodConfig.
export const German: Story = {
    decorators: [
        applicationConfig({
            providers: [
                { provide: LOCALE_ID, useValue: 'de' },
                provideDatePeriodConfig({ format: { month: 'long', year: 'numeric' }, openEndLabel: 'heute' })
            ]
        })
    ],
    render: () => ({
        template: '<p lang="de" class="text-body text-on-surface"><ui-date-period start="2022-02" end="open" /></p>'
    })
};