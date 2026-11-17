import { Component } from '@angular/core';

/**
 * A headline of `<ui-news-ticker>`, with your own link inside, drawn by ui-link: `<ui-news-ticker-item><a ui-link
 * appearance="subtle" routerLink="/news/summer-party">Summer party on July 12</a></ui-news-ticker-item>`. Every
 * headline after the first is separated from the one before by a line.
 */
@Component({
    selector: 'ui-news-ticker-item',
    templateUrl: './news-ticker-item.component.html',
    host: {
        // a list item of the list of the ticker, without being an li, which only the consumer could write.
        role: 'listitem',
        class: 'group flex items-center gap-3'
    }
})
export class NewsTickerItemComponent {}