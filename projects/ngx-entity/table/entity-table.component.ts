import { NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, computed, effect, ErrorHandler, inject, Injector, input, InputSignal, InputSignalWithTransform, linkedSignal, LOCALE_ID, model, ModelSignal, output, OutputEmitterRef, resource, ResourceRef, Signal, signal, TemplateRef, WritableSignal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
// only the type: the dialogs are imported when they are first used.
import type { EntityDialogService } from '@service-soft/ngx-entity/dialog';
import { EntityProperty, EntityUtilities } from '@service-soft/ngx-entity/entity';
// only the type: the export is imported when it is first used.
import type { EntityExportFormat, EntityExportUtilities } from '@service-soft/ngx-entity/export';
import { EntityPageQuery, EntityService } from '@service-soft/ngx-entity/service';
import { ButtonComponent } from '@service-soft/ui/button';
import { TABLE_CONFIG, TableActionsComponent, TableColumn, TableComponent, TableConfig, TableFilters, TableOrder, TableRowContext } from '@service-soft/ui/table';
import { FilterConfig, FilterValue, OrderConfig, PaginationResult } from 'zibri-contract';

import { EntityTableColumnInput } from './entity-table-column.model';
import { EntityTableConfig } from './entity-table-config.model';
import { ENTITY_TABLE_CONFIG } from './entity-table-config.provider';
import { EntityTableEdit } from './entity-table-edit.type';
import { EntityTableUtilities } from './entity-table.utilities';

// how long the user has to stop typing in a filter before the table asks the server.
const FILTER_DELAY: number = 300;

const NO_ROWS: PaginationResult<never> = { items: [], totalAmount: 0 };

/**
 * A table of the entities of a service, a page at a time from the server: a column per key, with its header and text
 * from the decorators of the entity, sortable and filtered as far as the filter and order of the service allow.
 * It creates, edits and deletes the entities as well, when it is told to: in dialogs, or on pages of their own. The
 * page, order, filters and selection can be bound two-way, to keep them, but don't have to be. Call reload after the
 * entities changed elsewhere.
 * What you put inside of it, like a description, shows below its label, in the frame of the table.
 */
@Component({
    selector: 'ngx-entity-table',
    templateUrl: './entity-table.component.html',
    imports: [TableComponent, TableActionsComponent, ButtonComponent, NgTemplateOutlet],
    host: { class: 'block', '[attr.aria-busy]': 'loading()' }
})
export class EntityTableComponent<
    T extends object,
    F extends FilterConfig<T> = FilterConfig<T>,
    O extends OrderConfig<T> = OrderConfig<T>
> {
    private readonly config: EntityTableConfig = inject(ENTITY_TABLE_CONFIG);

    private readonly tableConfig: TableConfig = inject(TABLE_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    private readonly injector: Injector = inject(Injector);

    // only an app with routes edits on pages.
    private readonly router: Router | null = inject(Router, { optional: true });

    private readonly route: ActivatedRoute | null = inject(ActivatedRoute, { optional: true });

    /**
     * The service of the entities.
     */
    readonly service: InputSignal<EntityService<T, F, O>> = input.required<EntityService<T, F, O>>();

    /**
     * What the table shows, like 'Tasks'. It shows above the table, next to its buttons, which screen readers say on
     * entering it.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * Whether the label is only read by screen readers, like when a heading above the table says the same already.
     */
    readonly hideLabel: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The columns, by the keys of their properties, or with what they change.
     */
    readonly columns: InputSignal<EntityTableColumnInput<T>[]> = input.required<EntityTableColumnInput<T>[]>();

    /**
     * How many rows a page has. The user changes it below the table, bind it with [(pageSize)].
     */
    readonly pageSize: ModelSignal<number> = model(this.tableConfig.pageSize);

    /**
     * Whether the rows have checkboxes that select them.
     */
    readonly selectable: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether the rows open, which says so through opened.
     */
    readonly opens: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The template of the actions of a row, like a menu. It gets the entity as `let-row`.
     */
    readonly actions: InputSignal<TemplateRef<TableRowContext<T>> | undefined> = input<TemplateRef<TableRowContext<T>>>();

    /**
     * Where the table creates and edits its entities: in a dialog, or on a page at the routes `new` and `:id` below
     * the route of the table. Opening a row edits its entity. Undefined for neither, which leaves opened to you.
     */
    readonly edit: InputSignal<EntityTableEdit | undefined> = input<EntityTableEdit>();

    /**
     * Whether a button above the table creates an entity, where edit says.
     */
    readonly canCreate: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * A filter every page is asked for, on top of the filters of the user, which shows no input, like the tasks of one
     * project: `{ projectId: project.id }`.
     */
    readonly fixedFilter: InputSignal<FilterValue<T, F>> = input<FilterValue<T, F>>({});

    /**
     * The values an entity the table creates starts with, on top of the defaults of its properties, like
     * `{ projectId: project.id }`.
     */
    readonly createValues: InputSignal<Partial<T>> = input<Partial<T>>({});

    /**
     * Whether every row has a button that deletes its entity, after asking.
     */
    readonly canDelete: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether a button above the table imports entities from a json file, with the import of the service.
     */
    readonly canImport: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * Whether buttons above the table export the selected entities as json, csv or xml, which makes the rows selectable.
     */
    readonly canExport: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The current page, from 1 on.
     */
    readonly page: ModelSignal<number> = model(1);

    /**
     * The order of the rows, none by default.
     */
    readonly order: ModelSignal<TableOrder | undefined> = model<TableOrder>();

    /**
     * The filters of the rows, by the key of their column.
     */
    readonly filters: ModelSignal<TableFilters> = model<TableFilters>({});

    /**
     * The selected entities, of every page.
     */
    readonly selected: ModelSignal<T[]> = model<T[]>([]);

    /**
     * Emits the entity the user opens.
     */
    readonly opened: OutputEmitterRef<T> = output<T>();

    /**
     * The columns of the ui-table.
     */
    protected readonly tableColumns: Signal<TableColumn<T>[]> = computed(() => {
        const service: EntityService<T, F, O> = this.service();
        const properties: EntityProperty<T>[] = EntityUtilities.resolveProperties(service.entity);
        return EntityTableUtilities.resolveColumns(properties, this.columns(), service.filter, service.order, this.config, this.locale);
    });

    /**
     * The filters the server is asked for, once the user stopped typing.
     */
    private readonly requestedFilters: WritableSignal<TableFilters> = signal(this.filters());

    /**
     * The page the server answered.
     */
    private readonly result: ResourceRef<PaginationResult<T> | undefined> = resource({
        params: (): EntityPageQuery<T, F, O> => ({
            page: this.page(),
            limit: this.pageSize(),
            order: EntityTableUtilities.resolveOrder<T, O>(this.order()),
            filter: { ...EntityTableUtilities.resolveFilter<T, F>(this.requestedFilters(), this.service().filter), ...this.fixedFilter() }
        }),
        loader: async ({ params }) => await this.service().resolvePage(params)
    });

    /**
     * The rows that show: the last page the server answered, also while the next one loads.
     */
    protected readonly shown: Signal<PaginationResult<T>> = linkedSignal<PaginationResult<T> | undefined, PaginationResult<T>>({
        source: this.result.value,
        computation: (value, previous) => value ?? previous?.value ?? NO_ROWS
    });

    /**
     * Whether a page is loading.
     */
    protected readonly loading: Signal<boolean> = computed(() => this.result.isLoading());

    /**
     * The texts of the table.
     */
    protected readonly labels: EntityTableConfig = this.config;

    /**
     * Whether the rows open: when opened is wanted, or the table edits them.
     */
    protected readonly rowsOpen: Signal<boolean> = computed(() => this.opens() || this.edit() != undefined);

    /**
     * Whether the rows can be selected: when the table says so, or to export them.
     */
    protected readonly rowsSelectable: Signal<boolean> = computed(() => this.selectable() || this.canExport());

    /**
     * The formats the selected entities are exported in, none without canExport.
     */
    protected readonly exportFormats: Signal<EntityExportFormat[]> = computed(() => this.canExport() ? ['json', 'csv', 'xml'] : []);

    /**
     * Whether the rows have actions: your own, or the button that deletes.
     */
    protected readonly hasRowActions: Signal<boolean> = computed(() => this.actions() != undefined || this.canDelete());

    /**
     * What identifies a row, its id, which keeps it selected while it is loaded again.
     */
    protected readonly rowKey: Signal<(row: T) => unknown> = computed(() => {
        const service: EntityService<T, F, O> = this.service();
        return row => service.getId(row);
    });

    constructor() {
        effect(onCleanup => {
            const filters: TableFilters = this.filters();
            const timeout: ReturnType<typeof setTimeout> = setTimeout(() => this.requestedFilters.set(filters), FILTER_DELAY);
            onCleanup(() => clearTimeout(timeout));
        });
        // a page that couldn't be loaded goes where every other error goes, like a dialog of ngx-error-handling.
        const errorHandler: ErrorHandler = inject(ErrorHandler);
        effect(() => {
            const error: Error | undefined = this.result.error();
            if (error != undefined) {
                errorHandler.handleError(error);
            }
        });
    }

    /**
     * Loads the current page again, like after an entity was created, changed or deleted.
     */
    reload(): void {
        this.result.reload();
    }

    /**
     * Resolves the name of the button that deletes an entity: its text and the first value of the row, which says
     * which entity it deletes, as every row has one.
     * @param row - The entity.
     * @returns The name.
     */
    protected resolveDeleteLabel(row: T): string {
        const first: TableColumn<T> | undefined = this.tableColumns()[0];
        return first == undefined ? this.labels.deleteLabel : `${this.labels.deleteLabel} ${first.value(row)}`;
    }

    /**
     * Opens an entity: emits it, and edits it where edit says.
     * @param row - The entity.
     */
    protected async open(row: T): Promise<void> {
        this.opened.emit(row);
        if (this.edit() === 'page') {
            await this.navigate(this.service().getId(row));
        }
        else if (this.edit() === 'dialog' && await (await this.resolveDialogs()).edit(this.service(), row) != undefined) {
            this.reload();
        }
    }

    /**
     * Creates an entity where edit says.
     */
    protected async create(): Promise<void> {
        if (this.edit() === 'page') {
            await this.navigate('new');
        }
        else if (await (await this.resolveDialogs()).create(this.service(), { values: this.createValues() }) != undefined) {
            this.reload();
        }
    }

    /**
     * Deletes an entity, after asking.
     * @param row - The entity.
     */
    protected async delete(row: T): Promise<void> {
        if (await (await this.resolveDialogs()).delete(this.service(), row)) {
            this.reload();
        }
    }

    /**
     * Imports the entities of the json file the user chose, and loads the page again. A refused file goes to the
     * ErrorHandler.
     * @param input - The file input.
     */
    protected async import(input: HTMLInputElement): Promise<void> {
        const file: File | undefined = input.files?.[0];
        // empty, so the same file can be chosen again
        input.value = '';
        if (file == undefined) {
            return;
        }
        try {
            await this.service().import(file);
            this.reload();
        }
        catch (error) {
            this.injector.get(ErrorHandler).handleError(error);
        }
    }

    /**
     * Saves the selected entities as a file of a format.
     * @param format - The format.
     */
    protected async export(format: EntityExportFormat): Promise<void> {
        // loaded when it is first used, like the dialogs.
        const { EntityExportUtilities: exporter } = await import('@service-soft/ngx-entity/export');
        exporter.download(this.resolveExport(exporter, format), this.labels.exportFileName, format);
    }

    private resolveExport(exporter: typeof EntityExportUtilities, format: EntityExportFormat): string {
        const entities: T[] = this.selected();
        switch (format) {
            case 'json': {
                return exporter.resolveJson(entities);
            }
            case 'csv': {
                return exporter.resolveCsv(entities, this.tableColumns(), this.labels.csvSeparator);
            }
            case 'xml': {
                return exporter.resolveXml(entities);
            }
        }
    }

    // loaded when it is first used, so a table that only shows its entities doesn't ship the form.
    private async resolveDialogs(): Promise<EntityDialogService> {
        const { EntityDialogService: dialogService } = await import('@service-soft/ngx-entity/dialog');
        return this.injector.get(dialogService);
    }

    private async navigate(path: string): Promise<void> {
        if (this.router == undefined) {
            throw new Error('The entity table edits on pages, which needs the router of provideRouter.');
        }
        await this.router.navigate([path], { relativeTo: this.route });
    }
}