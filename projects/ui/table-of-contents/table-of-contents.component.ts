import { DOCUMENT, Location } from '@angular/common';
import { afterRenderEffect, booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, signal, Signal, WritableSignal } from '@angular/core';
import { LinkUtilities } from '@service-soft/ui/link';

import { TableOfContentsConfig } from './table-of-contents-config.model';
import { TABLE_OF_CONTENTS_CONFIG } from './table-of-contents-config.provider';
import { TableOfContentsEntry } from './table-of-contents-entry.model';
import { TableOfContentsItem } from './table-of-contents-item.model';
import { TableOfContentsLevel } from './table-of-contents-level.type';
import { TableOfContentsListComponent } from './table-of-contents-list.component';
import { TableOfContentsUtilities } from './table-of-contents.utilities';

// the section being read is the one whose heading is in the top third of the screen, where the eyes are while reading.
const SPY_ROOT_MARGIN: string = '0px 0px -66% 0px';

let nextId: number = 0;

/**
 * Links to the sections of a page, nested by their levels, like on a page of legal texts. The links are the headings
 * of a container, `<ui-table-of-contents [container]="text" />` with `<article #text>`, or given as data,
 * `<ui-table-of-contents [items]="[{ name: 'Cookies', fragment: 'cookies' }]" />`. While the page scrolls, the link of
 * the section that is being read is highlighted and has aria-current.
 * Headings of a container that have no id get one from their text, like 'cookies-and-tracking'. The container is read
 * in the browser, also again when its content changes; for links that are part of the html a server renders, give the
 * items.
 * Unset inputs fall back to the values provided with provideTableOfContentsConfig.
 */
@Component({
    selector: 'ui-table-of-contents',
    templateUrl: './table-of-contents.component.html',
    imports: [TableOfContentsListComponent],
    host: {
        class: 'block'
    }
})
export class TableOfContentsComponent {
    private readonly config: TableOfContentsConfig = inject(TABLE_OF_CONTENTS_CONFIG);
    private readonly location: Location = inject(Location);
    private readonly document: Document = inject(DOCUMENT);

    /**
     * The sections to link to. Takes the place of the headings of the container.
     */
    readonly items: InputSignal<TableOfContentsItem[] | undefined> = input<TableOfContentsItem[]>();

    /**
     * The element whose headings become the links, like the article of a legal text.
     */
    readonly container: InputSignal<HTMLElement | undefined> = input<HTMLElement>();

    /**
     * The levels of the headings of the container that become links, like [2, 3]. The default comes from
     * provideTableOfContentsConfig.
     */
    readonly levels: InputSignal<TableOfContentsLevel[]> = input<TableOfContentsLevel[]>(this.config.levels);

    /**
     * The title above the links, which names the navigation for screen readers as well. The default comes from
     * provideTableOfContentsConfig.
     */
    readonly label: InputSignal<string> = input<string>(this.config.label);

    /**
     * Whether the link of the section that is being read is highlighted while the page scrolls. The default comes from
     * provideTableOfContentsConfig.
     */
    readonly spy: InputSignalWithTransform<boolean, unknown> = input(this.config.spy, { transform: booleanAttribute });

    /**
     * The id of the title, which names the navigation.
     */
    protected readonly labelId: string = `ui-table-of-contents-${nextId++}`;

    /**
     * The fragment of the section that is being read.
     */
    protected readonly current: WritableSignal<string | undefined> = signal(undefined);

    // read after rendering, in the browser only: a container rendered after the table of contents would have nothing
    // to read yet, and the server would render other links than the browser hydrates.
    private readonly containerItems: WritableSignal<TableOfContentsItem[]> = signal([]);

    /**
     * The links, with the hrefs of their sections.
     */
    protected readonly entries: Signal<TableOfContentsEntry[]> = computed(() => this.toEntries(this.items() ?? this.containerItems()));

    constructor() {
        afterRenderEffect(onCleanup => {
            const container: HTMLElement | undefined = this.container();
            const levels: TableOfContentsLevel[] = this.levels();
            if (container == undefined) {
                return;
            }
            const read: () => void = () => this.containerItems.set(TableOfContentsUtilities.resolveItems(container, levels));
            read();
            // the ids it writes are attributes, which it doesn't observe, so writing them doesn't read it again.
            const observer: MutationObserver = new MutationObserver(read);
            observer.observe(container, { childList: true, subtree: true, characterData: true });
            onCleanup(() => observer.disconnect());
        });
        afterRenderEffect(onCleanup => {
            const headings: HTMLElement[] = this.spy() ? this.findHeadings(this.entries()) : [];
            if (headings.length === 0) {
                return;
            }
            const observer: IntersectionObserver = this.observeHeadings(headings);
            onCleanup(() => observer.disconnect());
        });
    }

    private toEntries(items: TableOfContentsItem[]): TableOfContentsEntry[] {
        return items.map(item => ({
            name: item.name,
            fragment: item.fragment,
            href: LinkUtilities.resolveFragmentHref(this.location, item.fragment),
            children: this.toEntries(item.children ?? [])
        }));
    }

    private findHeadings(entries: TableOfContentsEntry[]): HTMLElement[] {
        return entries.flatMap(entry => {
            const heading: HTMLElement | null = this.document.getElementById(entry.fragment);
            return [...heading == undefined ? [] : [heading], ...this.findHeadings(entry.children)];
        });
    }

    // the first heading in the top third is the current one. Without one there, the reader is further down in the
    // section of the last one that passed it, which stays current, unless it left at the bottom: then they scrolled
    // back up, into the section before it.
    private observeHeadings(headings: HTMLElement[]): IntersectionObserver {
        const visible: Set<Element> = new Set();
        const observer: IntersectionObserver = new IntersectionObserver(observed => {
            for (const entry of observed) {
                if (entry.isIntersecting) {
                    visible.add(entry.target);
                    continue;
                }
                visible.delete(entry.target);
                const leftAtTheBottom: boolean = entry.boundingClientRect.top >= (entry.rootBounds?.bottom ?? Number.POSITIVE_INFINITY);
                if (leftAtTheBottom && entry.target.id === this.current()) {
                    this.current.set(headings[headings.findIndex(heading => heading === entry.target) - 1]?.id);
                }
            }
            const first: HTMLElement | undefined = headings.find(heading => visible.has(heading));
            if (first != undefined) {
                this.current.set(first.id);
            }
        }, { rootMargin: SPY_ROOT_MARGIN });
        for (const heading of headings) {
            observer.observe(heading);
        }
        return observer;
    }
}