import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, input, InputSignal, linkedSignal, LOCALE_ID, Signal, WritableSignal } from '@angular/core';

import { StatColor } from './stat-color.type';
import { StatConfig } from './stat-config.model';
import { STAT_CONFIG } from './stat-config.provider';

// secondary itself is too light for text on the surface.
const COLOR_CLASSES: Record<StatColor, string> = {
    neutral: 'text-on-surface',
    primary: 'text-primary',
    secondary: 'text-secondary-text'
};

// digits of the same width, so the number doesn't jitter while it counts.
const NUMBER_BASE_CLASSES: string = 'grid font-heading text-display tabular-nums';

/**
 * A number that stands out, with what it counts below it, like '1,200 members': `<ui-stat [value]="1200" label="Members"
 * prefix="+" />`. It is written with Intl in the language of the app (LOCALE_ID). In the browser it counts up from 0
 * once it scrolls into view, unless the user prefers reduced motion; the page rendered on the server, search engines and
 * screen readers always get the final value. Place stats next to each other with a grid of your own.
 * Unset inputs fall back to the values provided with provideStatConfig.
 */
@Component({
    selector: 'ui-stat',
    templateUrl: './stat.component.html',
    host: {
        class: 'flex flex-col gap-1'
    }
})
export class StatComponent {
    private readonly config: StatConfig = inject(STAT_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    /**
     * The number, like 1200.
     */
    readonly value: InputSignal<number> = input.required<number>();

    /**
     * What the number counts, below it, like 'Members'.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * What stands right before the number, like '+'.
     */
    readonly prefix: InputSignal<string> = input<string>('');

    /**
     * What stands right after the number, like '%' or ' km'.
     */
    readonly suffix: InputSignal<string> = input<string>('');

    /**
     * How the number is written, like `{ maximumFractionDigits: 1 }` or `{ notation: 'compact' }` for '1.2K'. The
     * default comes from provideStatConfig.
     */
    readonly format: InputSignal<Intl.NumberFormatOptions> = input<Intl.NumberFormatOptions>(this.config.format);

    /**
     * The color of the number. The default comes from provideStatConfig.
     */
    readonly color: InputSignal<StatColor> = input<StatColor>(this.config.color);

    /**
     * How long the number counts up, in milliseconds. The default comes from provideStatConfig.
     */
    readonly duration: InputSignal<number> = input<number>(this.config.duration);

    // the value that shows while it counts. Linked to the value, so a new value shows right away, and so does the value
    // wherever nothing counts: on the server, with reduced motion and before it scrolled into view.
    private readonly shownValue: WritableSignal<number> = linkedSignal(() => this.value());

    private readonly formatter: Signal<Intl.NumberFormat> = computed(() => new Intl.NumberFormat(this.locale, this.format()));

    // while it counts, the number keeps the fraction digits of the final value, like '4.5' with one: the default of up
    // to three digits would flicker through values like '2.718' on the way.
    private readonly countFormatter: Signal<Intl.NumberFormat> = computed(() => {
        const parts: Intl.NumberFormatPart[] = this.formatter().formatToParts(this.value());
        const fraction: Intl.NumberFormatPart | undefined = parts.find(part => part.type === 'fraction');
        const digits: number = fraction?.value.length ?? 0;
        return new Intl.NumberFormat(this.locale, { ...this.format(), minimumFractionDigits: digits, maximumFractionDigits: digits });
    });

    /**
     * The final value as text, which screen readers read and which keeps the space the number needs while it counts.
     */
    protected readonly text: Signal<string> = computed(() => `${this.prefix()}${this.formatter().format(this.value())}${this.suffix()}`);

    /**
     * The value that shows while it counts, as text.
     */
    protected readonly shownText: Signal<string> = computed(() => {
        const shown: number = this.shownValue();
        const number: string = shown === this.value() ? this.formatter().format(shown) : this.countFormatter().format(shown);
        return `${this.prefix()}${number}${this.suffix()}`;
    });

    /**
     * The tailwind classes of the number.
     */
    protected readonly numberClasses: Signal<string> = computed(() => `${NUMBER_BASE_CLASSES} ${COLOR_CLASSES[this.color()]}`);

    private frame: number | undefined;

    constructor() {
        const destroyRef: DestroyRef = inject(DestroyRef);
        // only in the browser: the server renders the final value, which is what the page it renders holds.
        afterNextRender(() => {
            // counting moves the number, which is no movement for users who prefer less of it.
            if (!window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
                return;
            }
            const observer: IntersectionObserver = new IntersectionObserver(entries => {
                if (!entries.some(entry => entry.isIntersecting)) {
                    return;
                }
                observer.disconnect();
                this.countUp();
            });
            observer.observe(this.element);
            destroyRef.onDestroy(() => {
                observer.disconnect();
                if (this.frame != undefined) {
                    cancelAnimationFrame(this.frame);
                }
            });
        });
    }

    // counts from 0 the moment it scrolls into view, not before, so a stat that is never scrolled to, or a page that is
    // printed, shows the final value. Fast at first and slowing down towards the value.
    private countUp(): void {
        const start: number = performance.now();
        const step: FrameRequestCallback = (now: number) => {
            const progress: number = Math.min(Math.max((now - start) / this.duration(), 0), 1);
            this.shownValue.set(this.value() * (1 - ((1 - progress) ** 3)));
            this.frame = progress < 1 ? requestAnimationFrame(step) : undefined;
        };
        this.shownValue.set(0);
        this.frame = requestAnimationFrame(step);
    }
}