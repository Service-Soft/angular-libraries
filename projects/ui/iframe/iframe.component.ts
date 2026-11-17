import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { IframeConfig } from './iframe-config.model';
import { IFRAME_CONFIG } from './iframe-config.provider';

// in the ratio its width takes the full width of its parent, without one it fills the parent, like a box of the app
// with a ratio of its own. The radius is the token --radius-iframe.
const SIZE_CLASSES: Record<'ratio' | 'fill', string> = {
    ratio: 'block w-full rounded-iframe',
    fill: 'block size-full rounded-iframe'
};

/**
 * An embedded page of another site, like a video or a map, on a native iframe that loads once it is close to the
 * screen: `<ui-iframe src="https://www.youtube-nocookie.com/embed/…" label="Video: Our club" />`. The label is its
 * title, which screen readers read. It keeps its aspect ratio, 16 / 9 by default, so it reserves its space before it
 * loads. Put it into a ui-consent-gate to load it only after consent.
 * The src is trusted as it is, so it has to be a url of your app, never one a user typed; only http and https are
 * allowed. Unset inputs fall back to the values provided with provideIframeConfig.
 */
@Component({
    selector: 'ui-iframe',
    templateUrl: './iframe.component.html',
    host: {
        class: 'block'
    }
})
export class IframeComponent {
    private readonly config: IframeConfig = inject(IFRAME_CONFIG);

    private readonly sanitizer: DomSanitizer = inject(DomSanitizer);

    /**
     * The url of the page to embed, an http or https url of your app.
     */
    readonly src: InputSignal<string> = input.required<string>();

    /**
     * What the embedded page is, like 'Map of the practice'. It is the title of the iframe, which screen readers read.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * The ratio of its width to its height, like '16 / 9' or '4 / 3', or undefined to fill the height of its parent.
     */
    readonly aspectRatio: InputSignal<string | undefined> = input<string | undefined>(this.config.aspectRatio);

    /**
     * The src, trusted as the url of a resource.
     */
    // angular refuses a bound src of an iframe that isn't trusted, as it could load anything into the page.
    protected readonly trustedSrc: Signal<SafeResourceUrl> = computed(() => {
        const src: string = this.src();
        this.validateSource(src);
        return this.sanitizer.bypassSecurityTrustResourceUrl(src);
    });

    /**
     * The tailwind classes of the iframe.
     */
    protected readonly classes: Signal<string> = computed(() => SIZE_CLASSES[this.aspectRatio() == undefined ? 'fill' : 'ratio']);

    // a javascript: url would run in the origin of the page, the one thing trusting the src must never allow.
    private validateSource(src: string): void {
        const protocol: string = new URL(src, 'https://localhost').protocol;
        if (protocol !== 'https:' && protocol !== 'http:') {
            throw new Error(`ui-iframe only loads http and https urls, not "${src}".`);
        }
    }
}