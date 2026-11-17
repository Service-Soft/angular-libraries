import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';

import { MediaSplitAlign } from './media-split-align.type';
import { MediaSplitConfig } from './media-split-config.model';
import { MEDIA_SPLIT_CONFIG } from './media-split-config.provider';
import { MediaSplitPosition } from './media-split-position.type';
import { MediaSplitWidth } from './media-split-width.type';

const BASE_CLASSES: string = 'grid gap-8';

// the columns in the order they show, from the width of the split itself rather than the screen, so it also stacks in a
// narrow column of a wide page. The columns have min-w-0, which lets them shrink below their longest word or widest
// image, which then wrap or scale instead of overflowing.
const COLUMN_CLASSES: Record<MediaSplitPosition, Record<MediaSplitWidth, string>> = {
    start: {
        narrow: '@3xl:grid-cols-[1fr_2fr]',
        half: '@3xl:grid-cols-2',
        wide: '@3xl:grid-cols-[3fr_2fr]'
    },
    end: {
        narrow: '@3xl:grid-cols-[2fr_1fr]',
        half: '@3xl:grid-cols-2',
        wide: '@3xl:grid-cols-[2fr_3fr]'
    }
};

const ALIGN_CLASSES: Record<MediaSplitAlign, string> = {
    start: '@3xl:items-start',
    center: '@3xl:items-center'
};

// the media stays first in the html, so screen readers and the stacked layout on narrow screens have the same order
// whichever side it is on; at the end it only moves there visually.
const MEDIA_POSITION_CLASSES: Record<MediaSplitPosition, string> = {
    start: 'min-w-0',
    end: 'min-w-0 @3xl:order-last'
};

/**
 * Media next to text, like an image beside a paragraph about it: `<ui-media-split><ui-media-split-media><img …/>
 * </ui-media-split-media><h2>…</h2><p>…</p></ui-media-split>`. Where the split is narrower than 48rem, the media
 * stands above the text. Splits below each other with the position switching between start and end zig-zag down a
 * page.
 * Unset inputs fall back to the values provided with provideMediaSplitConfig.
 */
@Component({
    selector: 'ui-media-split',
    templateUrl: './media-split.component.html',
    host: {
        // a container, so the split decides by its own width whether the media fits next to the text.
        class: 'block @container'
    }
})
export class MediaSplitComponent {
    private readonly config: MediaSplitConfig = inject(MEDIA_SPLIT_CONFIG);

    /**
     * On which side of the text the media stands while they are next to each other. The default comes from
     * provideMediaSplitConfig.
     */
    readonly position: InputSignal<MediaSplitPosition> = input<MediaSplitPosition>(this.config.position);

    /**
     * How much of the width the media takes while it is next to the text: a third, half, or three fifths. The default
     * comes from provideMediaSplitConfig.
     */
    readonly mediaWidth: InputSignal<MediaSplitWidth> = input<MediaSplitWidth>(this.config.mediaWidth);

    /**
     * How the media and the text line up while they are next to each other: at their tops, or centered on each other.
     * The default comes from provideMediaSplitConfig.
     */
    readonly align: InputSignal<MediaSplitAlign> = input<MediaSplitAlign>(this.config.align);

    /**
     * The tailwind classes of the grid.
     */
    protected readonly classes: Signal<string> = computed(() => {
        return `${BASE_CLASSES} ${COLUMN_CLASSES[this.position()][this.mediaWidth()]} ${ALIGN_CLASSES[this.align()]}`;
    });

    /**
     * The tailwind classes of the column of the media.
     */
    protected readonly mediaClasses: Signal<string> = computed(() => MEDIA_POSITION_CLASSES[this.position()]);
}