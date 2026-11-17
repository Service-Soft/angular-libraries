import { LOCALE_ID } from '@angular/core';
import { AddressComponent } from '@service-soft/ui/address';
import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { OpeningHoursDay } from './opening-hours-day.model';
import { OpeningHoursComponent } from './opening-hours.component';

const SPLIT_HOURS: OpeningHoursDay['ranges'] = [{ opens: '08:00', closes: '12:00' }, { opens: '14:00', closes: '18:00' }];

// a practice with split hours from Monday to Thursday, open in the morning on Friday and closed on the weekend.
const WEEK: OpeningHoursDay[] = [
    { weekday: 1, ranges: SPLIT_HOURS },
    { weekday: 2, ranges: SPLIT_HOURS },
    { weekday: 3, ranges: [{ opens: '08:00', closes: '12:00' }], note: 'Afternoon only by appointment' },
    { weekday: 4, ranges: SPLIT_HOURS },
    { weekday: 5, ranges: [{ opens: '08:00', closes: '13:00' }] }
];

const meta: Meta<OpeningHoursComponent> = {
    title: 'UI/Opening hours',
    component: OpeningHoursComponent,
    render: args => ({
        props: { ...args, week: WEEK },
        template: `
            <ui-opening-hours
                class="max-w-md"
                [week]="week"
                [group]="group"
                [status]="status"
                [firstDayOfWeek]="firstDayOfWeek"
                [dayFormat]="dayFormat"
            />
        `
    }),
    argTypes: {
        group: { control: 'boolean' },
        status: { control: 'boolean' },
        firstDayOfWeek: { control: 'inline-radio', options: [0, 1] },
        dayFormat: { control: 'inline-radio', options: ['long', 'short'] }
    },
    args: {
        group: false,
        status: true,
        firstDayOfWeek: 1,
        dayFormat: 'long'
    }
};
export default meta;

type Story = StoryObj<OpeningHoursComponent>;

// today and the status follow the time of the browser.
export const Playground: Story = {};

// days after each other with the same hours share a row: Monday and Tuesday, but not Wednesday, which has a note.
export const Grouped: Story = {
    render: () => ({
        props: { week: WEEK },
        template: '<ui-opening-hours class="max-w-md" group [week]="week" />'
    })
};

export const German: Story = {
    decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'de' }] })],
    render: () => ({
        props: { week: WEEK },
        template: '<ui-opening-hours class="max-w-md" group dayFormat="short" [week]="week" />'
    })
};

// open every day, with the status in the time zone of the business, wherever the visitor is.
export const EveryDayInBerlin: Story = {
    render: () => ({
        props: {
            week: [0, 1, 2, 3, 4, 5, 6].map(weekday => ({ weekday, ranges: [{ opens: '06:00', closes: '22:00' }] }))
        },
        template: '<ui-opening-hours class="max-w-md" group timeZone="Europe/Berlin" [week]="week" />'
    })
};

// in a footer on a colored surface. The hours and the address are properties of one business of the app's own, the
// address adds its own to it instead of being an item of its own.
export const WithAddressOnColor: Story = {
    decorators: [moduleMetadata({ imports: [AddressComponent] })],
    render: () => ({
        props: { week: WEEK, address: { street: 'Main Street 1', postalCode: '50999', city: 'Cologne' }, businessType: undefined },
        template: `
            <footer class="surface-primary p-6">
                <div class="grid gap-6 sm:grid-cols-2" itemscope itemtype="https://schema.org/Dentist">
                    <ui-address name="Dental practice Example" phone="+49 2234 12 34-5" [address]="address" [businessType]="businessType" />
                    <ui-opening-hours group [week]="week" />
                </div>
            </footer>
        `
    })
};