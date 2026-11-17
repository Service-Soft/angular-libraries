import { Component, input, InputSignal, linkedSignal, signal, WritableSignal } from '@angular/core';
import { DateRange, EntityClass, EntityUtilities, Property } from '@service-soft/ngx-entity/entity';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { Meta, StoryObj } from '@storybook/angular';
import { ValidationProblem } from 'zibri-contract';

import { EntityFormMode } from './entity-form-mode.type';
import { EntityFormComponent } from './entity-form.component';

enum ProjectStatus {
    PLANNED = 'Planned',
    RUNNING = 'Running',
    DONE = 'Done'
}

class Site {
    @Property.string({ displayName: 'Street' })
    street!: string;

    @Property.string({ displayName: 'City' })
    city!: string;
}

const OFFICES: Site[] = [{ street: 'Main street 1', city: 'Berlin' }, { street: 'Harbour road 5', city: 'Hamburg' }];

// a property of every kind of field, on three tabs.
class Project {
    @Property.string({ displayName: 'Id', omitForCreate: true, readonly: true, defaultWidths: [12, 12, 12] })
    id!: string;

    @Property.string({ displayName: 'Name', minLength: 3, position: { row: 1, order: 1 } })
    name!: string;

    @Property.string({ displayName: 'Status', enum: ProjectStatus, default: ProjectStatus.PLANNED, position: { row: 1, order: 2 } })
    status!: ProjectStatus;

    @Property.string({ displayName: 'Client', displayStyle: 'autocomplete', options: ['ACME', 'Atlas', 'Harbor'], required: false })
    client?: string;

    @Property.string({ displayName: 'Description', displayStyle: 'textarea', required: false, defaultWidths: [12, 12, 12] })
    description?: string;

    @Property.number({ displayName: 'Budget', description: 'In euros', min: 0, required: false })
    budget?: number;

    @Property.number({ displayName: 'Progress', displayStyle: 'slider', format: 'integer', min: 0, max: 100 })
    progress!: number;

    @Property.date({ displayName: 'Starts', position: { tab: 2, tabName: 'Schedule', row: 1 } })
    startsAt!: Date;

    @Property.date({ displayName: 'Ends', after: project => project.startsAt, position: { tab: 2, row: 1 } })
    endsAt!: Date;

    @Property.dateRange({ displayName: 'Freeze', description: 'No releases in this time', required: false, position: { tab: 2, row: 4 } })
    freeze?: DateRange;

    @Property.boolean({ displayName: 'Public', displayStyle: 'switch', position: { tab: 2, row: 2 } })
    public!: boolean;

    @Property.boolean({ displayName: 'Reviewed by legal', mustBeChecked: project => project.public === true, position: { tab: 2, row: 2 } })
    reviewed!: boolean;

    @Property.string({
        displayName: 'Access code',
        description: 'For guests of the preview',
        password: true,
        required: false,
        position: { tab: 2, row: 3 }
    })
    accessCode?: string;

    @Property.object({ displayName: 'Site', cls: () => Site, position: { tab: 3, tabName: 'Location', row: 1 } })
    site!: Site;

    // optional: its fields are only required once one has a value
    @Property.object({ displayName: 'Second site', cls: () => Site, required: false, position: { tab: 3, row: 3 } })
    secondSite?: Site;

    @Property.object({
        displayName: 'Office',
        cls: () => Site,
        displayStyle: 'dropdown',
        options: OFFICES.map(office => ({ label: office.city, value: office })),
        position: { tab: 3, row: 2 }
    })
    office!: Site;
}

@Component({
    selector: 'ngx-project-form',
    templateUrl: './entity-form.stories.html',
    imports: [FormComponent, EntityFormComponent, ButtonComponent]
})
class ProjectFormComponent {
    readonly mode: InputSignal<EntityFormMode> = input<EntityFormMode>('create');
    readonly problems: InputSignal<ValidationProblem[]> = input<ValidationProblem[]>([]);
    readonly initial: InputSignal<Partial<Project>> = input(EntityUtilities.resolveDefaults(Project));

    readonly entity: EntityClass<Project> = Project;
    readonly value: WritableSignal<Partial<Project>> = linkedSignal(() => this.initial());
    readonly saved: WritableSignal<boolean> = signal(false);
}

const EXISTING: Partial<Project> = {
    id: '3f1c2a9e-0b7d-4c55-9a51-6c1e8f2d4b70',
    name: 'Website',
    status: ProjectStatus.RUNNING,
    progress: 40,
    startsAt: new Date(2026, 2, 1),
    endsAt: new Date(2026, 5, 30),
    public: false,
    reviewed: false,
    site: { street: 'Elm street 2', city: 'Munich' },
    // a copy, like the json of a server, which the select shows as its option
    office: { street: 'Harbour road 5', city: 'Hamburg' }
};

const meta: Meta<EntityFormComponent<Project>> = {
    title: 'Entity/Form',
    component: EntityFormComponent
};
export default meta;

type Story = StoryObj<EntityFormComponent<Project>>;

export const Create: Story = {
    render: () => ({ template: '<ngx-project-form />', moduleMetadata: { imports: [ProjectFormComponent] } })
};

// the id the server set shows, read only.
export const Update: Story = {
    render: () => ({
        props: { existing: EXISTING },
        template: '<ngx-project-form mode="update" [initial]="existing" />',
        moduleMetadata: { imports: [ProjectFormComponent] }
    })
};

// what zibri answered for the values it refused.
export const WithProblems: Story = {
    render: () => ({
        props: { existing: EXISTING, problems: [{ key: 'name', code: 'unique', message: 'A project with this name exists already.' }] },
        template: '<ngx-project-form mode="update" [initial]="existing" [problems]="problems" />',
        moduleMetadata: { imports: [ProjectFormComponent] }
    })
};