import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, Signal } from '@angular/core';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { CheckListColor } from './check-list-color.type';
import { CheckListConfig } from './check-list-config.model';
import { CHECK_LIST_CONFIG } from './check-list-config.provider';
import { CheckListComponent } from './check-list.component';

// as high as the first line of the text, so the icon stays next to it however long the text gets.
const ICON_BASE_CLASSES: string = 'flex h-[1.5em] shrink-0 items-center [&_svg]:size-[1em]';

// the icons are graphics next to text, which secondary and success are too light for on the surface.
const ICON_COLOR_CLASSES: Record<CheckListColor, string> = {
    neutral: 'text-on-surface',
    primary: 'text-primary',
    secondary: 'text-secondary-text',
    success: 'text-success-text'
};

// an item that is not included is drawn like a hint, with a cross instead of the check, so it differs in more than the
// color; the text for screen readers says it as well.
const EXCLUDED_ICON_CLASSES: string = 'text-on-surface-variant';

const TEXT_CLASSES: Record<'included' | 'excluded', string> = {
    included: 'min-w-0',
    excluded: 'min-w-0 text-on-surface-variant'
};

/**
 * An item of a `<ui-check-list>`, with your own content, like `<ui-check-list-item>Unlimited courses</ui-check-list-item>`.
 * Set included to false for one that is not included, like a feature a plan lacks.
 */
@Component({
    selector: 'ui-check-list-item',
    templateUrl: './check-list-item.component.html',
    imports: [IconComponent],
    host: {
        // a list item of the list of ui-check-list, without being an li, which only the consumer could write.
        role: 'listitem',
        class: 'flex gap-2 text-body'
    }
})
export class CheckListItemComponent {
    private readonly config: CheckListConfig = inject(CHECK_LIST_CONFIG);

    private readonly list: CheckListComponent = inject(CheckListComponent);

    /**
     * Whether the item is included. One that is not shows a cross in the color of hints, and screen readers read the
     * excludedLabel of provideCheckListConfig after it.
     */
    readonly included: InputSignalWithTransform<boolean, unknown> = input(true, { transform: booleanAttribute });

    /**
     * An icon of its own for an included item, in place of the one of the list.
     */
    readonly icon: InputSignal<IconDefinition | undefined> = input<IconDefinition>();

    /**
     * What screen readers read after an item that is not included.
     */
    protected readonly excludedLabel: string = this.config.excludedLabel;

    /**
     * The icon that shows.
     */
    protected readonly shownIcon: Signal<IconDefinition> = computed(() => {
        return this.included() ? this.icon() ?? this.list.icon() : this.config.excludedIcon;
    });

    /**
     * The tailwind classes around the icon.
     */
    protected readonly iconClasses: Signal<string> = computed(() => {
        return `${ICON_BASE_CLASSES} ${this.included() ? ICON_COLOR_CLASSES[this.list.color()] : EXCLUDED_ICON_CLASSES}`;
    });

    /**
     * The tailwind classes of the text.
     */
    protected readonly textClasses: Signal<string> = computed(() => TEXT_CLASSES[this.included() ? 'included' : 'excluded']);
}