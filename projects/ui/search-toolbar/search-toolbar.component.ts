import { Component, computed, inject, input, InputSignal, model, ModelSignal, Signal } from '@angular/core';
import { InputStringComponent } from '@service-soft/ui/input-string';

import { SearchToolbarConfig } from './search-toolbar-config.model';
import { SEARCH_TOOLBAR_CONFIG } from './search-toolbar-config.provider';

/**
 * The bar above a list that the user searches and filters, like the news of a club: a search, your own controls next
 * to it, like a `<button ui-filter-button>` or a select to order by, and how many results there are below it:
 * `<ui-search-toolbar [(search)]="query" [resultCount]="results().length"><button ui-filter-button …>Filters</button></ui-search-toolbar>`.
 * On a narrow screen the controls wrap below the search. Screen readers announce the number of results whenever it
 * changes, without moving the focus.
 * Unset inputs fall back to the values provided with provideSearchToolbarConfig.
 */
@Component({
    selector: 'ui-search-toolbar',
    templateUrl: './search-toolbar.component.html',
    imports: [InputStringComponent],
    host: {
        class: 'block'
    }
})
export class SearchToolbarComponent {
    private readonly config: SearchToolbarConfig = inject(SEARCH_TOOLBAR_CONFIG);

    /**
     * The text of the search, bind it with [(search)]. It changes with every key, so a search that asks a server may
     * want to wait until the user stops typing.
     */
    readonly search: ModelSignal<string> = model('');

    /**
     * The name of the search, which shows in it while it is empty. The default comes from provideSearchToolbarConfig.
     */
    readonly searchLabel: InputSignal<string> = input<string>(this.config.searchLabel);

    /**
     * How many results there are. Without it, nothing shows below the search.
     */
    readonly resultCount: InputSignal<number | undefined> = input<number>();

    /**
     * The text that says how many results there are.
     */
    protected readonly resultText: Signal<string> = computed(() => this.config.resultCountLabel(this.resultCount() ?? 0));
}