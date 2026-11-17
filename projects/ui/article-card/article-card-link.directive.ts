import { Directive } from '@angular/core';

// the link stretches over the whole card with a pseudo element, so a click, a middle click or the context menu anywhere
// on the card work like on the link itself, and the card is one link for screen readers and crawlers. The pseudo
// element draws the focus ring around the whole card. Hovering the card underlines the title, which says it is a link
// by more than the pointer.
const LINK_CLASSES: string = `
    text-on-surface no-underline decoration-2 underline-offset-4
    group-hover:underline
    after:absolute after:inset-0 after:rounded-card
    focus-visible:outline-none
    focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-primary
`;

/**
 * Marks the link of an article card, your own link with the title as its text:
 * `<a uiArticleCardLink routerLink="/news/summer-party">Summer party</a>`. The card shows it as its heading and makes
 * the whole card a target for it.
 */
@Directive({
    selector: 'a[uiArticleCardLink]',
    host: {
        class: LINK_CLASSES
    }
})
export class ArticleCardLinkDirective {}