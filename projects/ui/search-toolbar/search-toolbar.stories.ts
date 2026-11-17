import { signal, WritableSignal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { FilterButtonComponent } from './filter-button.component';
import { SearchToolbarComponent } from './search-toolbar.component';

const POSTS: string[] = ['Summer party', 'Open water season', 'Night run', 'General meeting', 'New coaches', 'Club house reopens'];

const meta: Meta<SearchToolbarComponent> = {
    title: 'UI/Search toolbar',
    component: SearchToolbarComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent, FilterButtonComponent] })]
};
export default meta;

type Story = StoryObj<SearchToolbarComponent>;

// the search filters the list, the number of results follows it, and the filter button is pressed while its filters show.
export const Playground: Story = {
    render: () => {
        const query: WritableSignal<string> = signal('');
        const filtersShown: WritableSignal<boolean> = signal(false);
        return {
            props: {
                query,
                filtersShown,
                filterPosts: (text: string) => POSTS.filter(post => post.toLowerCase().includes(text.toLowerCase()))
            },
            template: `
                @let results = filterPosts(query());
                <div class="grid max-w-3xl gap-4">
                    <ui-search-toolbar [resultCount]="results.length" [(search)]="query">
                        <button
                            ui-filter-button
                            type="button"
                            variant="outlined"
                            aria-controls="filters"
                            [count]="2"
                            [pressed]="filtersShown()"
                            (click)="filtersShown.set(!filtersShown())"
                        >
                            Filters
                        </button>
                    </ui-search-toolbar>
                    <div id="filters" class="rounded-card bg-surface-container p-4 text-body text-on-surface" [hidden]="!filtersShown()">
                        The filters of the list.
                    </div>
                    <ul class="grid gap-2 text-body text-on-surface">
                        @for (post of results; track post) {
                            <li>{{ post }}</li>
                        }
                    </ul>
                </div>
            `
        };
    }
};

// more controls next to the filters; too narrow for one line, the controls wrap below the search.
export const Narrow: Story = {
    render: () => ({
        template: `
            <div class="max-w-xs">
                <ui-search-toolbar search="party" [resultCount]="1">
                    <button ui-filter-button type="button" variant="outlined" [count]="3">Filters</button>
                    <button ui-button type="button" variant="text">Newest first</button>
                </ui-search-toolbar>
            </div>
        `
    })
};

// only the search, without a count of results.
export const SearchOnly: Story = {
    render: () => ({
        template: '<ui-search-toolbar class="max-w-xl" searchLabel="Search the news" />'
    })
};

// the filter button in every variant and color, without active filters, with some, and pressed.
export const FilterButton: Story = {
    render: () => ({
        template: `
            <div class="grid grid-cols-4 justify-items-start gap-4">
                @for (variant of ['filled', 'outlined', 'text']; track variant) {
                    @for (color of ['primary', 'secondary', 'error', 'success']; track color) {
                        <div class="flex flex-wrap gap-2">
                            <button ui-filter-button type="button" [variant]="variant" [color]="color">Filters</button>
                            <button ui-filter-button type="button" [variant]="variant" [color]="color" [count]="3">Filters</button>
                            <button ui-filter-button type="button" [variant]="variant" [color]="color" [count]="12" [pressed]="true">
                                Filters
                            </button>
                        </div>
                    }
                }
            </div>
        `
    })
};