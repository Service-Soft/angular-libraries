import { NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { LINK_CONFIG, LinkUtilities } from '@service-soft/ui/link';

import { LogoCloudConfig } from './logo-cloud-config.model';
import { LOGO_CLOUD_CONFIG } from './logo-cloud-config.provider';
import { LogoCloudLogo } from './logo-cloud-logo.model';
import { LogoCloudShownLogo } from './logo-cloud-shown-logo.model';

/**
 * The logos of sponsors, partners or certificates, next to each other and wrapping into rows, each as high as the token
 * --spacing-logo-cloud whatever the size of its image: `<ui-logo-cloud [logos]="[{ src: '/sponsors/acme.svg', alt:
 * 'Acme', width: 160, height: 48, href: 'https://acme.example' }]" />`. A logo with an href is a link, which opens in a
 * new tab by default and then tells screen readers so. Images load with NgOptimizedImage, data urls as they are.
 * Logos without their own openInNewTab use the one provided with provideLogoCloudConfig.
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
        href: logo.href,
        opensNewTab: logo.href != undefined && (logo.openInNewTab ?? this.config.openInNewTab),
        // NgOptimizedImage refuses data urls
        optimized: !logo.src.startsWith('data:')
    })));
}