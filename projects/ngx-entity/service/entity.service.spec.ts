import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EntityClass, Property } from '@service-soft/ngx-entity/entity';
import { HttpTestingUtilities } from 'testing/http';
import { afterEach, describe, expect, test } from 'vitest';
import { PaginationResult } from 'zibri-contract';

import { EntityService } from './entity.service';

class Task {
    @Property.string({ displayName: 'Id', format: 'uuid' })
    id!: string;

    @Property.string({ displayName: 'Title' })
    title!: string;

    @Property.number({ displayName: 'Priority' })
    priority!: number;

    @Property.date({ displayName: 'Due at', required: false })
    dueAt?: Date;
}

// the service checks them against FilterConfig<Task> and OrderConfig<Task>.
type TaskFilter = { title: 'iLike', priority: 'range' };
type TaskOrder = { dueAt: true, priority: true };

@Injectable({ providedIn: 'root' })
class TaskService extends EntityService<Task, TaskFilter, TaskOrder> {
    readonly entity: EntityClass<Task> = Task;
    readonly baseUrl: string = '/api/tasks';
    override readonly filter: TaskFilter = { title: 'iLike', priority: 'range' };
    override readonly order: TaskOrder = { dueAt: true, priority: true };
}

// an entity whose id has another name, which needs an override of getId.
class Country {
    @Property.string({ displayName: 'Code' })
    code!: string;
}

@Injectable({ providedIn: 'root' })
class CountryService extends EntityService<Country> {
    readonly entity: EntityClass<Country> = Country;
    readonly baseUrl: string = '/api/countries';
}

// what the server answers: json, so the dates are strings.
const TASK_JSON: object = { id: 'a1', title: 'Write the docs', priority: 2, dueAt: '2026-03-01T09:00:00.000Z' };
const TASK: Task = { id: 'a1', title: 'Write the docs', priority: 2, dueAt: new Date('2026-03-01T09:00:00.000Z') };

function setup(): [TaskService, HttpTestingController] {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return [TestBed.inject(TaskService), TestBed.inject(HttpTestingController)];
}

describe('EntityService', () => {
    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
    });

    test('resolves a page with its filter and order as json, and turns the dates of the answer into dates', async () => {
        const [service, http] = setup();

        const page: Promise<PaginationResult<Task>> = service.resolvePage({
            page: 2,
            limit: 10,
            filter: { title: 'docs', priority: { from: 2 } },
            order: { dueAt: 'ASC', priority: 'DESC' }
        });
        const request: TestRequest = http.expectOne(candidate => candidate.url === '/api/tasks');
        expect(request.request.method).toBe('GET');
        expect(request.request.params.get('page')).toBe('2');
        expect(request.request.params.get('limit')).toBe('10');
        expect(request.request.params.get('filter')).toBe('{"title":"docs","priority":{"from":2}}');
        expect(request.request.params.get('order')).toBe('{"dueAt":"ASC","priority":"DESC"}');
        request.flush({ items: [TASK_JSON], totalAmount: 11 });

        expect(await page).toEqual({ items: [TASK], totalAmount: 11 });
    });

    test('leaves out a filter and an order that are empty', async () => {
        const [service, http] = setup();

        const page: Promise<PaginationResult<Task>> = service.resolvePage({ page: 1, limit: 10, filter: {}, order: {} });
        const request: TestRequest = http.expectOne(candidate => candidate.url === '/api/tasks');
        expect(request.request.params.keys()).toEqual(['page', 'limit']);
        request.flush({ items: [], totalAmount: 0 });

        expect(await page).toEqual({ items: [], totalAmount: 0 });
    });

    test('resolves one entity by its id', async () => {
        const [service, http] = setup();

        const task: Promise<Task> = service.resolveById('a1');
        http.expectOne({ method: 'GET', url: '/api/tasks/a1' }).flush(TASK_JSON);

        expect(await task).toEqual(TASK);
    });

    test('creates an entity with its values', async () => {
        const [service, http] = setup();

        const task: Promise<Task> = service.create({ title: 'Write the docs', priority: 2 });
        const request: TestRequest = http.expectOne({ method: 'POST', url: '/api/tasks' });
        expect(request.request.body).toEqual({ title: 'Write the docs', priority: 2 });
        request.flush(TASK_JSON);

        expect(await task).toEqual(TASK);
    });

    test('changes an entity by sending only what changed', async () => {
        const [service, http] = setup();

        const task: Promise<Task> = service.update(TASK, { ...TASK, title: 'Write the README', dueAt: new Date('2026-03-01T09:00:00.000Z') });
        const request: TestRequest = http.expectOne({ method: 'PATCH', url: '/api/tasks/a1' });
        expect(request.request.body).toEqual({ title: 'Write the README' });
        request.flush({ ...TASK_JSON, title: 'Write the README' });

        expect(await task).toEqual({ ...TASK, title: 'Write the README' });
    });

    test('deletes an entity', async () => {
        const [service, http] = setup();

        const deleted: Promise<void> = service.delete(TASK);
        HttpTestingUtilities.flushNoContent(http.expectOne({ method: 'DELETE', url: '/api/tasks/a1' }));

        await expect(deleted).resolves.toBeUndefined();
    });

    test('refuses an entity without a string id, which has no route', () => {
        setup();

        expect(() => TestBed.inject(CountryService).getId({ code: 'DE' })).toThrow('An entity of /api/countries has no string id.');
    });
});