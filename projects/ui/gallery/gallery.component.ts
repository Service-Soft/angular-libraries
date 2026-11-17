import { NgOptimizedImage } from '@angular/common';
import { afterRenderEffect, Component, computed, inject, input, InputSignal, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { faChevronLeft, faChevronRight, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { DialogComponent } from '@service-soft/ui/dialog';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { GalleryConfig } from './gallery-config.model';
import { GALLERY_CONFIG } from './gallery-config.provider';
import { GalleryImage } from './gallery-image.model';

// set by the angular cli and false in production builds, which then leave out everything it guards.
declare const ngDevMode: unknown;

/**
 * Pictures as a grid of thumbnails, each of which opens the picture large in a dialog over the whole screen, with its
 * caption, where it is among the others, like '3 / 12', and buttons to the one before and after:
 * `<ui-gallery [images]="[{ src: '/photos/party-1.jpg', alt: 'The band on stage' }]" />`. The arrow keys show the
 * picture before and after as well, and escape closes it. The dialog is a native one, which keeps the focus inside and
 * returns it to the thumbnail when it closes. Every picture needs an alt, which development builds check.
 * Its texts for screen readers come from provideGalleryConfig.
 */
@Component({
    selector: 'ui-gallery',
    templateUrl: './gallery.component.html',
    imports: [ButtonComponent, DialogComponent, IconComponent, NgOptimizedImage],
    host: {
        // a container, so the number of thumbnails in a row follows its own width.
        class: 'block @container'
    }
})
export class GalleryComponent {
    private readonly dialog: Signal<DialogComponent> = viewChild.required(DialogComponent);

    /**
     * The texts for screen readers.
     */
    protected readonly config: GalleryConfig = inject(GALLERY_CONFIG);

    /**
     * The pictures, in the order they show.
     */
    readonly images: InputSignal<GalleryImage[]> = input.required<GalleryImage[]>();

    /**
     * The index of the picture that shows large, undefined while the dialog is closed.
     */
    protected readonly index: WritableSignal<number | undefined> = signal(undefined);

    /**
     * The picture that shows large.
     */
    protected readonly shown: Signal<GalleryImage | undefined> = computed(() => {
        const index: number | undefined = this.index();
        return index == undefined ? undefined : this.images()[index];
    });

    /**
     * Where the picture that shows is among the others, starting at 1.
     */
    protected readonly position: Signal<number> = computed(() => (this.index() ?? 0) + 1);

    /**
     * What screen readers read when a picture shows.
     */
    protected readonly announcement: Signal<string> = computed(() => {
        const shown: GalleryImage | undefined = this.shown();
        return shown == undefined ? '' : `${this.config.positionLabel(this.position(), this.images().length)}: ${shown.alt}`;
    });

    /**
     * The icon of the button that closes the dialog.
     */
    protected readonly closeIcon: IconDefinition = faXmark;

    /**
     * The icon of the button that shows the picture before.
     */
    protected readonly previousIcon: IconDefinition = faChevronLeft;

    /**
     * The icon of the button that shows the picture after.
     */
    protected readonly nextIcon: IconDefinition = faChevronRight;

    constructor() {
        if (typeof ngDevMode === 'undefined' || ngDevMode) {
            // after rendering, like the check of an icon-only button, so a missing alt is logged instead of breaking the
            // page.
            afterRenderEffect(() => this.validateAltTexts(this.images()));
        }
    }

    /**
     * Shows a picture large.
     * @param index - The index of the picture.
     */
    protected open(index: number): void {
        this.index.set(index);
        this.dialog().open();
    }

    /**
     * Shows the picture before or after the one that shows, the last one before the first and the first after the last.
     * @param step - -1 for the one before, 1 for the one after.
     */
    protected move(step: number): void {
        const count: number = this.images().length;
        this.index.update((index = 0) => (index + step + count) % count);
    }

    /**
     * Shows the picture before or after on the arrow keys, which point the other way in a right-to-left language.
     * @param event - The key that was pressed in the dialog.
     * @param step - -1 for the left arrow, 1 for the right one.
     */
    protected moveByArrow(event: Event, step: number): void {
        if (!(event.currentTarget instanceof Element)) {
            return;
        }
        event.preventDefault();
        const isRightToLeft: boolean = getComputedStyle(event.currentTarget).direction === 'rtl';
        this.move(isRightToLeft ? -step : step);
    }

    // every picture is the name of the button that opens it, and what screen readers read in the dialog. Thrown errors
    // go to the ErrorHandler, which logs them without breaking the app.
    private validateAltTexts(images: GalleryImage[]): void {
        const missing: GalleryImage | undefined = images.find(image => image.alt.trim() === '');
        if (missing != undefined) {
            throw new Error(`Every picture of a ui-gallery needs an alt, ${missing.src} has none.`);
        }
    }
}