import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, input, InputSignal, signal, Signal, viewChild, WritableSignal } from '@angular/core';
import { faPause, faPlay } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { NewsTickerColor } from './news-ticker-color.type';
import { NewsTickerConfig } from './news-ticker-config.model';
import { NEWS_TICKER_CONFIG } from './news-ticker-config.provider';

// like a filled card: neutral in the container color, a theme color as a colored surface, which gives the headlines, the
// button and the actions the on- colors of it.
const COLOR_CLASSES: Record<NewsTickerColor, string> = {
    neutral: 'bg-surface-container text-on-surface',
    primary: 'surface-primary',
    secondary: 'surface-secondary'
};

const BASE_CLASSES: string = 'flex items-center gap-3 px-4 py-2 text-body';

// moving, the list starts as far after the start as the ticker is wide, so the headlines move in from its end, and moves
// by its own width, out at the start. That needs no second copy of the headlines, which screen readers would read twice.
// As wide as its headlines, so they stay in one line.
// Only with motion-safe: with reduced motion, the headlines stand still and wrap, so all of them can be read.
const MOVING_TRACK_CLASSES: string = `
    flex items-center gap-x-3 gap-y-1
    motion-safe:w-max motion-safe:ps-[100%]
    motion-safe:ltr:animate-news-ticker
    motion-safe:rtl:animate-news-ticker-rtl
    motion-reduce:flex-wrap
`;

// with the focus of a keyboard inside, the headlines stand still and wrap like with reduced motion: a focused headline
// that moves on, or that the browser scrolls into view of the hidden overflow, couldn't be read.
const STILL_TRACK_CLASSES: string = 'flex flex-wrap items-center gap-x-3 gap-y-1';

/**
 * A bar of headlines that move through it from the end to the start, like the latest news on a home page: an icon,
 * a `<ui-news-ticker-item>` with your own link for each headline, and optional `<ui-news-ticker-actions>`, like a link
 * to all news, which stay at the end. A button stops and moves the headlines, and so does hovering them. With the focus
 * of a keyboard inside, or when the user prefers reduced motion, they stand still and wrap instead.
 * Unset inputs fall back to the values provided with provideNewsTickerConfig.
 */
@Component({
    selector: 'ui-news-ticker',
    templateUrl: './news-ticker.component.html',
    imports: [ButtonComponent, IconComponent],
    host: {
        class: 'block'
    }
})
export class NewsTickerComponent {
    private readonly config: NewsTickerConfig = inject(NEWS_TICKER_CONFIG);

    private readonly viewport: Signal<ElementRef<HTMLElement>> = viewChild.required<ElementRef<HTMLElement>>('viewport');

    private readonly track: Signal<ElementRef<HTMLElement>> = viewChild.required<ElementRef<HTMLElement>>('track');

    /**
     * The background. The default comes from provideNewsTickerConfig.
     */
    readonly color: InputSignal<NewsTickerColor> = input<NewsTickerColor>(this.config.color);

    /**
     * The icon at the start, or undefined for none. The default comes from provideNewsTickerConfig, a bullhorn.
     */
    readonly icon: InputSignal<IconDefinition | undefined> = input<IconDefinition | undefined>(this.config.icon);

    /**
     * How fast the headlines move, in pixels per second, however many there are. The default comes from
     * provideNewsTickerConfig.
     */
    readonly speed: InputSignal<number> = input<number>(this.config.speed);

    /**
     * What screen readers call the ticker. Give each one its own when a page has more than one.
     */
    readonly label: InputSignal<string> = input<string>(this.config.label);

    /**
     * The texts of the button.
     */
    protected readonly labels: NewsTickerConfig = this.config;

    /**
     * Whether the user stopped the headlines with the button.
     */
    protected readonly paused: WritableSignal<boolean> = signal(false);

    /**
     * The icon of the button, which says what it does.
     */
    protected readonly toggleIcon: Signal<IconDefinition> = computed(() => this.paused() ? faPlay : faPause);

    /**
     * The tailwind classes of the ticker.
     */
    protected readonly classes: Signal<string> = computed(() => `${BASE_CLASSES} ${COLOR_CLASSES[this.color()]}`);

    // the focus of a keyboard is inside the headlines, which then stand still.
    private readonly keyboardFocusInside: WritableSignal<boolean> = signal(false);

    /**
     * The tailwind classes of the list of the headlines.
     */
    protected readonly trackClasses: Signal<string> = computed(() => {
        return this.keyboardFocusInside() ? STILL_TRACK_CLASSES : MOVING_TRACK_CLASSES;
    });

    /**
     * Whether the pointer is on the headlines, which then stop, so one can be clicked.
     */
    protected readonly hovered: WritableSignal<boolean> = signal(false);

    // inline, like the duration: a class for it would lose against the animation shorthand of the theme, which resets the
    // play state, depending on the order of their rules in the stylesheet.
    /**
     * Whether the headlines stop where they are, by the button or the pointer.
     */
    protected readonly playState: Signal<'paused' | undefined> = computed(() => this.paused() || this.hovered() ? 'paused' : undefined);

    // the way the list moves is as long as its own width, which grows with the headlines, so a fixed duration would move
    // a long list faster than a short one. Undefined until measured in the browser, the theme has a fallback.
    private readonly width: WritableSignal<number | undefined> = signal(undefined);

    /**
     * How long the headlines take for their way through the ticker, in seconds.
     */
    protected readonly duration: Signal<number | undefined> = computed(() => {
        const width: number | undefined = this.width();
        return width == undefined ? undefined : width / this.speed();
    });

    constructor() {
        const destroyRef: DestroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const track: HTMLElement = this.track().nativeElement;
            const observer: ResizeObserver = new ResizeObserver(() => this.width.set(track.offsetWidth));
            observer.observe(track);
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    /**
     * Stops or moves the headlines.
     */
    protected togglePaused(): void {
        this.paused.update(paused => !paused);
    }

    // a click focuses a link as well, but without :focus-visible: only the keyboard stops the headlines, so the link
    // doesn't move away under the pointer while it is clicked.
    /**
     * Stops the headlines when the keyboard moved the focus to one of them.
     * @param event - The focusin event.
     */
    protected onFocusIn(event: FocusEvent): void {
        if (event.target instanceof Element && event.target.matches(':focus-visible')) {
            this.keyboardFocusInside.set(true);
        }
    }

    /**
     * Moves the headlines again once the focus left them.
     * @param event - The focusout event.
     */
    protected onFocusOut(event: FocusEvent): void {
        if (!(event.relatedTarget instanceof Node) || !this.viewport().nativeElement.contains(event.relatedTarget)) {
            this.keyboardFocusInside.set(false);
        }
    }
}