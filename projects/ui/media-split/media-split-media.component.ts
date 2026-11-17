import { Component } from '@angular/core';

/**
 * The media of a `<ui-media-split>`, like an image or a video, which takes the width of its column:
 * `<ui-media-split-media><img ngSrc="…" alt="…" width="800" height="600" /></ui-media-split-media>`. Its corners are
 * rounded with the token --radius-media-split.
 */
@Component({
    selector: 'ui-media-split-media',
    templateUrl: './media-split-media.component.html',
    host: {
        // the media fills the width of the column and keeps its own aspect ratio. Clipped, so its corners follow the
        // radius whatever element it is.
        class: 'block overflow-clip rounded-media-split *:block *:h-auto *:w-full'
    }
})
export class MediaSplitMediaComponent {}