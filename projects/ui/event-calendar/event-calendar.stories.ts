import { Component, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { Meta, StoryObj } from '@storybook/angular';

import { EventCalendarColor } from './event-calendar-color.type';
import { EventCalendarEvent } from './event-calendar-event.model';
import { EventCalendarRange } from './event-calendar-range.model';
import { EventCalendarView } from './event-calendar-view.type';
import { EventCalendarComponent } from './event-calendar.component';

const TRAINING: EventCalendarEvent['category'] = { label: 'Youth', color: 'success' };
const MATCH: EventCalendarEvent['category'] = { label: 'First team', color: 'error' };
const CLUB: EventCalendarEvent['category'] = { label: 'Club', color: 'secondary' };

/**
 * The events of a club in the days of a range, like a backend would send them: trainings every Tuesday and Thursday,
 * a match every second Saturday, a board meeting on the first Monday and a tournament over the third weekend.
 * @param range - The days the calendar shows.
 * @returns The events.
 */
function resolveClubEvents(range: EventCalendarRange): EventCalendarEvent[] {
    const events: EventCalendarEvent[] = [];
    for (let day: Date = range.start; day < range.end; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
        const [year, month, date] = [day.getFullYear(), day.getMonth(), day.getDate()];
        if (day.getDay() === 2 || day.getDay() === 4) {
            events.push({
                title: 'Training',
                start: new Date(year, month, date, 18, 0),
                end: new Date(year, month, date, 19, 30),
                category: TRAINING,
                location: 'Sports hall, Main Street 12',
                description: 'Bring indoor shoes.\nThe hall opens 15 minutes before.',
                url: 'https://example.com/training'
            });
        }
        if (day.getDay() === 6 && Math.floor(date / 7) % 2 === 0) {
            const start: Date = new Date(year, month, date, 15, 0);
            events.push({ title: 'Home match', start, end: new Date(year, month, date, 17, 0), category: MATCH, location: 'Stadium' });
        }
        if (day.getDay() === 1 && date <= 7) {
            events.push({ title: 'Board meeting', start: new Date(year, month, date, 19, 0), end: new Date(year, month, date, 21, 0) });
        }
        if (date === 15) {
            events.push({ title: 'Tournament', start: day, end: new Date(year, month, 17), allDay: true, category: CLUB });
        }
    }
    return events;
}

const NOVEMBER: Date = new Date(2026, 10, 1);

// the six weeks the month shows
const NOVEMBER_EVENTS: EventCalendarEvent[] = resolveClubEvents({ start: new Date(2026, 9, 26), end: new Date(2026, 11, 7) });

const RADIO: 'inline-radio' = 'inline-radio';

const COLORS: EventCalendarColor[] = ['neutral', 'primary', 'secondary', 'error', 'success', 'warning'];

// loads the events of the days the calendar shows whenever they change, like from a backend.
@Component({
    selector: 'ui-club-calendar',
    template: '<ui-event-calendar [events]="events()" [color]="color()" [month]="month" [(view)]="view" (rangeChange)="load($event)" />',
    imports: [EventCalendarComponent]
})
class ClubCalendarComponent {
    readonly color: InputSignal<EventCalendarColor> = input<EventCalendarColor>('primary');
    readonly month: Date = NOVEMBER;
    readonly events: WritableSignal<EventCalendarEvent[]> = signal([]);
    readonly view: WritableSignal<EventCalendarView> = signal('month');

    load(range: EventCalendarRange): void {
        this.events.set(resolveClubEvents(range));
    }
}

const meta: Meta<EventCalendarComponent> = {
    title: 'UI/Event calendar',
    component: EventCalendarComponent,
    argTypes: {
        view: { control: RADIO, options: ['month', 'agenda'] },
        color: { control: RADIO, options: COLORS },
        headerColor: { control: RADIO, options: ['neutral', 'primary', 'secondary'] }
    },
    args: {
        view: 'month',
        color: 'primary',
        headerColor: 'primary'
    },
    render: args => ({
        props: { ...args, month: NOVEMBER, events: NOVEMBER_EVENTS },
        template: '<ui-event-calendar [events]="events" [month]="month" [view]="view" [color]="color" [headerColor]="headerColor" />'
    })
};
export default meta;

type Story = StoryObj<EventCalendarComponent>;

export const Playground: Story = {};

export const HeaderSecondary: Story = {
    args: { headerColor: 'secondary' }
};

export const HeaderNeutral: Story = {
    args: { headerColor: 'neutral' }
};

export const Agenda: Story = {
    args: { view: 'agenda' }
};

// as narrow as a phone: the days show a dot for each event instead of their titles.
export const Narrow: Story = {
    render: () => ({
        props: { month: NOVEMBER, events: NOVEMBER_EVENTS },
        template: '<div class="max-w-sm"><ui-event-calendar [events]="events" [month]="month" /></div>'
    })
};

export const NarrowAgenda: Story = {
    render: () => ({
        props: { month: NOVEMBER, events: NOVEMBER_EVENTS },
        template: '<div class="max-w-sm"><ui-event-calendar view="agenda" [events]="events" [month]="month" /></div>'
    })
};

// every color an event can have, by its category or the color of the calendar.
export const Colors: Story = {
    render: () => ({
        props: {
            month: NOVEMBER,
            events: COLORS.map((color, index) => ({
                title: `Event in ${color}`,
                start: new Date(2026, 10, 9 + index, 10, 0),
                end: new Date(2026, 10, 9 + index, 11, 0),
                category: { label: color, color }
            }))
        },
        template: '<ui-event-calendar [events]="events" [month]="month" />'
    })
};

export const Empty: Story = {
    render: () => ({
        props: { month: NOVEMBER },
        template: `
            <div class="grid gap-8">
                <ui-event-calendar [month]="month" />
                <ui-event-calendar view="agenda" [month]="month" />
            </div>
        `
    })
};

// the events are loaded for the days the calendar shows, so every month has some.
export const LoadedByRange: Story = {
    render: () => ({
        template: '<ui-club-calendar />',
        moduleMetadata: { imports: [ClubCalendarComponent] }
    })
};

// on a colored surface, whose tokens the calendar takes like every other component.
export const OnColoredSurface: Story = {
    render: () => ({
        props: { month: NOVEMBER, events: NOVEMBER_EVENTS },
        template: '<div class="surface-primary rounded-card p-4"><ui-event-calendar [events]="events" [month]="month" /></div>'
    })
};