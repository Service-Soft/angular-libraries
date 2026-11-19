import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, InputSignal, LOCALE_ID, Signal, TemplateRef } from '@angular/core';

import { DataListConfig } from './data-list-config.model';
import { DATA_LIST_CONFIG } from './data-list-config.provider';
import { DataListItem } from './data-list-item.model';
import { DataListShownItem } from './data-list-shown-item.model';
import { DataListValue } from './data-list-value.type';

/**
 * Labels and their values, like the details of a customer, on the native description list. Texts show as they are,
 * numbers and dates in the language of the app (LOCALE_ID), and a template shows anything else, like a list of links.
 * Each label stands next to its value where the list is wide enough, and above it where it isn't.
 * Items without their own format use the ones provided with provideDataListConfig.
 */
@Component({
    selector: 'ui-data-list',
    templateUrl: './data-list.component.html',
    imports: [NgTemplateOutlet],
    host: {
        // a container, so the list decides by its own width whether labels fit next to their values, which works in
        // a narrow dialog on a wide screen as well.
        class: 'block @container'
    }
})
export class DataListComponent {
    private readonly config: DataListConfig = inject(DATA_LIST_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The labels and their values, in the order they show.
     */
    readonly items: InputSignal<DataListItem[]> = input.required<DataListItem[]>();

    /**
     * The items with their values written in the language of the app.
     */
    protected readonly shownItems: Signal<DataListShownItem[]> = computed(() => this.items().map(item => this.toShownItem(item)));

    private toShownItem(item: DataListItem): DataListShownItem {
        return item.value instanceof TemplateRef
            ? { label: item.label, text: '', template: item.value }
            : { label: item.label, text: this.resolveText(item.value, item), template: undefined };
    }

    private resolveText(value: Exclude<DataListValue, TemplateRef<unknown>>, item: DataListItem): string {
        if (value instanceof Date) {
            return new Intl.DateTimeFormat(this.locale, item.dateFormat ?? this.config.dateFormat).format(value);
        }
        return typeof value === 'number'
            ? new Intl.NumberFormat(this.locale, item.numberFormat ?? this.config.numberFormat).format(value)
            : value ?? '';
    }
}