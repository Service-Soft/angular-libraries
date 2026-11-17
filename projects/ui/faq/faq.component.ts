import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, Signal } from '@angular/core';
import { DetailsVariant } from '@service-soft/ui/details';

import { FaqConfig } from './faq-config.model';
import { FAQ_CONFIG } from './faq-config.provider';

// one counter for every list of questions, so no two of them share the name of their details sections.
let nextId: number = 0;

// plain questions are separated by their dividers, boxes by a gap.
const VARIANT_CLASSES: Record<DetailsVariant, string> = {
    plain: 'flex flex-col',
    outlined: 'flex flex-col gap-2',
    filled: 'flex flex-col gap-2'
};

/**
 * Frequently asked questions, each one a details section that opens to its answer:
 * `<ui-faq><ui-faq-item question="How much is a membership?"><p>…</p></ui-faq-item></ui-faq>`. The questions and
 * answers carry the schema.org microdata of an FAQPage, which search engines read from the html of the answers, also
 * while they are closed. Turn it off with microdata, like for a page that already describes itself otherwise.
 * Unset inputs fall back to the values provided with provideFaqConfig.
 */
@Component({
    selector: 'ui-faq',
    templateUrl: './faq.component.html',
    host: {
        class: 'block'
    }
})
export class FaqComponent {
    private readonly config: FaqConfig = inject(FAQ_CONFIG);

    /**
     * How the questions look, like the variant of a details section. The default comes from provideFaqConfig, plain
     * with a divider below each question.
     */
    readonly variant: InputSignal<DetailsVariant> = input<DetailsVariant>(this.config.variant);

    /**
     * Whether the questions and answers carry the schema.org microdata of an FAQPage. The default comes from
     * provideFaqConfig.
     */
    readonly microdata: InputSignalWithTransform<boolean, unknown> = input(this.config.microdata, { transform: booleanAttribute });

    /**
     * Whether only one answer shows at a time, like an accordion: opening a question closes the one that was open. The
     * default comes from provideFaqConfig.
     */
    readonly exclusive: InputSignalWithTransform<boolean, unknown> = input(this.config.exclusive, { transform: booleanAttribute });

    // the browser closes the other details sections with the same name when one opens, the native exclusive accordion.
    // One name for each list, so two lists on a page don't close each other's questions.
    private readonly groupName: string = `ui-faq-${nextId++}`;

    /**
     * The name the details sections of the questions share, undefined while more than one may be open.
     */
    readonly name: Signal<string | undefined> = computed(() => this.exclusive() ? this.groupName : undefined);

    /**
     * The tailwind classes of the list of questions.
     */
    protected readonly classes: Signal<string> = computed(() => VARIANT_CLASSES[this.variant()]);
}