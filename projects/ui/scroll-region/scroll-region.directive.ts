import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input, InputSignal, signal, WritableSignal } from '@angular/core';

/**
 * Makes an element that scrolls sideways, like the box around a wide table, reachable with the keyboard while its
 * content is wider than it is: it then takes the focus, so the arrow keys scroll it, and is a region named by the given
 * label, so screen readers say what they are in. While everything fits, it is a plain box without a tab stop. Put it on
 * the box that scrolls, like `<div class="overflow-x-auto" uiScrollRegion="Orders"><table>…</table></div>`.
 */
@Directive({
    selector: '[uiScrollRegion]',
    host: {
        // offset inwards, since a box that scrolls cuts off what is drawn outside of it
        class: 'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
        '[attr.tabindex]': 'scrolls() ? 0 : null',
        '[attr.role]': 'scrolls() ? "region" : null',
        '[attr.aria-label]': 'scrolls() ? uiScrollRegion() : null'
    }
})
export class ScrollRegionDirective {
    /**
     * The name of the region, read by screen readers once it scrolls, like the name of the table inside of it.
     */
    readonly uiScrollRegion: InputSignal<string> = input.required<string>();

    /**
     * Whether its content is wider than it is.
     */
    protected readonly scrolls: WritableSignal<boolean> = signal(false);

    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    constructor() {
        // only the browser knows the widths, so the server renders a plain box. The box and what is in it are both
        // observed: content that grows, like a row with a longer text, doesn't change the size of the box itself.
        const destroyRef: DestroyRef = inject(DestroyRef);
        afterNextRender(() => {
            const observer: ResizeObserver = new ResizeObserver(() => this.updateScrolls());
            observer.observe(this.element);
            for (const child of this.element.children) {
                observer.observe(child);
            }
            this.updateScrolls();
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    private updateScrolls(): void {
        this.scrolls.set(this.element.scrollWidth > this.element.clientWidth);
    }
}