import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, Signal } from '@angular/core';
import { LINK_CONFIG, LinkUtilities } from '@service-soft/ui/link';

import { LogoCloudConfig } from './logo-cloud-config.model';
import { LOGO_CLOUD_CONFIG } from './logo-cloud-config.provider';
import { LogoCloudLogo } from './logo-cloud-logo.model';
import { LogoCloudShownLogo } from './logo-cloud-shown-logo.model';

// how far a logo may leave the square of --spacing-logo-cloud: the width of a wide one, the height of a tall one
const MAX_WIDTH: number = 2.5;
const MAX_HEIGHT: number = 1.25;

// an image as wide as its aspect ratio makes it at the height of its area, and never wider than the page
const IMAGE_CLASSES: string = 'w-auto max-w-full object-contain';

// gray until the pointer is on its logo or its link has the focus. The color fades in and out slowly enough to be seen
// as a fade, not as a jump.
const GRAYSCALE_CLASSES: string = `
    grayscale
    group-hover:grayscale-0
    group-focus-within:grayscale-0
    motion-safe:transition-[filter] motion-safe:duration-500 motion-safe:ease-in-out
`;

/**
 * The logos of sponsors, partners or certificates, next to each other and wrapping into rows, each with the area of a
 * square of the token --spacing-logo-cloud whatever the size of its image, so a wide wordmark looks as big as a square
 * logo: `<ui-logo-cloud [logos]="[{ src: '/sponsors/acme.svg', alt:
 * 'Acme', width: 160, height: 48, href: 'https://acme.example' }]" />`. A logo with an href is a link, which opens in a
 * new tab by default and then tells screen readers so. Images load with NgOptimizedImage, data urls as they are.
 * Logos without their own openInNewTab use the one provided with provideLogoCloudConfig. With grayscale, the logos are
 * gray until the pointer is on one or its link has the focus, so a row of colorful logos doesn't compete with the page.
 */
@Component({
    selector: 'ui-logo-cloud',
    templateUrl: './logo-cloud.component.html',
    imports: [NgOptimizedImage, NgTemplateOutlet],
    host: {
        class: 'block'
    }
})
export class LogoCloudComponent {
    private readonly config: LogoCloudConfig = inject(LOGO_CLOUD_CONFIG);

    /**
     * The logos, in the order they show.
     */
    readonly logos: InputSignal<LogoCloudLogo[]> = input.required<LogoCloudLogo[]>();

    /**
     * Whether the logos are gray until the pointer is on them or their link has the focus.
     */
    readonly grayscale: InputSignalWithTransform<boolean, unknown> = input(this.config.grayscale, { transform: booleanAttribute });

    /**
     * The tailwind classes of an image, gray until the pointer is on its logo with grayscale.
     */
    protected readonly imageClasses: Signal<string> = computed(() => {
        return this.grayscale() ? `${IMAGE_CLASSES} ${GRAYSCALE_CLASSES}` : IMAGE_CLASSES;
    });

    // a link of its own rather than ui-link, which would mark a link to another site with an icon after the logo. It
    // only gets the focus ring of a plain link around the logo.
    /**
     * The tailwind classes of a linked logo.
     */
    protected readonly linkClasses: string = LinkUtilities.getClasses('plain', false);

    /**
     * Read after a logo whose link opens in a new tab.
     */
    protected readonly newTabLabel: string = inject(LINK_CONFIG).newTabLabel;

    /**
     * The logos with everything decided.
     */
    protected readonly shownLogos: Signal<LogoCloudShownLogo[]> = computed(() => this.logos().map(logo => ({
        src: logo.src,
        alt: logo.alt,
        width: logo.width,
        height: logo.height,
        shownHeight: `calc(var(--spacing-logo-cloud) * ${this.resolveHeightFactor(logo.width / logo.height)})`,
        href: logo.href,
        opensNewTab: logo.href != undefined && (logo.openInNewTab ?? this.config.openInNewTab),
        // NgOptimizedImage refuses data urls
        optimized: !logo.src.startsWith('data:')
    })));

    /**
     * Resolves the height of a logo as a part of --spacing-logo-cloud. Every logo gets the area of a square of that size,
     * as one height for all would make a wide wordmark look far bigger than a square logo. A wide one is at most two and
     * a half squares wide, a tall one at most a quarter higher than a square.
     * @param aspectRatio - The width of the logo divided by its height.
     * @returns The part, rounded to three decimals.
     */
    private resolveHeightFactor(aspectRatio: number): number {
        const factor: number = Math.min(1 / Math.sqrt(aspectRatio), MAX_WIDTH / aspectRatio, MAX_HEIGHT);
        return Math.round(factor * 1000) / 1000;
    }
}