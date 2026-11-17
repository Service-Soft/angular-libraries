import { Location, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, InputSignal, signal, Signal, WritableSignal } from '@angular/core';
import { LinkUtilities } from '@service-soft/ui/link';

import { FootnoteEntry } from './footnote-entry.model';
import { FootnoteView } from './footnote-view.model';
import { FootnotesConfig } from './footnotes-config.model';
import { FOOTNOTES_CONFIG } from './footnotes-config.provider';

let nextId: number = 0;

/**
 * The numbered list of the footnotes of a text, like the sources of an article: `<ui-footnotes #sources />`, after the
 * text whose `<ui-footnote [list]="sources">` it lists. They are numbered in the order of their references in the page,
 * and each one links back to its reference. A page can have several lists, each with its own numbers.
 * It is named for screen readers by the label of provideFootnotesConfig, put a heading of your own above it to show
 * one.
 */
@Component({
    selector: 'ui-footnotes',
    templateUrl: './footnotes.component.html',
    imports: [NgTemplateOutlet],
    host: {
        class: 'block'
    }
})
export class FootnotesComponent {
    private readonly config: FootnotesConfig = inject(FOOTNOTES_CONFIG);
    private readonly location: Location = inject(Location);

    /**
     * What screen readers call the list. The default comes from provideFootnotesConfig.
     */
    readonly label: InputSignal<string> = input<string>(this.config.label);

    /**
     * What the ids of the footnotes and their references start with, which links lead to. Generated when not set; set
     * it for links that stay the same, like '#sources-note-1'.
     */
    readonly idPrefix: InputSignal<string> = input(`ui-footnotes-${nextId++}`);

    private readonly registered: WritableSignal<FootnoteEntry[]> = signal([]);

    // by the place of their references in the page, which is the order they are read in, whatever the order the
    // components were created in.
    private readonly entries: Signal<FootnoteEntry[]> = computed(() => [...this.registered()].sort((first, second) => {
        return first.element.compareDocumentPosition(second.element) & first.element.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
    }));

    /**
     * The footnotes as they show.
     */
    protected readonly notes: Signal<FootnoteView[]> = computed(() => this.entries().map((entry, index) => {
        const number: number = index + 1;
        return {
            number,
            id: this.getNoteId(number),
            textId: this.getTextId(number),
            referenceHref: LinkUtilities.resolveFragmentHref(this.location, this.getReferenceId(number)),
            backLabel: this.config.backLabel(number),
            content: entry.content()
        };
    }));

    /**
     * Adds a footnote to the list. Its reference calls it.
     * @param entry - The footnote.
     */
    register(entry: FootnoteEntry): void {
        this.registered.update(entries => [...entries, entry]);
    }

    /**
     * Removes a footnote from the list, once its reference is gone. Its reference calls it.
     * @param entry - The footnote.
     */
    unregister(entry: FootnoteEntry): void {
        this.registered.update(entries => entries.filter(registered => registered !== entry));
    }

    /**
     * Finds the number of a footnote.
     * @param entry - The footnote.
     * @returns Its number, starting at 1, or undefined while it isn't in the list.
     */
    findNumber(entry: FootnoteEntry): number | undefined {
        const index: number = this.entries().indexOf(entry);
        return index === -1 ? undefined : index + 1;
    }

    /**
     * Gets the id of the item of a footnote.
     * @param number - The number of the footnote.
     * @returns The id.
     */
    getNoteId(number: number): string {
        return `${this.idPrefix()}-note-${number}`;
    }

    /**
     * Gets the id of the text of a footnote, which describes its reference.
     * @param number - The number of the footnote.
     * @returns The id.
     */
    getTextId(number: number): string {
        return `${this.idPrefix()}-text-${number}`;
    }

    /**
     * Gets the id of the reference of a footnote in the text.
     * @param number - The number of the footnote.
     * @returns The id.
     */
    getReferenceId(number: number): string {
        return `${this.idPrefix()}-ref-${number}`;
    }
}