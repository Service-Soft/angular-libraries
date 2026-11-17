import { formatDate } from '@angular/common';
import { httpResource, HttpResourceRef } from '@angular/common/http';
import { Component, computed, effect, inject, input, InputSignal, linkedSignal, LOCALE_ID, Signal, signal, WritableSignal } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent } from '@service-soft/ui/icon';
import { InputStringComponent } from '@service-soft/ui/input-string';
import { PaginationComponent } from '@service-soft/ui/pagination';
import { Log, LogLevel, PaginationResult } from 'zibri-contract';

import { ApplicationsFilterComponent } from './applications-filter.component';
import { LevelsFilterComponent } from './levels-filter.component';
import { LogEntryComponent } from './log-entry.component';
import { LogHistoryConfig, LogHistoryLabels } from './log-history-config.model';
import { LOG_HISTORY_CONFIG } from './log-history-config.provider';
import { LogView } from './log-view.model';

const LEVEL_LABEL_CLASSES: string = 'inline-flex items-center rounded-full border px-2.5 py-0.5 text-label';

// filled labels use the -on tokens on their colors, outlined ones colored text on the surface: both are checked pairs.
// The label says the level as text, so the color is never the only cue.
const LEVEL_CLASSES: Record<LogLevel, string> = {
    [LogLevel.CRITICAL]: 'border-transparent bg-error text-on-error',
    [LogLevel.ERROR]: 'border-error text-error',
    [LogLevel.WARN]: 'border-transparent bg-warning text-on-warning',
    [LogLevel.INFO]: 'border-primary text-primary',
    [LogLevel.DEBUG]: 'border-outline text-on-surface-variant'
};

/**
 * The query of a request for a page of logs.
 */
type LogsQuery = Record<string, string | number | readonly (string | number)[]>;

/**
 * Loads the logs of every application from the backend, a page at a time, and shows them, filtered by level,
 * application and a search. Live mode loads the page again every second.
 */
@Component({
    selector: 'ngx-log-history',
    templateUrl: './log-history.component.html',
    imports: [
        ApplicationsFilterComponent,
        ButtonComponent,
        IconComponent,
        InputStringComponent,
        LevelsFilterComponent,
        LogEntryComponent,
        PaginationComponent
    ],
    host: { class: 'block' }
})
export class LogHistoryComponent {
    private readonly config: LogHistoryConfig = inject(LOG_HISTORY_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The url the logs are loaded from with a GET request, which answers a page of them, newest first. It gets the page
     * and the filters as query: page, limit, levels, applications and search.
     */
    readonly logsBaseUrl: InputSignal<string> = input.required<string>();

    /**
     * The applications the user can filter by, like the application of each provideLoggerConfig.
     */
    readonly applications: InputSignal<string[]> = input.required<string[]>();

    /**
     * The texts of the log history.
     */
    protected readonly labels: LogHistoryLabels = this.config.labels;

    /**
     * How many logs a page has.
     */
    protected readonly pageSize: number = this.config.pageSize;

    /**
     * The icon that marks the pressed live mode button.
     */
    protected readonly faCheck: typeof faCheck = faCheck;

    /**
     * The levels whose logs show. While none is selected, the logs of every level show.
     */
    protected readonly selectedLevels: WritableSignal<LogLevel[]> = signal(this.config.levels);

    /**
     * The applications whose logs show. While none is selected, the logs of every application show.
     */
    protected readonly selectedApplications: WritableSignal<string[]> = signal([]);

    /**
     * What the user searches for.
     */
    protected readonly search: WritableSignal<string> = signal('');

    /**
     * Whether the logs are loaded again every second.
     */
    protected readonly liveMode: WritableSignal<boolean> = signal(false);

    /**
     * The page that shows. It starts over when the filters change, but not when live mode loads new logs.
     */
    protected readonly page: WritableSignal<number> = linkedSignal({
        source: () => [this.selectedLevels(), this.selectedApplications(), this.search()],
        computation: () => 1
    });

    /**
     * The page of logs from the backend.
     */
    protected readonly logs: HttpResourceRef<PaginationResult<Log>> = httpResource<PaginationResult<Log>>(
        () => ({ url: this.logsBaseUrl(), params: this.resolveQuery() }),
        { defaultValue: { items: [], totalAmount: 0 } }
    );

    // reading the value of a resource that failed throws, and a reload in live mode keeps the page it had.
    private readonly result: Signal<PaginationResult<Log>> = computed(() => {
        return this.logs.hasValue() ? this.logs.value() : { items: [], totalAmount: 0 };
    });

    /**
     * The logs of the page.
     */
    protected readonly shown: Signal<LogView[]> = computed(() => this.result().items.map(log => this.toView(log)));

    /**
     * How many logs match the filters on all pages together.
     */
    protected readonly totalAmount: Signal<number> = computed(() => this.result().totalAmount);

    constructor() {
        effect(onCleanup => {
            if (!this.liveMode()) {
                return;
            }
            const interval: ReturnType<typeof setInterval> = setInterval(() => this.logs.reload(), this.config.liveModeInterval);
            onCleanup(() => clearInterval(interval));
        });
    }

    /**
     * Turns live mode on or off.
     */
    protected toggleLiveMode(): void {
        this.liveMode.update(liveMode => !liveMode);
    }

    // a filter without a value is left out, which the backend reads as every value. An array is sent as one value per
    // item, like ?levels=3&levels=4, which zibri reads as a list.
    private resolveQuery(): LogsQuery {
        const search: string = this.search().trim();
        return {
            page: this.page(),
            limit: this.pageSize,
            ...this.selectedLevels().length ? { levels: this.selectedLevels() } : {},
            ...this.selectedApplications().length ? { applications: this.selectedApplications() } : {},
            ...search ? { search } : {}
        };
    }

    private toView(log: Log): LogView {
        const createdAt: Date = new Date(log.createdAt);
        const error: Log['context']['error'] = log.context.error;
        const metadata: Log['context']['metadata'] = log.context.metadata;
        return {
            id: log.id,
            createdAt: formatDate(createdAt, this.config.dateFormat, this.locale),
            createdAtIso: createdAt.toISOString(),
            level: log.level,
            levelLabel: this.labels.levels[log.level],
            levelClasses: [LEVEL_LABEL_CLASSES, LEVEL_CLASSES[log.level]].join(' '),
            application: log.application ?? undefined,
            origin: log.context.origin,
            errorName: error?.name,
            // the message of an error log is the first of the paragraphs of its error, which say more
            text: error?.paragraphs.length ? error.paragraphs.join('\n') : log.message,
            metadata: metadata == undefined ? undefined : JSON.stringify(metadata, undefined, 2),
            stackTrace: error?.stackTrace.length ? error.stackTrace.join('\n') : undefined
        };
    }
}