import { TableColumn } from '@service-soft/ui/table';
import { describe, expect, test } from 'vitest';

import { EntityExportUtilities } from './entity-export.utilities';

type Task = {
    title: string,
    dueAt: Date,
    tags: string[],
    address?: { city: string }
};

const TASKS: Task[] = [
    { title: 'Write "the" docs', dueAt: new Date('2026-03-01T09:00:00.000Z'), tags: ['docs', 'a&b'], address: { city: 'Berlin' } },
    { title: 'Plain', dueAt: new Date('2026-03-02T09:00:00.000Z'), tags: [] }
];

const COLUMNS: TableColumn<Task>[] = [
    { key: 'title', label: 'Title', value: task => task.title },
    { key: 'tags', label: 'Tags; all', value: task => task.tags.join(', ') }
];

describe('EntityExportUtilities', () => {
    test('exports json that an import takes back', () => {
        expect(JSON.parse(EntityExportUtilities.resolveJson(TASKS))).toEqual(JSON.parse(JSON.stringify(TASKS)));
    });

    test('exports a csv of the labels and texts of the columns, quoting fields with the separator, quotes or line breaks', () => {
        expect(EntityExportUtilities.resolveCsv(TASKS, COLUMNS, ',')).toBe('Title,Tags; all\r\n"Write ""the"" docs","docs, a&b"\r\nPlain,');
        expect(EntityExportUtilities.resolveCsv(TASKS, COLUMNS, ';')).toBe('Title;"Tags; all"\r\n"Write ""the"" docs";docs, a&b\r\nPlain;');
    });

    test('exports xml with an element per value, items of arrays and the values of objects, escaped', () => {
        const xml: string = EntityExportUtilities.resolveXml([TASKS[0] ?? {}]);

        expect(xml).toContain('<title>Write &quot;the&quot; docs</title>');
        expect(xml).toContain('<dueAt>2026-03-01T09:00:00.000Z</dueAt>');
        expect(xml).toContain('<tags>\n            <item>docs</item>\n            <item>a&amp;b</item>\n        </tags>');
        expect(xml).toContain('<address>\n            <city>Berlin</city>\n        </address>');
        expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>\n<entities>\n    <entity>')).toBe(true);
        expect(new DOMParser().parseFromString(xml, 'application/xml')
            .querySelector('parsererror')).toBeNull();
    });
});