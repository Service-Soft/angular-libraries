import { EntityProperty, EntityTextLabels, EntityTextUtilities, EntityUtilities, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { TableColumn, TableColumnFilter, TableFilters, TableOrder } from '@service-soft/ui/table';
import { FilterConfig, FilterValue, OrderConfig, OrderValue } from 'zibri-contract';

import { EntityTableColumn, EntityTableColumnInput } from './entity-table-column.model';

// the matches of zibri a text input can fill in.
const TEXT_MATCHES: Set<unknown> = new Set(['iLike', 'fuzzy', 'equals']);

// the kinds of properties a table only orders by when the order config names them: zibri doesn't order by them, or
// what a custom one holds is unknown.
const UNORDERED_TYPES: Set<PropertyMetadata<unknown>['type']> = new Set(['oneToMany', 'object', 'array', 'dateRange', 'custom']);

// the matches of zibri a select of the members of an enum can fill in.
const SELECT_MATCHES: Set<unknown> = new Set(['oneOf', 'equals']);

/**
 * Turns the properties of an entity into the columns of a ui-table, and what the user asks of the table into what
 * zibri takes.
 */
export abstract class EntityTableUtilities {
    /**
     * Resolves the columns of the table: the header from the displayName, the text formatted by the type of the
     * property, sortable by the order config and filtered by the filter config of the service.
     * @param properties - The properties of the entity.
     * @param columns - The columns, by key or with what they change.
     * @param filter - What the list may be filtered by, the filter of the controller.
     * @param order - What the list may be ordered by, undefined for every column, false for none.
     * @param config - The texts of booleans.
     * @param locale - The locale numbers and dates are formatted in.
     * @returns The columns.
     * @throws {Error} When a column names a property without a decorator.
     */
    static resolveColumns<T extends object>(
        properties: EntityProperty<T>[],
        columns: EntityTableColumnInput<T>[],
        filter: FilterConfig<T> | undefined,
        order: OrderConfig<T> | false | undefined,
        config: EntityTextLabels,
        locale: string
    ): TableColumn<T>[] {
        return columns.map(input => {
            const column: EntityTableColumn<T> = typeof input === 'string' ? { key: input } : input;
            const property: EntityProperty<T> | undefined = properties.find(candidate => candidate.key === column.key);
            if (property == undefined) {
                throw new Error(`The column "${column.key}" has no property with a decorator of ngx-entity.`);
            }
            const metadata: PropertyMetadata<T> = property.metadata;
            return {
                key: column.key,
                label: column.label ?? metadata.displayName,
                value: column.value
                    ?? (row => EntityTextUtilities.resolveText(metadata, Reflect.get(row, column.key), row, config, locale)),
                cell: column.cell,
                // zibri orders by every plain property by default, but by a relation only when its config says how, by
                // the properties inside an object, not the object, and never by an array.
                sortable: order === undefined
                    ? !EntityUtilities.isToOneRelation(metadata) && !UNORDERED_TYPES.has(metadata.type)
                    : order !== false && Reflect.get(order, column.key) === true,
                filter: this.resolveFilterInput(metadata, filter == undefined ? undefined : Reflect.get(filter, column.key), config),
                align: metadata.type === 'number' && metadata.enum == undefined ? 'end' : 'start'
            };
        });
    }

    /**
     * Resolves the order zibri takes from the order of the table.
     * @param order - The order of the table, if any.
     * @returns The order, empty for none.
     */
    static resolveOrder<T, O extends OrderConfig<T>>(order: TableOrder | undefined): OrderValue<T, O> {
        const value: OrderValue<T, O> = {};
        if (order != undefined) {
            Reflect.set(value, order.key, order.direction);
        }
        return value;
    }

    /**
     * Resolves the filter zibri takes from the filters of the table. A oneOf takes a list, of the one chosen value.
     * @param filters - The filters of the table, by the key of their column.
     * @param config - What the list may be filtered by.
     * @returns The filter.
     */
    static resolveFilter<T, F extends FilterConfig<T>>(filters: TableFilters, config: F | undefined): FilterValue<T, F> {
        const value: FilterValue<T, F> = {};
        for (const [key, filter] of Object.entries(filters)) {
            const match: unknown = config == undefined ? undefined : Reflect.get(config, key);
            Reflect.set(value, key, match === 'oneOf' ? [filter] : filter);
        }
        return value;
    }

    // the input the table shows for the match of zibri, if the table has one for it.
    private static resolveFilterInput<T>(
        metadata: PropertyMetadata<T>,
        match: unknown,
        config: EntityTextLabels
    ): TableColumnFilter | undefined {
        if (metadata.type === 'boolean' && match === 'equals') {
            return { type: 'select', options: [{ label: config.yesLabel, value: true }, { label: config.noLabel, value: false }] };
        }
        if ((metadata.type === 'string' || metadata.type === 'number') && metadata.enum != undefined) {
            return SELECT_MATCHES.has(match) ? { type: 'select', options: EntityUtilities.resolveEnumMembers(metadata.enum) } : undefined;
        }
        return metadata.type === 'string' && TEXT_MATCHES.has(match) ? { type: 'text' } : undefined;
    }
}