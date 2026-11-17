import { Component, input, InputSignal, linkedSignal, WritableSignal } from '@angular/core';
import { DateRange, EntityClass, EntityUtilities, Property } from '@service-soft/ngx-entity/entity';
import { EntityFormComponent } from '@service-soft/ngx-entity/form';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { Meta, StoryObj } from '@storybook/angular';

import { EntityObjectArrayFieldComponent } from './entity-object-array-field.component';

enum Weekday {
    MONDAY = 'Monday',
    TUESDAY = 'Tuesday',
    WEDNESDAY = 'Wednesday',
    THURSDAY = 'Thursday',
    FRIDAY = 'Friday'
}

class Speaker {
    @Property.string({ displayName: 'Name' })
    name!: string;

    @Property.string({ displayName: 'Topic', required: false })
    topic?: string;

    @Property.number({ displayName: 'Minutes', format: 'integer', min: 5, default: 30 })
    minutes!: number;
}

// an array of every kind of item.
class Conference {
    @Property.array({
        displayName: 'Tags',
        description: 'Type one and press Enter',
        items: { type: 'string', options: ['angular', 'signals', 'testing'] }
    })
    tags!: string[];

    @Property.array({ displayName: 'Days', required: true, items: { type: 'string', enum: Weekday } })
    days!: Weekday[];

    @Property.array({ displayName: 'Sessions', items: { type: 'date', displayStyle: 'datetime' } })
    sessions!: Date[];

    @Property.array({ displayName: 'Closed', items: { type: 'dateRange' } })
    closed!: DateRange[];

    @Property.array({ displayName: 'Speakers', required: true, items: { type: 'object', cls: () => Speaker } })
    speakers!: Speaker[];
}

@Component({
    selector: 'ngx-conference-form',
    templateUrl: './entity-object-array-field.stories.html',
    imports: [FormComponent, EntityFormComponent, ButtonComponent]
})
class ConferenceFormComponent {
    readonly initial: InputSignal<Partial<Conference>> = input(EntityUtilities.resolveDefaults(Conference));

    readonly entity: EntityClass<Conference> = Conference;
    readonly value: WritableSignal<Partial<Conference>> = linkedSignal(() => this.initial());
}

const FILLED: Partial<Conference> = {
    tags: ['angular', 'testing'],
    days: [Weekday.MONDAY, Weekday.TUESDAY],
    sessions: [new Date(2026, 4, 4, 9, 30), new Date(2026, 4, 5, 14)],
    closed: [{ start: new Date(2026, 4, 1), end: new Date(2026, 4, 3) }],
    speakers: [{ name: 'Ada Lovelace', topic: 'Engines', minutes: 45 }, { name: 'Grace Hopper', minutes: 30 }]
};

const meta: Meta<EntityObjectArrayFieldComponent<Conference>> = {
    title: 'Entity/Arrays',
    component: EntityObjectArrayFieldComponent
};
export default meta;

type Story = StoryObj<EntityObjectArrayFieldComponent<Conference>>;

export const Empty: Story = {
    render: () => ({ template: '<ngx-conference-form />', moduleMetadata: { imports: [ConferenceFormComponent] } })
};

export const Filled: Story = {
    render: () => ({
        props: { filled: FILLED },
        template: '<ngx-conference-form [initial]="filled" />',
        moduleMetadata: { imports: [ConferenceFormComponent] }
    })
};