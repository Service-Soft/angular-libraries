import { HttpInterceptorFn, HttpRequest, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { Component, inject, Injectable, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { EntityEditorComponent } from '@service-soft/ngx-entity/editor';
import { EntityClass, Property } from '@service-soft/ngx-entity/entity';
import { provideEntityFields } from '@service-soft/ngx-entity/field';
import { EntityService } from '@service-soft/ngx-entity/service';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { of } from 'rxjs';
import { PaginationResult } from 'zibri-contract';

import { EntityHasManyFieldComponent } from './entity-has-many-field.component';

class Team {
    @Property.string({ displayName: 'Id', omitForCreate: true, readonly: true })
    id!: string;

    @Property.string({ displayName: 'Name' })
    name!: string;
}

class Task {
    @Property.string({ displayName: 'Id', omitForCreate: true, readonly: true, display: false })
    id!: string;

    @Property.string({ displayName: 'Title' })
    title!: string;

    @Property.string({ displayName: 'Project', format: 'uuid' })
    projectId!: string;

    @Property.manyToOne({
        displayName: 'Project',
        target: () => Project,
        joinColumn: 'projectId',
        service: () => ProjectService,
        label: 'name'
    })
    project?: Project;

    @Property.string({ displayName: 'Team', format: 'uuid' })
    teamId!: string;

    @Property.manyToOne({ displayName: 'Team', target: () => Team, joinColumn: 'teamId', service: () => TeamService, label: 'name' })
    team?: Team;
}

class Project {
    @Property.string({ displayName: 'Id', omitForCreate: true, readonly: true, display: false })
    id!: string;

    @Property.string({ displayName: 'Name' })
    name!: string;

    @Property.oneToMany({
        displayName: 'Tasks',
        target: () => Task,
        inverseSide: 'project',
        service: () => TaskService,
        columns: ['title', 'team']
    })
    tasks?: Task[];
}

type TeamFilter = { name: 'iLike' };

@Injectable({ providedIn: 'root' })
class TeamService extends EntityService<Team, TeamFilter> {
    readonly entity: EntityClass<Team> = Team;
    readonly baseUrl: string = '/api/teams';
    override readonly filter: TeamFilter = { name: 'iLike' };
}

type ProjectFilter = { name: 'iLike' };

@Injectable({ providedIn: 'root' })
class ProjectService extends EntityService<Project, ProjectFilter> {
    readonly entity: EntityClass<Project> = Project;
    readonly baseUrl: string = '/api/projects';
    override readonly filter: ProjectFilter = { name: 'iLike' };
}

type TaskFilter = { projectId: 'equals' };

@Injectable({ providedIn: 'root' })
class TaskService extends EntityService<Task, TaskFilter> {
    readonly entity: EntityClass<Task> = Task;
    readonly baseUrl: string = '/api/tasks';
    override readonly filter: TaskFilter = { projectId: 'equals' };
}

type Row = Record<string, string>;

type Tables = Record<string, Row[]>;

const TABLES: Tables = {
    teams: [{ id: 'team-1', name: 'Docs' }, { id: 'team-2', name: 'Design' }, { id: 'team-3', name: 'Infrastructure' }],
    projects: [{ id: 'project-1', name: 'Website' }, { id: 'project-2', name: 'App' }],
    tasks: [
        { id: 'task-1', title: 'Write the docs', projectId: 'project-1', teamId: 'team-1' },
        { id: 'task-2', title: 'Draw the logo', projectId: 'project-1', teamId: 'team-2' }
    ]
};

// a task is read with its team and project, like zibri's defaultRelations.
function includeRelations(tables: Tables, row: Row): object {
    const team: Row | undefined = tables['teams']?.find(candidate => candidate['id'] === row['teamId']);
    const project: Row | undefined = tables['projects']?.find(candidate => candidate['id'] === row['projectId']);
    return row['title'] == undefined ? row : { ...row, team, project };
}

function answerPage(tables: Tables, rows: Row[], request: HttpRequest<unknown>): PaginationResult<object> {
    const filter: Record<string, unknown> = JSON.parse(request.params.get('filter') ?? '{}') as Record<string, unknown>;
    const matching: Row[] = rows.filter(row => Object.entries(filter).every(([key, value]) => {
        const text: string = row[key] ?? '';
        // the iLike of a name, the equals of the joinColumn of a task
        return key === 'name' ? text.toLowerCase().includes(String(value).toLowerCase()) : text === value;
    }));
    return { items: matching.map(row => includeRelations(tables, row)), totalAmount: matching.length };
}

// answers like the CrudControllers of zibri for teams, projects and tasks.
function answer(tables: Tables, request: HttpRequest<unknown>): object | undefined {
    const [, , table = '', id] = request.url.split('/');
    const rows: Row[] = tables[table] ?? [];
    const body: Row = typeof request.body === 'object' && request.body != undefined
        ? Object.fromEntries(Object.entries(request.body).map(([key, value]) => [key, String(value)]))
        : {};
    const index: number = rows.findIndex(row => row['id'] === id);
    switch (request.method) {
        case 'POST': {
            const created: Row = { ...body, id: `${table}-${rows.length + 1}` };
            rows.push(created);
            return includeRelations(tables, created);
        }
        case 'PATCH': {
            rows[index] = { ...rows[index], ...body };
            return includeRelations(tables, rows[index] ?? {});
        }
        case 'DELETE': {
            rows.splice(index, 1);
            return undefined;
        }
        default: {
            return id == undefined ? answerPage(tables, rows, request) : includeRelations(tables, rows[index] ?? {});
        }
    }
}

function provideBackend(): ReturnType<typeof applicationConfig> {
    const tables: Tables = structuredClone(TABLES);
    const backend: HttpInterceptorFn = request => of(new HttpResponse({ status: 200, body: answer(tables, request) }));
    return applicationConfig({
        providers: [
            provideHttpClient(withInterceptors([backend])),
            // the field of a relation to many entities comes from the app, see the README.
            provideEntityFields({ hasMany: async () => await Promise.resolve(EntityHasManyFieldComponent) })
        ]
    });
}

const PROJECT: Project = { id: 'project-1', name: 'Website' };

// read with its team, which the field shows without loading it.
const TASK: Task = {
    id: 'task-1',
    title: 'Write the docs',
    projectId: 'project-1',
    teamId: 'team-1',
    team: { id: 'team-1', name: 'Docs' }
};

@Component({
    selector: 'ngx-relations-editor',
    template: `
        @if (project()) {
            <ngx-entity-editor [service]="projectService" [entity]="projectEntity" title="Edit project" />
        } @else {
            <ngx-entity-editor [service]="taskService" [entity]="taskEntity" title="Edit task" (saved)="savedTask.set($event)" />
            <!-- the team the server saved, which it only knows by the id it was sent -->
            <p class="mt-4 text-body-sm text-on-surface-variant" role="status">{{ savedTask()?.team?.name ?? '' }}</p>
        }
    `,
    imports: [EntityEditorComponent]
})
class RelationsEditorComponent {
    readonly project: InputSignal<boolean> = input(false);
    readonly projectService: ProjectService = inject(ProjectService);
    readonly taskService: TaskService = inject(TaskService);
    readonly projectEntity: Project = PROJECT;
    readonly taskEntity: Task = TASK;
    readonly savedTask: WritableSignal<Task | undefined> = signal(undefined);
}

const meta: Meta<EntityHasManyFieldComponent<Project>> = {
    title: 'Entity/Relations',
    component: EntityHasManyFieldComponent,
    decorators: [provideBackend()]
};
export default meta;

type Story = StoryObj<EntityHasManyFieldComponent<Project>>;

// the tasks of the project, in a table that creates, edits and deletes them.
export const HasMany: Story = {
    render: () => ({ template: '<ngx-relations-editor [project]="true" />', moduleMetadata: { imports: [RelationsEditorComponent] } })
};

// the team and project of a task, picked by searching them.
export const ManyToOne: Story = {
    render: () => ({ template: '<ngx-relations-editor />', moduleMetadata: { imports: [RelationsEditorComponent] } })
};