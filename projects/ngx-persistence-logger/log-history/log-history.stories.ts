import { HttpErrorResponse, HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { Observable, of, throwError } from 'rxjs';
import { Log, LogContext, LogLevel, PaginationResult } from 'zibri-contract';

import { LogHistoryComponent } from './log-history.component';

const APPLICATIONS: string[] = ['Api', 'Website', 'Admin'];

function createLog(
    id: string,
    level: LogLevel,
    application: string,
    createdAt: string,
    message: string,
    context: Partial<LogContext> = {}
): Log {
    return { id, level, application, message, context: { origin: '/', ...context }, createdAt, cleanupAt: '2026-11-01T00:00:00' };
}

// every level, from the browser and the backend, with metadata and errors.
const LOGS: Log[] = [
    createLog('1', LogLevel.INFO, 'Api', '2026-10-01T09:00:00.120', 'Started on port 3000', { origin: 'src/index.ts' }),
    createLog('2', LogLevel.DEBUG, 'Website', '2026-10-01T09:05:12.004', 'Rendered the checkout', {
        origin: '/checkout',
        metadata: { items: 2, total: 99.9 }
    }),
    createLog('3', LogLevel.WARN, 'Api', '2026-10-01T09:10:41.530', 'Slow query', {
        origin: 'src/repositories/order.repository.ts',
        metadata: { table: 'orders', milliseconds: 2412 }
    }),
    createLog('4', LogLevel.ERROR, 'Website', '2026-10-01T09:12:03.881', 'Cannot read properties of undefined (reading \'total\')', {
        origin: '/checkout',
        metadata: { orderId: 1001 },
        error: {
            name: 'TypeError',
            paragraphs: ['Cannot read properties of undefined (reading \'total\')'],
            stackTrace: [
                'TypeError: Cannot read properties of undefined (reading \'total\')',
                '    at CheckoutComponent.submit (https://shop.example.com/chunk-checkout.js:12:345)',
                '    at HTMLButtonElement.<anonymous> (https://shop.example.com/main.js:1:2345)'
            ]
        }
    }),
    createLog('5', LogLevel.CRITICAL, 'Admin', '2026-10-01T09:15:00.000', 'The database is unreachable', {
        origin: 'src/data-source.ts',
        error: {
            name: 'Error',
            paragraphs: ['The database is unreachable', '    caused by Error:', '    connect ECONNREFUSED 10.0.0.12:5432'],
            stackTrace: []
        }
    })
];

// more logs than fit on a page.
const MANY_LOGS: Log[] = Array.from({ length: 95 }, (_, index) => {
    const minutes: string = String(index % 60).padStart(2, '0');
    return createLog(`${index + 1}`, LogLevel.INFO, 'Api', `2026-10-01T1${Math.floor(index / 60)}:${minutes}:00`, `Request ${index + 1}`);
});

// answers a page of logs like the endpoint of the README: filtered, newest first.
function answerPage(logs: Log[], request: HttpRequest<unknown>): PaginationResult<Log> {
    const levels: string[] | null = request.params.getAll('levels');
    const applications: string[] | null = request.params.getAll('applications');
    const search: string = request.params.get('search')?.toLowerCase() ?? '';
    const page: number = Number(request.params.get('page'));
    const limit: number = Number(request.params.get('limit'));
    const matching: Log[] = logs
        .filter(log => levels == undefined || levels.includes(String(log.level)))
        .filter(log => applications == undefined || applications.includes(log.application ?? ''))
        .filter(log => log.message.toLowerCase().includes(search))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { items: matching.slice((page - 1) * limit, page * limit), totalAmount: matching.length };
}

// answers the requests of the log history like a backend would.
function provideBackend(answer: (request: HttpRequest<unknown>) => Observable<HttpEvent<unknown>>): ReturnType<typeof applicationConfig> {
    const backend: HttpInterceptorFn = request => answer(request);
    return applicationConfig({ providers: [provideHttpClient(withInterceptors([backend]))] });
}

function respondWith(logs: Log[]): (request: HttpRequest<unknown>) => Observable<HttpEvent<unknown>> {
    return request => of(new HttpResponse({ status: 200, body: answerPage(logs, request) }));
}

const meta: Meta<LogHistoryComponent> = {
    title: 'Persistence logger/Log history',
    component: LogHistoryComponent,
    render: () => ({
        props: { applications: APPLICATIONS },
        template: '<ngx-log-history class="max-w-4xl" logsBaseUrl="/api/logs" [applications]="applications" />'
    })
};
export default meta;

type Story = StoryObj<LogHistoryComponent>;

export const Default: Story = {
    decorators: [provideBackend(respondWith(LOGS))]
};

export const ManyLogs: Story = {
    decorators: [provideBackend(respondWith(MANY_LOGS))]
};

export const NoLogs: Story = {
    decorators: [provideBackend(respondWith([]))]
};

export const LoadingFailed: Story = {
    decorators: [provideBackend(() => throwError(() => new HttpErrorResponse({ status: 503, url: '/api/logs' })))]
};