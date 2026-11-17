import { Location } from '@angular/common';
import { Component, computed, effect, ElementRef, inject, input, InputSignal, Signal, TemplateRef, viewChild } from '@angular/core';
import { LinkUtilities } from '@service-soft/ui/link';

import { FootnoteEntry } from './footnote-entry.model';
import { FootnotesConfig } from './footnotes-config.model';
import { FOOTNOTES_CONFIG } from './footnotes-config.provider';
import { FootnotesComponent } from './footnotes.component';

/**
 * A footnote, like the source of a sentence, where its reference is in the text: `<ui-footnote [list]="sources">The
 * source</ui-footnote>`. It shows its number there as a superscript link to the footnote, and its content in the list it
 * belongs to, a `<ui-footnotes #sources>`, which links back. Screen readers read the reference as 'Footnote 1', and the
 * text of the footnote as its description, without leaving the text.
 */
@Component({
    selector: 'ui-footnote',
    templateUrl: './footnote.component.html'
})
export class FootnoteComponent {
    private readonly config: FootnotesConfig = inject(FOOTNOTES_CONFIG);
    private readonly location: Location = inject(Location);

    /**
     * The list the footnote shows in, which numbers it.
     */
    readonly list: InputSignal<FootnotesComponent> = input.required<FootnotesComponent>();

    // the content of the footnote, which the list renders in its place
    private readonly content: Signal<TemplateRef<unknown>> = viewChild.required<TemplateRef<unknown>>('content');

    private readonly entry: FootnoteEntry = {
        element: inject<ElementRef<HTMLElement>>(ElementRef).nativeElement,
        content: this.content
    };

    /**
     * The number of the footnote, undefined until its list has it.
     */
    protected readonly number: Signal<number | undefined> = computed(() => this.list().findNumber(this.entry));

    /**
     * The id of the reference, which the footnote links back to.
     */
    protected readonly referenceId: Signal<string> = computed(() => this.list().getReferenceId(this.number() ?? 0));

    /**
     * The href of the footnote.
     */
    protected readonly noteHref: Signal<string> = computed(() => {
        return LinkUtilities.resolveFragmentHref(this.location, this.list().getNoteId(this.number() ?? 0));
    });

    /**
     * The id of the text of the footnote, which describes the reference.
     */
    protected readonly textId: Signal<string> = computed(() => this.list().getTextId(this.number() ?? 0));

    /**
     * The name of the reference.
     */
    protected readonly label: Signal<string> = computed(() => this.config.referenceLabel(this.number() ?? 0));

    constructor() {
        // the list renders on the server as well, so the footnote joins it as it is created, not after rendering.
        effect(onCleanup => {
            const list: FootnotesComponent = this.list();
            list.register(this.entry);
            onCleanup(() => list.unregister(this.entry));
        });
    }
}