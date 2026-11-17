import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Log, LogContext, LogLevel, PaginationResult } from 'zibri-contract';

import { LogHistoryComponent } from './log-history.component';

function createLog(id: string, level: LogLevel, createdAt: string, message: string, context: Partial<LogContext> = {}): Log {
    return {
        id,
        level,
        application: 'Website',
        message,
        context: { origin: '/checkout', ...context },
        createdAt,
        cleanupAt: '2026-11-01T00:00:00'
    };
}

// a page of logs as the backend answers it, newest first.
const LOGS: Log[] = [
    {
        ...createLog('3', LogLevel.ERROR, '2026-10-01T11:00:00', 'Cannot read total', {
            metadata: { orderId: 1001 },
            error: {
                name: 'TypeError',
                paragraphs: ['Cannot read total', '    caused by Error:', '    No cart'],
                stackTrace: ['TypeError: Cannot read total', '    at checkout (main.js:1:1)']
            }
        })
    },
    // a log zibri wrote itself, which has no application, from the file that logged it
    { ...createLog('1', LogLevel.INFO, '2026-10-01T09:00:00', 'Started', { origin: 'src/main.ts' }), application: undefined }
];

@Component({
    selector: 'ngx-host',
    template: '<ngx-log-history logsBaseUrl="/api/logs" [applications]="[\'Api\', \'Website\']" />',
    imports: [LogHistoryComponent]
})
class HostComponent {}

// answers the request for a page of logs, and renders it.
async function flushLogs(
    fixture: ComponentFixture<HostComponent>,
    http: HttpTestingController,
    page: PaginationResult<Log> = { items: LOGS, totalAmount: LOGS.length }
): Promise<TestRequest> {
    // a request that is still open keeps the fixture from becoming stable, so it is answered first.
    TestBed.tick();
    const request: TestRequest = http.expectOne(({ method, url }) => method === 'GET' && url === '/api/logs');
    request.flush(page);
    await fixture.whenStable();
    return request;
}

async function render(page?: PaginationResult<Log>): Promise<[ComponentFixture<HostComponent>, HTMLElement, HttpTestingController, TestRequest]> {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    const http: HttpTestingController = TestBed.inject(HttpTestingController);
    const request: TestRequest = await flushLogs(fixture, http, page);
    return [fixture, fixture.nativeElement as HTMLElement, http, request];
}

// the query of a request, a list of values for each parameter.
function getQuery(request: TestRequest): Record<string, string[]> {
    const params: TestRequest['request']['params'] = request.request.params;
    return Object.fromEntries(params.keys().map(key => [key, params.getAll(key) ?? []]));
}

function findButton(root: HTMLElement, name: string): HTMLButtonElement | undefined {
    return [...root.querySelectorAll('button')].find(button => (button.getAttribute('aria-label') ?? button.textContent.trim()) === name);
}

// the parts of each entry, which are separated by a gap instead of spaces.
function getEntries(root: HTMLElement): string[][] {
    return [...root.querySelectorAll('ngx-log-entry')].map(entry => {
        return [...entry.querySelectorAll(':scope > div > *, :scope > p, :scope > pre, ui-summary, ui-details pre')]
            .map(part => part.textContent.replaceAll(/\s+/g, ' ').trim());
    });
}

describe('LogHistoryComponent', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test('loads the first page without debug logs, and shows each log with its origin, metadata and error', async () => {
        const [, root, , request] = await render();

        expect(getQuery(request)).toEqual({ page: ['1'], limit: ['10'], levels: ['4', '3', '2', '1'] });
        expect(getEntries(root)).toEqual([
            [
                'Error',
                'Website',
                '/checkout',
                '2026-10-01 11:00:00.000',
                // the paragraphs keep their line breaks, which the helper removes
                'TypeError: Cannot read total caused by Error: No cart',
                '{ "orderId": 1001 }',
                'Stack trace',
                'TypeError: Cannot read total at checkout (main.js:1:1)'
            ],
            ['Info', 'src/main.ts', '2026-10-01 09:00:00.000', 'Started']
        ]);
        expect(root.querySelector('time')?.getAttribute('datetime')).toBe(new Date('2026-10-01T11:00:00').toISOString());
    });

    test('sends the filters with the request, and starts over at the first page when they change', async () => {
        const [fixture, root, http] = await render({ items: LOGS, totalAmount: 25 });
        findButton(root, 'Page 3')?.click();
        expect(getQuery(await flushLogs(fixture, http))['page']).toEqual(['3']);

        findButton(root, 'Debug')?.click();
        expect(getQuery(await flushLogs(fixture, http))).toEqual({ page: ['1'], limit: ['10'], levels: ['4', '3', '2', '1', '0'] });

        const website: HTMLInputElement | undefined = [...root.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')]
            .find(checkbox => checkbox.labels?.[0]?.textContent.trim() === 'Website');
        website?.click();
        expect(getQuery(await flushLogs(fixture, http))['applications']).toEqual(['Website']);

        const search: HTMLInputElement = root.querySelector('input[type="search"]') ?? document.createElement('input');
        search.value = ' checkout ';
        search.dispatchEvent(new Event('input'));
        expect(getQuery(await flushLogs(fixture, http))['search']).toEqual(['checkout']);
    });

    test('loads the logs of every level while none is selected, and says when none matches', async () => {
        const [fixture, root, http] = await render();
        for (const level of ['Critical', 'Error', 'Warning', 'Info']) {
            findButton(root, level)?.click();
        }
        const request: TestRequest = await flushLogs(fixture, http, { items: [], totalAmount: 0 });

        expect(getQuery(request)).toEqual({ page: ['1'], limit: ['10'] });
        expect(root.querySelector('li')?.textContent.trim()).toBe('No log matches the filters.');
        expect(root.querySelector('nav')).toBeNull();
    });

    test('loads the page again with reload, and every second in live mode', async () => {
        vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
        const [fixture, root, http] = await render();

        findButton(root, 'Reload')?.click();
        await flushLogs(fixture, http, { items: [createLog('5', LogLevel.INFO, '2026-10-02T09:00:00', 'Restarted'), ...LOGS], totalAmount: 3 });
        expect(getEntries(root)[0]).toContain('Restarted');

        findButton(root, 'Live mode')?.click();
        TestBed.tick();
        vi.advanceTimersByTime(1000);
        await flushLogs(fixture, http);
        expect(getEntries(root)[0]).not.toContain('Restarted');

        findButton(root, 'Live mode')?.click();
        TestBed.tick();
        vi.advanceTimersByTime(3000);
        TestBed.tick();
        http.verify();
    });

    test('says when the logs couldn\'t be loaded', async () => {
        TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
        const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
        TestBed.tick();
        TestBed.inject(HttpTestingController).expectOne(({ url }) => url === '/api/logs')
            .flush('Unavailable', { status: 503, statusText: 'Service Unavailable' });
        await fixture.whenStable();

        expect((fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent.trim()).toBe('The logs couldn\'t be loaded.');
    });
});