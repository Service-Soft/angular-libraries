import { TableColumn } from '@service-soft/ui/table';

import { EntityExportFormat } from './entity-export-format.type';

// what each format is, for the file the browser saves.
const MIME_TYPES: Record<EntityExportFormat, string> = {
    json: 'application/json',
    csv: 'text/csv',
    xml: 'application/xml'
};

// a field of a csv needs quotes when it holds one of these, or the separator.
const CSV_SPECIAL_CHARACTERS: RegExp = /[\n\r"]/;

/**
 * Turns entities into the files they are exported as, and saves them.
 */
export abstract class EntityExportUtilities {
    /**
     * Resolves the json of entities, as the server answered them, which a json import takes back.
     * @param entities - The entities.
     * @returns The json, indented.
     */
    static resolveJson(entities: object[]): string {
        return JSON.stringify(entities, undefined, 4);
    }

    /**
     * Resolves the csv of entities: a row of the labels of the columns, then a row of the texts of each entity, as the
     * table shows them. Fields with the separator, quotes or line breaks are quoted.
     * @param entities - The entities.
     * @param columns - The columns of the table.
     * @param separator - What separates the fields of a row, like ',' or ';'.
     * @returns The csv.
     */
    static resolveCsv<T>(entities: T[], columns: TableColumn<T>[], separator: string): string {
        const header: string[] = columns.map(column => column.label);
        const rows: string[][] = [header, ...entities.map(entity => columns.map(column => column.value(entity)))];
        return rows.map(row => row.map(field => this.resolveCsvField(field, separator)).join(separator)).join('\r\n');
    }

    /**
     * Resolves the xml of entities: an `entities` element with an `entity` for each, whose values are elements named
     * by their keys. Dates are in ISO format, arrays have an `item` for each of their items, objects the elements of
     * their values.
     * @param entities - The entities.
     * @returns The xml.
     */
    static resolveXml(entities: object[]): string {
        const items: string = entities.map(entity => this.resolveXmlElement('entity', entity, '    ')).join('');
        return `<?xml version="1.0" encoding="UTF-8"?>\n<entities>\n${items}</entities>\n`;
    }

    /**
     * Saves a file in the browser, like a download.
     * @param content - What the file holds.
     * @param name - The name of the file, without its extension.
     * @param format - The format, which gives the extension and the type of the file.
     */
    static download(content: string, name: string, format: EntityExportFormat): void {
        const url: string = URL.createObjectURL(new Blob([content], { type: MIME_TYPES[format] }));
        const link: HTMLAnchorElement = document.createElement('a');
        link.href = url;
        link.download = `${name}.${format}`;
        link.click();
        URL.revokeObjectURL(url);
    }

    private static resolveCsvField(field: string, separator: string): string {
        return CSV_SPECIAL_CHARACTERS.test(field) || field.includes(separator) ? `"${field.replaceAll('"', '""')}"` : field;
    }

    private static resolveXmlElement(name: string, value: unknown, indent: string): string {
        if (value == undefined) {
            return `${indent}<${name}/>\n`;
        }
        if (Array.isArray(value)) {
            const items: string = value.map((item: unknown) => this.resolveXmlElement('item', item, `${indent}    `)).join('');
            return `${indent}<${name}>\n${items}${indent}</${name}>\n`;
        }
        if (typeof value === 'object' && !(value instanceof Date)) {
            const children: string = Object.entries(value)
                .map(([key, child]: [string, unknown]) => this.resolveXmlElement(key, child, `${indent}    `))
                .join('');
            return `${indent}<${name}>\n${children}${indent}</${name}>\n`;
        }
        return `${indent}<${name}>${this.escapeXml(this.resolveXmlText(value))}</${name}>\n`;
    }

    // a date in ISO format, a plain value as itself, and nothing for what json has no value for, like a function.
    private static resolveXmlText(value: unknown): string {
        if (value instanceof Date) {
            return value.toISOString();
        }
        switch (typeof value) {
            case 'string':
            case 'number':
            case 'boolean':
            case 'bigint': {
                return String(value);
            }
            case 'object':
            case 'function':
            case 'symbol':
            case 'undefined': {
                return '';
            }
        }
    }

    private static escapeXml(text: string): string {
        return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll('\'', '&apos;');
    }
}