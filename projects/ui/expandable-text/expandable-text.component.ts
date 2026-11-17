import { afterNextRender, afterRenderEffect, Component, computed, DestroyRef, ElementRef, inject, input, InputSignal, model, ModelSignal, signal, Signal, viewChild, WritableSignal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';

import { ExpandableTextConfig } from './expandable-text-config.model';
import { EXPANDABLE_TEXT_CONFIG } from './expandable-text-config.provider';
import { ExpandableTextLines } from './expandable-text-lines.type';

// line-clamp cuts the text after its lines visually only: the whole text stays in the page, for screen readers,
// search engines and the search of the browser, which finds a word in the hidden part too, without showing it.
// Paragraphs inside are spaced like the text of a card.
const CLAMP_CLASSES: Record<ExpandableTextLines | 'none', string> = {
    1: 'line-clamp-1 *:not-first:mt-3',
    2: 'line-clamp-2 *:not-first:mt-3',
    3: 'line-clamp-3 *:not-first:mt-3',
    4: 'line-clamp-4 *:not-first:mt-3',
    5: 'line-clamp-5 *:not-first:mt-3',
    6: 'line-clamp-6 *:not-first:mt-3',
    none: 'line-clamp-none *:not-first:mt-3'
};

// the last line fades out, which says there is more. A mask instead of a gradient of the surface over the text, so it
// works on every background, also on a card or a colored surface; it only takes the alpha of its colors.
const FADE_MASK: string = 'linear-gradient(to top, transparent, #000 1.5em)';

let nextId: number = 0;

/**
 * A longer text that shows its first lines, with a button that shows all of it in place, like the description of a
 * project: `<ui-expandable-text [lines]="3"><p>…</p></ui-expandable-text>`. The last line fades out while it is closed.
 * The whole text is always in the page, so screen readers and search engines read all of it. The button only shows
 * when the text has more lines, which the browser measures, also when the width changes; a page rendered on the server
 * shows it, as the text of an expandable text is usually longer, and the browser takes it away if it isn't.
 * Unset inputs fall back to the values provided with provideExpandableTextConfig.
 */
@Component({
    selector: 'ui-expandable-text',
    templateUrl: './expandable-text.component.html',
    imports: [ButtonComponent],
    host: {
        class: 'flex flex-col items-start gap-1'
    }
})
export class ExpandableTextComponent {
    private readonly config: ExpandableTextConfig = inject(EXPANDABLE_TEXT_CONFIG);
    private readonly content: Signal<ElementRef<HTMLElement>> = viewChild.required<ElementRef<HTMLElement>>('content');

    /**
     * How many lines show while it is closed, from 1 to 6. The default comes from provideExpandableTextConfig.
     */
    readonly lines: InputSignal<ExpandableTextLines> = input<ExpandableTextLines>(this.config.lines);

    /**
     * The text of the button that opens it. The default comes from provideExpandableTextConfig.
     */
    readonly moreLabel: InputSignal<string> = input<string>(this.config.moreLabel);

    /**
     * The text of the button that closes it again. The default comes from provideExpandableTextConfig.
     */
    readonly lessLabel: InputSignal<string> = input<string>(this.config.lessLabel);

    /**
     * Whether all of the text shows. The user opens and closes it, bind it with [(expanded)] to know or change it.
     */
    readonly expanded: ModelSignal<boolean> = model(false);

    /**
     * Whether the text has more lines than show while it is closed, which is when the button shows.
     */
    // true until the browser measured it: the server can't, and the text of an expandable text is usually longer, so
    // the guess of the server is usually right and nothing moves once the page runs in the browser.
    protected readonly overflows: WritableSignal<boolean> = signal(true);

    /**
     * The id of the text, which the button controls.
     */
    protected readonly contentId: string = `ui-expandable-text-${nextId++}`;

    /**
     * The tailwind classes of the text.
     */
    protected readonly contentClasses: Signal<string> = computed(() => CLAMP_CLASSES[this.expanded() ? 'none' : this.lines()]);

    /**
     * The mask that fades out the last line, while there is more.
     */
    protected readonly mask: Signal<string | undefined> = computed(() => !this.expanded() && this.overflows() ? FADE_MASK : undefined);

    constructor() {
        const destroyRef: DestroyRef = inject(DestroyRef);
        // measured again whenever it closes or shows another number of lines, and when its width changes, which wraps
        // the text into another number of lines.
        afterRenderEffect(() => {
            this.lines();
            if (!this.expanded()) {
                this.measure();
            }
        });
        afterNextRender(() => {
            const observer: ResizeObserver = new ResizeObserver(() => {
                if (!this.expanded()) {
                    this.measure();
                }
            });
            observer.observe(this.content().nativeElement);
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    // a clamped text is as high as its lines, its content as high as all of it. The pixel allows for rounding.
    private measure(): void {
        const element: HTMLElement = this.content().nativeElement;
        this.overflows.set(element.scrollHeight > element.clientHeight + 1);
    }
}