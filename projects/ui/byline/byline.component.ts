import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, Signal } from '@angular/core';
import { AvatarComponent } from '@service-soft/ui/avatar';
import { DatePeriodComponent, DatePeriodDate, DatePeriodFormat } from '@service-soft/ui/date-period';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { BylineConfig } from './byline-config.model';
import { BYLINE_CONFIG } from './byline-config.provider';
import { BylineEntry } from './byline-entry.model';
import { BylineItem } from './byline-item.model';

// each entry stays in one piece where the row wraps. The author stands out from the facts after it, which are
// secondary text.
const ENTRY_CLASSES: Record<'author' | 'text', string> = {
    author: 'inline-flex items-center gap-2 text-on-surface',
    text: 'inline-flex items-center gap-1.5 [&_svg]:size-[1em]'
};

/**
 * The small row of facts about an article, below its title, on a card or on its own page: who wrote it, when, how long
 * it takes to read and its category, separated by dots:
 * `<ui-byline author="Ada Lovelace" [date]="post.published" [readingTime]="5" />`. Every input is optional, and only
 * the ones that are set show. The date is a time element, written in the language of the app (LOCALE_ID).
 * Unset inputs fall back to the values provided with provideBylineConfig.
 */
@Component({
    selector: 'ui-byline',
    templateUrl: './byline.component.html',
    imports: [AvatarComponent, DatePeriodComponent, IconComponent],
    host: {
        class: 'block'
    }
})
export class BylineComponent {
    private readonly config: BylineConfig = inject(BYLINE_CONFIG);

    /**
     * The name of the person who wrote it.
     */
    readonly author: InputSignal<string | undefined> = input<string>();

    /**
     * Whether an avatar of the author shows in front of their name, their initials without a picture. The default
     * comes from provideBylineConfig.
     */
    readonly showAvatar: InputSignalWithTransform<boolean, unknown> = input(this.config.showAvatar, { transform: booleanAttribute });

    /**
     * The url of a picture of the author, for the avatar.
     */
    readonly avatar: InputSignal<string | undefined> = input<string>();

    /**
     * When it was published, a Date, a timestamp or a string like '2026-11-15'.
     */
    readonly date: InputSignal<DatePeriodDate | undefined> = input<DatePeriodDate>();

    /**
     * How the date is written. The default comes from provideBylineConfig.
     */
    readonly dateFormat: InputSignal<DatePeriodFormat> = input<DatePeriodFormat>(this.config.dateFormat);

    /**
     * How many minutes it takes to read, shown with the readingTimeLabel of provideBylineConfig, like '5 min read'.
     */
    readonly readingTime: InputSignal<number | undefined> = input<number>();

    /**
     * The category it belongs to, like 'Club news'.
     */
    readonly category: InputSignal<string | undefined> = input<string>();

    /**
     * Entries of your own after the others, like the number of comments.
     */
    readonly items: InputSignal<BylineItem[]> = input<BylineItem[]>([]);

    /**
     * The entries that are set, in the order they show.
     */
    protected readonly entries: Signal<BylineEntry[]> = computed(() => {
        const author: string | undefined = this.author();
        const date: DatePeriodDate | undefined = this.date();
        const readingTime: number | undefined = this.readingTime();
        const category: string | undefined = this.category();
        const entries: BylineEntry[] = [];
        if (author != undefined) {
            entries.push({ kind: 'text', text: author, icon: undefined, avatar: this.showAvatar(), classes: ENTRY_CLASSES.author });
        }
        if (date != undefined) {
            entries.push({ kind: 'date', date });
        }
        if (readingTime != undefined) {
            entries.push(this.toTextEntry(this.config.readingTimeLabel(readingTime), undefined));
        }
        if (category != undefined) {
            entries.push(this.toTextEntry(category, undefined));
        }
        return [...entries, ...this.items().map(item => this.toTextEntry(item.text, item.icon))];
    });

    private toTextEntry(text: string, icon: IconDefinition | undefined): BylineEntry {
        return { kind: 'text', text, icon, avatar: false, classes: ENTRY_CLASSES.text };
    }
}