import { Tab, TabList, TabPanel, Tabs } from '@angular/aria/tabs';
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, contentChildren, inject, input, InputSignal, linkedSignal, model, ModelSignal, Signal, WritableSignal } from '@angular/core';

import { TabComponent } from './tab.component';
import { TabsColor } from './tabs-color.type';
import { TabsConfig } from './tabs-config.model';
import { TABS_CONFIG } from './tabs-config.provider';
import { TabsVariant } from './tabs-variant.type';

// the list scrolls sideways once its tabs don't fit, rather than wrapping into rows that would look like two lists.
// Filled, it is a strip as wide as its tabs, whose padding and gaps leave room for the focus ring around a tab, which
// the scrolling would cut off otherwise.
const TAB_LIST_CLASSES: Record<TabsVariant, string> = {
    underlined: 'flex overflow-x-auto border-b border-outline-variant',
    filled: 'inline-flex max-w-full gap-1 overflow-x-auto rounded-tabs bg-surface-container p-1'
};

// underlined, the selected tab is marked by a bar below it and by its weight, so color is never the only cue and forced
// colors mode, which draws every border, still shows it. In a theme color its label and bar are in the color, on its
// tint, and it hovers with the pressed tint, which the theme checks; secondary is too light for text, so it uses
// secondary-text. The focus ring sits inside, the list scrolls and would cut it off.
// filled, the selected tab is filled with its color under its on- color, hovering with -hover, like a filled button,
// and neutral is the surface, raised from the strip; the other tabs hover with the surface. Only the selected tab has a
// border, transparent, which shows it in forced colors mode, where backgrounds are gone; its padding is smaller by the
// border, so it keeps its size. The focus ring is outside, on the strip, as a filled tab would hide one inside.
const TAB_CLASSES: Record<TabsVariant, Record<TabsColor, string>> = {
    underlined: {
        neutral: `
            -mb-px min-h-10 shrink-0 cursor-pointer border-b-2 border-transparent px-4 py-2 text-label text-on-surface-variant
            transition-colors
            hover:bg-surface-container hover:text-on-surface
            focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary
            aria-selected:border-on-surface aria-selected:font-semibold aria-selected:text-on-surface
            aria-disabled:cursor-default aria-disabled:opacity-50
            aria-disabled:hover:bg-transparent
        `,
        primary: `
            -mb-px min-h-10 shrink-0 cursor-pointer border-b-2 border-transparent px-4 py-2 text-label text-on-surface-variant
            transition-colors
            hover:bg-surface-container hover:text-on-surface
            focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary
            aria-selected:border-primary aria-selected:bg-primary-tint aria-selected:font-semibold aria-selected:text-primary
            aria-selected:hover:bg-primary-tint-pressed aria-selected:hover:text-primary
            aria-disabled:cursor-default aria-disabled:opacity-50
            aria-disabled:hover:bg-transparent
        `,
        secondary: `
            -mb-px min-h-10 shrink-0 cursor-pointer border-b-2 border-transparent px-4 py-2 text-label text-on-surface-variant
            transition-colors
            hover:bg-surface-container hover:text-on-surface
            focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-secondary-text
            aria-selected:border-secondary-text aria-selected:bg-secondary-tint aria-selected:font-semibold
            aria-selected:text-secondary-text
            aria-selected:hover:bg-secondary-tint-pressed aria-selected:hover:text-secondary-text
            aria-disabled:cursor-default aria-disabled:opacity-50
            aria-disabled:hover:bg-transparent
        `
    },
    filled: {
        neutral: `
            min-h-8 shrink-0 cursor-pointer rounded-tabs px-4 py-1 text-label text-on-surface-variant transition-colors
            hover:bg-surface hover:text-on-surface
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
            aria-selected:border-2 aria-selected:border-transparent aria-selected:bg-surface aria-selected:px-3.5
            aria-selected:font-semibold aria-selected:text-on-surface aria-selected:shadow-1
            aria-disabled:cursor-default aria-disabled:opacity-50
            aria-disabled:hover:bg-transparent aria-disabled:hover:text-on-surface-variant
        `,
        primary: `
            min-h-8 shrink-0 cursor-pointer rounded-tabs px-4 py-1 text-label text-on-surface-variant transition-colors
            hover:bg-surface hover:text-on-surface
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
            aria-selected:border-2 aria-selected:border-transparent aria-selected:bg-primary aria-selected:px-3.5
            aria-selected:font-semibold aria-selected:text-on-primary
            aria-selected:hover:bg-primary-hover aria-selected:hover:text-on-primary
            aria-disabled:cursor-default aria-disabled:opacity-50
            aria-disabled:hover:bg-transparent aria-disabled:hover:text-on-surface-variant
        `,
        secondary: `
            min-h-8 shrink-0 cursor-pointer rounded-tabs px-4 py-1 text-label text-on-surface-variant transition-colors
            hover:bg-surface hover:text-on-surface
            focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary-text
            aria-selected:border-2 aria-selected:border-transparent aria-selected:bg-secondary aria-selected:px-3.5
            aria-selected:font-semibold aria-selected:text-on-secondary
            aria-selected:hover:bg-secondary-hover aria-selected:hover:text-on-secondary
            aria-disabled:cursor-default aria-disabled:opacity-50
            aria-disabled:hover:bg-transparent aria-disabled:hover:text-on-surface-variant
        `
    }
};

/**
 * Tabs, which show one of several sections of content at a time, like the parts of a long form. Every ui-tab inside is
 * one of them: its label is in the list of tabs, and its content shows while it is selected.
 * Bind the selected tab two-way with [(selected)], the value of a tab. Without it, the first tab that isn't disabled
 * is selected. The arrow keys move through the tabs and select them, Home and End go to the first and the last. A
 * disabled tab gets focus, so keyboard and screen reader users learn it is there, but isn't selected.
 * The content of every tab is rendered right away and stays, hidden while its tab isn't selected, so a form validates
 * the fields of every tab, also of one the user never opened, and keeps what the user typed.
 */
@Component({
    selector: 'ui-tabs',
    templateUrl: './tabs.component.html',
    imports: [NgTemplateOutlet, Tabs, TabList, Tab, TabPanel],
    host: {
        class: 'flex flex-col'
    }
})
export class TabsComponent {
    /**
     * The tabs.
     */
    protected readonly tabs: Signal<readonly TabComponent[]> = contentChildren(TabComponent);

    /**
     * The value of the selected tab.
     */
    readonly selected: ModelSignal<string | undefined> = model<string>();

    /**
     * The value of the tab that shows: the selected one, or the first that isn't disabled.
     */
    protected readonly shown: WritableSignal<string | undefined> = linkedSignal(() => {
        const firstEnabled: TabComponent | undefined = this.tabs().find(tab => !tab.disabled());
        return this.selected() ?? firstEnabled?.value();
    });

    private readonly config: TabsConfig = inject(TABS_CONFIG);

    /**
     * How the tabs look: underlined, the selected one marked by a bar below it, or filled, the tabs in a strip and the
     * selected one filled with its color.
     */
    readonly variant: InputSignal<TabsVariant> = input<TabsVariant>(this.config.variant);

    /**
     * The color of the selected tab: underlined, its label and the bar below it; filled, its background.
     */
    readonly color: InputSignal<TabsColor> = input<TabsColor>(this.config.color);

    /**
     * The tailwind classes of the list of tabs.
     */
    protected readonly tabListClasses: Signal<string> = computed(() => TAB_LIST_CLASSES[this.variant()]);

    /**
     * The tailwind classes of a tab.
     */
    protected readonly tabClasses: Signal<string> = computed(() => TAB_CLASSES[this.variant()][this.color()]);

    /**
     * Shows a tab and says so through selected.
     * @param value - The value of the tab.
     */
    protected select(value: string | undefined): void {
        this.shown.set(value);
        this.selected.set(value);
    }
}