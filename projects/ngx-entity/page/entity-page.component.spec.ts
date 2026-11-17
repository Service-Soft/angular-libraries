// the routes of EntityRouteUtilities, with the page loaded like an app loads it. Its dialogs render into the body.
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { EntityClass, Property } from '@service-soft/ngx-entity/entity';
import { EntityRouteUtilities } from '@service-soft/ngx-entity/routes';
import { EntityService } from '@service-soft/ngx-entity/service';
import { DialogTestingUtilities } from 'testing/dialog';
import { FormTestingUtilities } from 'testing/form';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

class Task {
    @Property.string({ displayName: 'Id', omitForCreate: true, readonly: true })
    id!: string;

    @Property.string({ displayName: 'Title' })
    title!: string;
}

@Injectable({ providedIn: 'root' })
class TaskService extends EntityService<Task> {
    readonly entity: EntityClass<Task> = Task;
    readonly baseUrl: string = '/api/tasks';
}

// the page of the table, which the pages go back to.
@Component({ selector: 'ngx-tasks', template: '<p>The tasks</p>' })
class TasksComponent {}

const TASK: Task = { id: 'a1', title: 'Write the docs' };

async function open(url: string): Promise<[RouterTestingHarness, HttpTestingController]> {
    TestBed.configureTestingModule({
        providers: [
            provideHttpClient(),
            provideHttpClientTesting(),
            provideRouter([{ path: 'tasks', children: [{ path: '', component: TasksComponent }, ...EntityRouteUtilities.resolveRoutes(TaskService, { editTitle: 'Edit task' })] }])
        ]
    });
    const harness: RouterTestingHarness = await RouterTestingHarness.create();
    void harness.navigateByUrl(url);
    return [harness, TestBed.inject(HttpTestingController)];
}

// the page and its fields load their code first.
async function findInput(root: HTMLElement, label: string): Promise<HTMLInputElement> {
    return await vi.waitFor(() => {
        TestBed.tick();
        const element: HTMLLabelElement | undefined = [...root.querySelectorAll('label')].find(candidate => candidate.textContent?.trim().startsWith(label));
        const input: HTMLElement | null = document.getElementById(element?.htmlFor ?? '');
        if (!(input instanceof HTMLInputElement)) {
            throw new TypeError(`No input labelled "${label}".`);
        }
        return input;
    });
}

async function type(root: HTMLElement, label: string, text: string): Promise<void> {
    const input: HTMLInputElement = await findInput(root, label);
    input.value = text;
    input.dispatchEvent(new Event('input'));
    TestBed.tick();
}

async function waitForUrl(url: string): Promise<void> {
    await vi.waitFor(() => {
        TestBed.tick();
        expect(TestBed.inject(Router).url).toBe(url);
    });
}

describe('EntityPageComponent', () => {
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
    });

    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
        removeModalDialogs();
        for (const dialog of document.querySelectorAll('ui-dialog')) {
            dialog.remove();
        }
    });

    test('creates an entity at new, and goes back to the table once it is saved', async () => {
        const [harness, http] = await open('/tasks/new');
        await type(harness.routeNativeElement ?? document.body, 'Title', 'Ship the release');
        // the heading of the page
        expect(FormTestingUtilities.getText(harness.routeNativeElement ?? document.body, 'h1')).toBe('Create');

        FormTestingUtilities.click(harness.routeNativeElement ?? document.body, 'Save');
        const request: TestRequest = await vi.waitFor(() => http.expectOne({ method: 'POST', url: '/api/tasks' }));
        expect(request.request.body).toEqual({ title: 'Ship the release' });
        request.flush({ ...TASK, title: 'Ship the release' });

        await waitForUrl('/tasks');
    });

    test('edits the entity of its id, with the title of its route, and asks before the changes are lost', async () => {
        const [harness, http] = await open('/tasks/a1');
        await vi.waitFor(() => http.expectOne({ method: 'GET', url: '/api/tasks/a1' })).then(request => request.flush(TASK));
        const page: HTMLElement = await vi.waitFor(() => {
            TestBed.tick();
            return harness.routeNativeElement ?? document.body;
        });
        expect((await findInput(page, 'Title')).value).toBe('Write the docs');
        expect(FormTestingUtilities.getText(page, 'h1')).toBe('Edit task');
        await type(page, 'Title', 'Write the README');

        FormTestingUtilities.click(page, 'Cancel');
        await vi.waitFor(() => {
            TestBed.tick();
            expect(document.querySelector('dialog[open] h2')?.textContent).toBe('Discard your changes?');
        });
        FormTestingUtilities.click(document.querySelector('dialog[open]') ?? document, 'Keep editing');
        await new Promise(resolve => setTimeout(resolve));
        expect(TestBed.inject(Router).url).toBe('/tasks/a1');

        FormTestingUtilities.click(page, 'Save');
        const request: TestRequest = await vi.waitFor(() => http.expectOne({ method: 'PATCH', url: '/api/tasks/a1' }));
        expect(request.request.body).toEqual({ title: 'Write the README' });
        request.flush({ ...TASK, title: 'Write the README' });
        // saved, so leaving asks nothing
        await waitForUrl('/tasks');
    });
});