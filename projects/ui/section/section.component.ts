import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { HeadingComponent, HeadingLevel } from '@service-soft/ui/heading';

import { SectionAlign } from './section-align.type';
import { SectionBackground } from './section-background.type';
import { SectionConfig } from './section-config.model';
import { SECTION_CONFIG } from './section-config.provider';

// one counter for every section, so no two headings get the same id.
let nextId: number = 0;

// a theme color is a colored surface, which gives the content inside of it the on- colors of it, so its eyebrow, lead,
// links, buttons and cards keep their contrast.
const BACKGROUND_CLASSES: Record<SectionBackground, string> = {
    surface: 'bg-surface text-on-surface',
    'surface-container': 'bg-surface-container text-on-surface',
    primary: 'surface-primary',
    secondary: 'surface-secondary'
};

// the intro at the top of a page is the largest text of it, a section of it a step smaller, and everything deeper is
// the size of the title of a component, like a card.
const HEADING_CLASSES: Record<'intro' | 'section' | 'subsection', string> = {
    intro: 'font-heading text-display',
    section: 'font-heading text-headline',
    subsection: 'font-heading text-title'
};

const HEADER_CLASSES: Record<SectionAlign, string> = {
    start: 'flex flex-col gap-3',
    center: 'flex flex-col items-center gap-3 text-center'
};

/**
 * A section of a page, like the ones a website repeats from top to bottom: its content in the width of the token
 * --container-section, with the space of --spacing-section-padding above and below it, and optionally a heading with a small
 * eyebrow above and a lead text below it. With a heading of level 1 it is the intro at the top of a page.
 * `<ui-section sectionId="prices" heading="Prices" eyebrow="Membership" lead="…">…</ui-section>`.
 * Screen readers know it by its heading, and the links of ngx-nav-anchors scroll to it by its sectionId.
 * Unset inputs fall back to the values provided with provideSectionConfig.
 */
@Component({
    selector: 'ui-section',
    templateUrl: './section.component.html',
    imports: [HeadingComponent],
    host: {
        class: 'block'
    }
})
export class SectionComponent {
    private readonly config: SectionConfig = inject(SECTION_CONFIG);

    private readonly generatedId: string = `ui-section-${nextId++}`;

    /**
     * The id of the section, which a link scrolls to with it as its fragment, like the anchors of ngx-navigation.
     * Not called id, which would put the same id on the component's own element as well.
     */
    readonly sectionId: InputSignal<string | undefined> = input<string>();

    /**
     * The heading of the section, which screen readers name it by. Without one, there is no heading, no eyebrow and no
     * lead.
     */
    readonly heading: InputSignal<string | undefined> = input<string>();

    /**
     * The level of the heading, 1 for the intro at the top of a page. The default comes from provideSectionConfig.
     */
    readonly level: InputSignal<HeadingLevel> = input<HeadingLevel>(this.config.level);

    /**
     * A short text above the heading, like the topic of the section.
     */
    readonly eyebrow: InputSignal<string | undefined> = input<string>();

    /**
     * A text below the heading that leads into the section.
     */
    readonly lead: InputSignal<string | undefined> = input<string>();

    /**
     * The background. The default comes from provideSectionConfig.
     */
    readonly background: InputSignal<SectionBackground> = input<SectionBackground>(this.config.background);

    /**
     * Where the heading, the eyebrow and the lead stand. The default comes from provideSectionConfig.
     */
    readonly align: InputSignal<SectionAlign> = input<SectionAlign>(this.config.align);

    /**
     * The id of the heading, which names the section.
     */
    protected readonly headingId: Signal<string> = computed(() => `${this.sectionId() ?? this.generatedId}-heading`);

    /**
     * The tailwind classes of the section.
     */
    protected readonly classes: Signal<string> = computed(() => `py-section-padding ${BACKGROUND_CLASSES[this.background()]}`);

    /**
     * The tailwind classes of the heading.
     */
    protected readonly headingClasses: Signal<string> = computed(() => {
        const level: HeadingLevel = this.level();
        if (level === 1) {
            return HEADING_CLASSES.intro;
        }
        return level === 2 ? HEADING_CLASSES.section : HEADING_CLASSES.subsection;
    });

    /**
     * The tailwind classes of the heading, the eyebrow and the lead together.
     */
    protected readonly headerClasses: Signal<string> = computed(() => HEADER_CLASSES[this.align()]);
}