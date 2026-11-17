import { Component } from '@angular/core';

/**
 * The actions of a ui-news-ticker, like a link to all news. Put it inside of the ticker, and it shows at its end, where
 * it doesn't move.
 */
@Component({
    selector: 'ui-news-ticker-actions',
    templateUrl: './news-ticker-actions.component.html',
    host: { class: 'flex shrink-0 items-center gap-2' }
})
export class NewsTickerActionsComponent {}