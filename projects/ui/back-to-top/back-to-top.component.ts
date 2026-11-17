import { afterNextRender, Component, DOCUMENT, inject, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons';
import { ButtonColor, ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { BackToTopConfig } from './back-to-top-config.model';
import { BACK_TO_TOP_CONFIG } from './back-to-top-config.provider';

/**
 * A button in the bottom end corner of the screen that goes back to the top of the page, like on a long page. It shows
 * once the page is scrolled further than the height of the screen, and moves the focus to the start of the page, so the
 * next Tab goes on from there. It scrolls smoothly, unless the user prefers reduced motion. Put it once in the layout
 * of the app. It is round, by the token --radius-floating-button. Its color and text come from provideBackToTopConfig.
 */
@Component({
    selector: 'ui-back-to-top',
    templateUrl: './back-to-top.component.html',
    imports: [ButtonComponent, IconComponent],
    host: {
        // below the snackbar, which covers it while a message shows. The scroll padding of the page keeps the button off
        // an element that is scrolled into view, like by the focus: the variant styles the root while this is on the page.
        class: 'fixed end-4 bottom-4 z-40 [:root:has(&)]:scroll-pb-20',
        // the ui-button inside is rounded by --radius-button, which takes the radius of floating buttons in here
        style: '--radius-button: var(--radius-floating-button)',
        '(window:scroll)': 'updateShown()'
    }
})
export class BackToTopComponent {
    private readonly document: Document = inject(DOCUMENT);

    private readonly config: BackToTopConfig = inject(BACK_TO_TOP_CONFIG);

    /**
     * The color token the button is drawn with, filled. The default comes from provideBackToTopConfig.
     */
    readonly color: InputSignal<ButtonColor> = input(this.config.color);

    /**
     * The texts of the button.
     */
    protected readonly labels: BackToTopConfig = this.config;

    /**
     * The arrow the button shows.
     */
    protected readonly icon: IconDefinition = faArrowUp;

    /**
     * Whether the button shows, once the top of the page is out of sight.
     */
    protected readonly shown: WritableSignal<boolean> = signal(false);

    constructor() {
        // a page can be scrolled already when this renders, like after going back in the history.
        afterNextRender(() => this.updateShown());
    }

    /**
     * Shows the button while the page is scrolled further than the height of the screen.
     */
    protected updateShown(): void {
        const window: Window | null = this.document.defaultView;
        this.shown.set(window != undefined && window.scrollY > window.innerHeight);
    }

    /**
     * Scrolls to the top of the page, and moves the focus to its start.
     */
    protected backToTop(): void {
        const window: Window | null = this.document.defaultView;
        if (window == undefined) {
            return;
        }
        this.focusStart();
        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }

    // the button disappears at the top, and the focus with it, which would leave the next Tab where the button was, at the
    // bottom. The body takes it instead, so the next Tab goes to the first element of the page, like after loading it. It
    // can only be focused with a tabindex, which goes again once it loses the focus, unless the page set one itself.
    private focusStart(): void {
        const body: HTMLElement = this.document.body;
        if (!body.hasAttribute('tabindex')) {
            body.setAttribute('tabindex', '-1');
            body.addEventListener('blur', () => body.removeAttribute('tabindex'), { once: true });
        }
        body.focus({ preventScroll: true });
    }
}