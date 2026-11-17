import { HttpInterceptorFn, HttpRequest, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { afterNextRender, Component, computed, inject, Injectable, input, InputSignal, Signal } from '@angular/core';
import { provideRouter, Router, RouterOutlet, Routes, withHashLocation } from '@angular/router';
import { EntityClass, Property } from '@service-soft/ngx-entity/entity';
import { EntityRouteUtilities } from '@service-soft/ngx-entity/routes';
import { EntityService } from '@service-soft/ngx-entity/service';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { from } from 'rxjs';
import { PaginationResult } from 'zibri-contract';

import { EntityTableColumnInput } from './entity-table-column.model';
import { EntityTableEdit } from './entity-table-edit.type';
import { EntityTableComponent } from './entity-table.component';

enum TaskStatus {
    OPEN = 'Open',
    RUNNING = 'Running',
    DONE = 'Done'
}

class Task {
    // the server sets it.
    @Property.string({ displayName: 'Id', omitForCreate: true, readonly: true })
    id!: string;

    @Property.string({ displayName: 'Title' })
    title!: string;

    @Property.string({ displayName: 'Status', enum: TaskStatus })
    status!: TaskStatus;

    @Property.number({ displayName: 'Hours' })
    hours!: number;

    @Property.boolean({ displayName: 'Billable' })
    billable!: boolean;

    @Property.date({ displayName: 'Due' })
    dueAt!: Date;
}

type TaskFilter = { title: 'iLike', status: 'oneOf', billable: 'equals' };
type TaskOrder = { title: true, hours: true, dueAt: true };

@Injectable({ providedIn: 'root' })
class TaskService extends EntityService<Task, TaskFilter, TaskOrder> {
    readonly entity: EntityClass<Task> = Task;
    readonly baseUrl: string = '/api/tasks';
    override readonly filter: TaskFilter = { title: 'iLike', status: 'oneOf', billable: 'equals' };
    override readonly order: TaskOrder = { title: true, hours: true, dueAt: true };
}

const TITLES: string[] = ['Write the docs', 'Fix the login', 'Plan the release', 'Review the design', 'Update the dependencies'];
const STATUSES: TaskStatus[] = [TaskStatus.OPEN, TaskStatus.RUNNING, TaskStatus.DONE];

// what the server stores: json, so the dates are strings.
const TASKS: Record<string, string | number | boolean>[] = Array.from({ length: 23 }, (_, index) => ({
    id: `task-${index + 1}`,
    title: `${TITLES[index % TITLES.length]} ${Math.floor(index / TITLES.length) + 1}`,
    status: STATUSES[index % STATUSES.length] ?? TaskStatus.OPEN,
    hours: ((index * 37) % 120) / 4,
    billable: index % 3 !== 0,
    dueAt: new Date(Date.UTC(2026, index % 12, ((index * 7) % 28) + 1)).toISOString()
}));

// answers like the findAll of a CrudController of zibri with this filter and order config.
function answerPage(tasks: Record<string, string | number | boolean>[], request: HttpRequest<unknown>): PaginationResult<object> {
    const filter: Record<string, unknown> = JSON.parse(request.params.get('filter') ?? '{}') as Record<string, unknown>;
    const order: Record<string, string> = JSON.parse(request.params.get('order') ?? '{}') as Record<string, string>;
    const page: number = Number(request.params.get('page'));
    const limit: number = Number(request.params.get('limit'));
    const title: unknown = filter['title'];
    const statuses: unknown = filter['status'];
    const matching: Record<string, string | number | boolean>[] = tasks
        .filter(task => typeof title !== 'string' || String(task['title']).toLowerCase()
            .includes(title.toLowerCase()))
        .filter(task => !Array.isArray(statuses) || statuses.includes(task['status']))
        .filter(task => filter['billable'] == undefined || task['billable'] === filter['billable']);
    const [key, direction] = Object.entries(order)[0] ?? [];
    const sorted: Record<string, string | number | boolean>[] = key == undefined
        ? matching
        : [...matching].sort((a, b) => {
            const compared: number = String(a[key]).localeCompare(String(b[key]), undefined, { numeric: true });
            return direction === 'DESC' ? -compared : compared;
        });
    return { items: sorted.slice((page - 1) * limit, page * limit), totalAmount: matching.length };
}

// creates, changes and deletes like the other routes of the controller, in a copy of the tasks for each story.
function answer(tasks: Record<string, string | number | boolean>[], request: HttpRequest<unknown>): object | undefined {
    const id: string | undefined = request.url.split('/')[3];
    const body: Record<string, string | number | boolean> = typeof request.body === 'object' && request.body != undefined
        ? Object.fromEntries(Object.entries(request.body).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]))
        : {};
    const index: number = tasks.findIndex(task => task['id'] === id);
    switch (request.method) {
        case 'POST': {
            const created: Record<string, string | number | boolean> = { ...body, id: `task-${tasks.length + 1}` };
            tasks.unshift(created);
            return created;
        }
        case 'PATCH': {
            tasks[index] = { ...tasks[index], ...body };
            return tasks[index];
        }
        case 'DELETE': {
            tasks.splice(index, 1);
            return undefined;
        }
        default: {
            // one task by its id, like the page that edits it loads it, or a page of them
            return id == undefined ? answerPage(tasks, request) : tasks[index];
        }
    }
}

// the route an app adds for the import: creates the tasks of the json file and answers them.
async function answerImport(tasks: Record<string, string | number | boolean>[], body: FormData): Promise<object> {
    const file: FormDataEntryValue | null = body.get('import');
    const imported: unknown = file instanceof File ? JSON.parse(await file.text()) : [];
    const created: Record<string, string | number | boolean>[] = (Array.isArray(imported) ? imported : [])
        .map((task: Record<string, string | number | boolean>, index) => ({ ...task, id: `task-${tasks.length + index + 1}` }));
    tasks.unshift(...created);
    return created;
}

// the import reads its file, which takes a promise.
async function answerRequest(
    tasks: Record<string, string | number | boolean>[],
    request: HttpRequest<unknown>
): Promise<HttpResponse<unknown>> {
    const body: object | undefined = request.body instanceof FormData ? await answerImport(tasks, request.body) : answer(tasks, request);
    return new HttpResponse({ status: 200, body });
}

function provideBackend(tasks: Record<string, string | number | boolean>[]): ReturnType<typeof applicationConfig> {
    const stored: Record<string, string | number | boolean>[] = structuredClone(tasks);
    const backend: HttpInterceptorFn = request => from(answerRequest(stored, request));
    return applicationConfig({ providers: [provideHttpClient(withInterceptors([backend]))] });
}

@Component({
    selector: 'ngx-task-table',
    template: `
        <ngx-entity-table label="Tasks" [service]="service" [columns]="columns" [canExport]="selectable()" [edit]="edit()"
            [canCreate]="editable()" [canDelete]="editable()" [canImport]="editable()" />
    `,
    imports: [EntityTableComponent]
})
class TaskTableComponent {
    readonly selectable: InputSignal<boolean> = input(false);
    // where the tasks are created and edited, none for a table that only shows them.
    readonly edit: InputSignal<EntityTableEdit | undefined> = input<EntityTableEdit>();
    readonly editable: Signal<boolean> = computed(() => this.edit() != undefined);
    readonly service: TaskService = inject(TaskService);
    readonly columns: EntityTableColumnInput<Task>[] = ['title', 'status', 'hours', 'billable', 'dueAt'];
}

// the route of the table, which creates and edits on the pages next to it.
@Component({ selector: 'ngx-task-table-page', template: '<ngx-task-table edit="page" />', imports: [TaskTableComponent] })
class TaskTablePageComponent {}

const PAGE_ROUTES: Routes = [
    {
        path: 'tasks',
        children: [
            { path: '', component: TaskTablePageComponent },
            ...EntityRouteUtilities.resolveRoutes(TaskService, { createTitle: 'New task', editTitle: 'Edit task' })
        ]
    },
    { path: '**', redirectTo: 'tasks' }
];

// an app with the routes of the table and its pages, which starts at the url of the story.
@Component({ selector: 'ngx-task-pages', template: '<router-outlet />', imports: [RouterOutlet] })
class TaskPagesComponent {
    readonly url: InputSignal<string> = input.required<string>();

    constructor() {
        const router: Router = inject(Router);
        afterNextRender(() => void router.navigateByUrl(this.url()));
    }
}

function renderPages(url: string): ReturnType<NonNullable<Story['render']>> {
    return { props: { url }, template: '<ngx-task-pages [url]="url" />', moduleMetadata: { imports: [TaskPagesComponent] } };
}

// the hash keeps the router off the path of the iframe storybook renders in.
const PAGE_ROUTER: ReturnType<typeof applicationConfig> = applicationConfig({
    providers: [provideRouter(PAGE_ROUTES, withHashLocation())]
});

const meta: Meta<EntityTableComponent<Task>> = {
    title: 'Entity/Table',
    component: EntityTableComponent
};
export default meta;

type Story = StoryObj<EntityTableComponent<Task>>;

export const Default: Story = {
    decorators: [provideBackend(TASKS)],
    render: () => ({ template: '<ngx-task-table />', moduleMetadata: { imports: [TaskTableComponent] } })
};

// creates, edits and deletes the tasks in dialogs, and imports them from a json file.
export const Editable: Story = {
    decorators: [provideBackend(TASKS)],
    render: () => ({ template: '<ngx-task-table edit="dialog" />', moduleMetadata: { imports: [TaskTableComponent] } })
};

// creates and edits the tasks on pages of their own, at tasks/new and tasks/:id, and goes back to the table after saving.
export const EditableOnPages: Story = {
    decorators: [provideBackend(TASKS), PAGE_ROUTER],
    render: () => renderPages('/tasks')
};

// the page that creates a task, with the title of its route as its heading.
export const CreatePage: Story = {
    decorators: [provideBackend(TASKS), PAGE_ROUTER],
    render: () => renderPages('/tasks/new')
};

// the page that edits a task, once it is loaded.
export const EditPage: Story = {
    decorators: [provideBackend(TASKS), PAGE_ROUTER],
    render: () => renderPages('/tasks/task-1')
};

// exports the selected tasks.
export const Selectable: Story = {
    decorators: [provideBackend(TASKS)],
    render: () => ({ template: '<ngx-task-table [selectable]="true" />', moduleMetadata: { imports: [TaskTableComponent] } })
};

export const Empty: Story = {
    decorators: [provideBackend([])],
    render: () => ({ template: '<ngx-task-table />', moduleMetadata: { imports: [TaskTableComponent] } })
};