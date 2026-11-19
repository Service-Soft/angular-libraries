import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component, inject, Injectable, InjectionToken, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EntityClass, Property } from '@service-soft/ngx-entity/entity';
import { EntityService } from '@service-soft/ngx-entity/service';
import { EntityTableComponent } from '@service-soft/ngx-entity/table';
import { offlineInterceptor, OfflineService, provideOfflineConfig } from '@service-soft/ngx-pwa/offline';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { PaginationResult } from 'zibri-contract';

import { provideOfflineEntities } from './offline-entities.provider';

class Task {
    @Property.string({ displayName: 'Id', omitForCreate: true })
    id!: string;

    @Property.string({ displayName: 'Title' })
    title!: string;
}

@Injectable({ providedIn: 'root' })
class TaskService extends EntityService<Task> {
    readonly entity: EntityClass<Task> = Task;
    readonly baseUrl: string = '/api/tasks';

    override getLabel(task: Partial<Task>): string {
        return task.title ?? 'A task';
    }
}

// the tenant the user acts in, like the AuthService of ngx-auth tells it.
const TENANT: InjectionToken<WritableSignal<string | undefined>> = new InjectionToken('TENANT', { providedIn: 'root', factory: () => signal('tenant-a') });

const LOADED: Task[] = [{ id: 'a1', title: 'Write the docs' }, { id: 'a2', title: 'Pay rent' }];

@Component({
    selector: 'ngx-host',
    template: '<ngx-entity-table #table label="Tasks" [service]="service" [columns]="[\'title\']" [pageSize]="5" />',
    imports: [EntityTableComponent]
})
class HostComponent {
    readonly service: TaskService = inject(TaskService);
    readonly table: Signal<EntityTableComponent<Task>> = viewChild.required('table');
}

function setConnection(online: boolean): void {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
    window.dispatchEvent(new Event(online ? 'online' : 'offline'));
}

// the page the table asks for, answered by the server, or by the offline cache of ngx-pwa while offline.
async function answer(fixture: ComponentFixture<HostComponent>, items: Task[] = LOADED): Promise<void> {
    TestBed.tick();
    await new Promise(resolve => setTimeout(resolve));
    const request: TestRequest = TestBed.inject(HttpTestingController).expectOne(candidate => candidate.url === '/api/tasks');
    request.flush({ items, totalAmount: items.length });
    await fixture.whenStable();
}

function findTitles(fixture: ComponentFixture<HostComponent>): string[] {
    const root: HTMLElement = fixture.nativeElement as HTMLElement;
    return [...root.querySelectorAll('tbody td span:last-child')].map(cell => cell.textContent.trim());
}

async function resolvePage(page: number): Promise<PaginationResult<Task>> {
    const resolved: Promise<PaginationResult<Task>> = TestBed.inject(TaskService).resolvePage({ page, limit: 2 });
    const request: TestRequest = TestBed.inject(HttpTestingController).expectOne(candidate => candidate.url === '/api/tasks');
    request.flush({ items: LOADED, totalAmount: 4 });
    return await resolved;
}

describe('OfflineEntityWrites', () => {
    afterEach(() => {
        localStorage.clear();
        vi.restoreAllMocks();
        TestBed.inject(HttpTestingController).verify();
    });

    test('keeps what a table creates, changes and deletes offline, and shows it in the table of the tenant it was made in', async () => {
        setConnection(true);
        TestBed.configureTestingModule({
            providers: [
                provideHttpClient(withInterceptors([offlineInterceptor])),
                provideHttpClientTesting(),
                provideRouter([]),
                provideOfflineConfig({ headers: { 'x-tenant-id': () => inject(TENANT)() } }),
                provideOfflineEntities()
            ]
        });
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
        await answer(fixture);
        expect(findTitles(fixture)).toEqual(['Write the docs', 'Pay rent']);

        setConnection(false);
        const service: TaskService = TestBed.inject(TaskService);
        const created: Task = await service.create({ title: 'Buy milk' });
        expect(created.id).toMatch(/^offline-/);
        const [docs, rent] = LOADED;
        await service.update(docs, { title: 'Write the README' });
        await service.delete(rent);
        fixture.componentInstance.table().reload();
        await answer(fixture);
        expect(findTitles(fixture)).toEqual(['Write the README', 'Buy milk']);
        // what the sync dialog shows of them
        const displayValues: string[] = TestBed.inject(OfflineService).cachedRequests()
            .map(request => request.displayValue);
        expect(displayValues).toEqual(['Buy milk', 'Write the README', 'Pay rent']);

        // one created, one deleted: as many as the server has, and the created one only on the first page
        expect((await resolvePage(1)).totalAmount).toBe(4);
        expect((await resolvePage(1)).items.map(task => task.title)).toEqual(['Write the README', 'Buy milk']);
        expect((await resolvePage(2)).items.map(task => task.title)).toEqual(['Write the README']);

        TestBed.inject(TENANT).set('tenant-b');
        fixture.componentInstance.table().reload();
        await answer(fixture);
        expect(findTitles(fixture)).toEqual(['Write the docs', 'Pay rent']);
    });

    test('changes nothing without provideOfflineEntities', async () => {
        setConnection(false);
        TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([offlineInterceptor])), provideHttpClientTesting()] });
        const created: Promise<Task> = TestBed.inject(TaskService).create({ title: 'Buy milk' });
        // sent, and failing like without ngx-pwa
        const request: TestRequest = TestBed.inject(HttpTestingController).expectOne('/api/tasks');
        request.error(new ProgressEvent('error'));
        await expect(created).rejects.toThrow();
        expect(TestBed.inject(OfflineService).cachedRequests()).toEqual([]);
    });
});