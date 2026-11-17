import { Component, computed, inject, input, InputSignal, model, ModelSignal, Signal } from '@angular/core';
import { DetailsComponent, DetailsVariant, SummaryComponent } from '@service-soft/ui/details';

import { FaqComponent } from './faq.component';

/**
 * A question of `<ui-faq>`, with your own answer, which shows when the question is opened:
 * `<ui-faq-item question="How much is a membership?"><p>From 15 € a month.</p></ui-faq-item>`.
 */
@Component({
    selector: 'ui-faq-item',
    templateUrl: './faq-item.component.html',
    imports: [DetailsComponent, SummaryComponent],
    host: {
        class: 'block',
        // a question of the FAQPage, which holds its name and its accepted answer.
        '[attr.itemscope]': 'microdata() ? "" : null',
        '[attr.itemprop]': 'microdata() ? "mainEntity" : null',
        '[attr.itemtype]': 'microdata() ? "https://schema.org/Question" : null'
    }
})
export class FaqItemComponent {
    private readonly faq: FaqComponent = inject(FaqComponent);

    /**
     * The question, which opens and closes the answer.
     */
    readonly question: InputSignal<string> = input.required<string>();

    /**
     * Whether the answer shows. The user opens and closes it, bind it with [(open)] to know or change it.
     */
    readonly open: ModelSignal<boolean> = model(false);

    /**
     * How the question looks, the variant of the list.
     */
    protected readonly variant: Signal<DetailsVariant> = computed(() => this.faq.variant());

    /**
     * The name the questions of an exclusive list share, which makes the browser close the others when one opens.
     */
    protected readonly name: Signal<string | undefined> = computed(() => this.faq.name());

    /**
     * Whether the question and its answer carry the microdata of schema.org.
     */
    protected readonly microdata: Signal<boolean> = computed(() => this.faq.microdata());
}