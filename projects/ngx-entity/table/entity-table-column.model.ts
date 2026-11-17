import { TemplateRef } from '@angular/core';
import { TableCellContext } from '@service-soft/ui/table';

/**
 * The key of a property a column shows: one of the entity, or any text for an entity whose type isn't known, like the
 * other entities of a relation.
 */
export type EntityTableColumnKey<T> = [keyof T] extends [never] ? string : keyof T & string;

/**
 * A column of an entity table that changes what its property says, like a shorter header or a cell of its own.
 */
export type EntityTableColumn<T> = {
    /**
     * The property the column shows.
     */
    key: EntityTableColumnKey<T>,
    /**
     * The header, the displayName of the property by default.
     */
    label?: string,
    /**
     * The text of a cell, the value formatted by the type of the property by default.
     */
    value?: (row: T) => string,
    /**
     * A template for cells that need more than the text, like a badge. It gets the row as `let-row`.
     */
    cell?: TemplateRef<TableCellContext<T>>
};

/**
 * A column of an entity table: the key of its property, or the column with what it changes.
 */
export type EntityTableColumnInput<T> = EntityTableColumnKey<T> | EntityTableColumn<T>;