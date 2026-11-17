import { booleanAttribute, Component, computed, input, InputSignal, InputSignalWithTransform, Signal } from '@angular/core';

import { TableOfContentsEntry } from './table-of-contents-entry.model';

// a line at the start of every link, which turns primary for the current section: the current one stands out by its
// line, its weight and its color, not by the color alone. The line of a nested list starts further in, like its text.
const LINK_CLASSES: string = `
    flex min-h-6 items-center rounded-e-link border-s-2 border-outline-variant py-1 ps-3 pe-2 text-body-sm text-on-surface-variant
    no-underline transition-colors
    hover:border-on-surface-variant hover:text-on-surface
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
    aria-[current=true]:border-primary aria-[current=true]:font-semibold aria-[current=true]:text-primary
`;

const LIST_CLASSES: Record<'top' | 'nested', string> = {
    top: 'flex flex-col',
    nested: 'flex flex-col ps-3'
};

/**
 * The links of one level of a table of contents, with the ones of the sections inside of them as a nested list.
 */
@Component({
    selector: 'ui-table-of-contents-list',
    templateUrl: './table-of-contents-list.component.html',
    host: {
        class: 'contents'
    }
})
export class TableOfContentsListComponent {
    /**
     * The links of the level.
     */
    readonly entries: InputSignal<TableOfContentsEntry[]> = input.required<TableOfContentsEntry[]>();

    /**
     * The fragment of the section that is being read.
     */
    readonly current: InputSignal<string | undefined> = input<string>();

    /**
     * Whether it is the list of the sections inside of another one.
     */
    readonly nested: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The tailwind classes of the list.
     */
    protected readonly listClasses: Signal<string> = computed(() => LIST_CLASSES[this.nested() ? 'nested' : 'top']);

    /**
     * The tailwind classes of a link.
     */
    protected readonly linkClasses: string = LINK_CLASSES;
}