import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BylineComponent } from '@service-soft/ui/byline';
import { describe, expect, test } from 'vitest';

import { provideArticleCardConfig } from './article-card-config.provider';
import { ArticleCardImage } from './article-card-image.model';
import { ArticleCardLinkDirective } from './article-card-link.directive';
import { ArticleCardComponent } from './article-card.component';

@Component({
    selector: 'ui-article-card-host',
    template: `
        <ui-article-card category="Club news" [image]="image"><a uiArticleCardLink href="/news/summer-party" (click)="follow($event)">Summer party</a>
            <p>Join us for <a href="/program" (click)="$event.preventDefault()">games</a> and music.</p><ui-byline author="Ada Lovelace" date="2026-07-03" />
        </ui-article-card>
    `,
    imports: [ArticleCardComponent, ArticleCardLinkDirective, BylineComponent]
})
class ArticleCardHostComponent {
    readonly image: ArticleCardImage = { src: '/photos/party.jpg', alt: 'Tables in the club garden' };

    followed: number = 0;

    // the test stays on its page
    follow(event: MouseEvent): void {
        event.preventDefault();
        this.followed++;
    }
}

async function render(): Promise<[ArticleCardHostComponent, HTMLElement]> {
    const fixture: ComponentFixture<ArticleCardHostComponent> = TestBed.createComponent(ArticleCardHostComponent);
    await fixture.whenStable();
    return [fixture.componentInstance, fixture.nativeElement as HTMLElement];
}

function click(element: Element | null | undefined, init: MouseEventInit = {}): void {
    element?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...init }));
}

describe('ArticleCardComponent', () => {
    test('is an article with its image, category and the link as its heading, on a card', async () => {
        const [, root] = await render();
        const article: HTMLElement | null = root.querySelector('ui-card article');

        expect(article?.querySelector('img')?.getAttribute('alt')).toBe('Tables in the club garden');
        expect(article?.querySelector('img')?.getAttribute('loading')).toBe('lazy');
        expect(article?.querySelector('ui-badge')?.textContent.trim()).toBe('Club news');
        expect(article?.querySelector('h2 > a')?.textContent).toBe('Summer party');
        expect(article?.querySelector('time')?.getAttribute('datetime')).toBe('2026-07-03');
        // the card is the box the link stretches over
        expect([...root.querySelector('ui-card')?.classList ?? []]).toEqual(expect.arrayContaining(['relative', 'rounded-card', 'shadow-1', 'hover:shadow-2']));
        expect(root.querySelector('a[uiArticleCardLink]')?.classList).toContain('after:inset-0');
    });

    test('follows the link on a plain click on its text, but not on a link of its own, a selection or a modified click', async () => {
        const [host, root] = await render();
        const excerpt: Element | null | undefined = root.querySelector('ui-card article p');

        click(excerpt);
        expect(host.followed).toBe(1);

        click(excerpt?.querySelector('a'));
        click(excerpt, { ctrlKey: true });
        click(excerpt, { button: 1 });
        expect(host.followed).toBe(1);

        // addRange does nothing while the selection has a range already, like a collapsed one an earlier test left behind
        const range: Range = document.createRange();
        range.selectNodeContents(excerpt ?? document.body);
        document.getSelection()?.removeAllRanges();
        document.getSelection()?.addRange(range);
        expect(document.getSelection()?.toString()).toContain('Join us for');
        click(excerpt);
        document.getSelection()?.removeAllRanges();
        expect(host.followed).toBe(1);

        // the link itself is followed by the browser, not a second time
        click(root.querySelector('a[uiArticleCardLink]'));
        expect(host.followed).toBe(2);
    });

    test('takes the heading level and the layout the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideArticleCardConfig({ headingLevel: 3, layout: 'horizontal' })] });
        const [, root] = await render();

        expect(root.querySelector('h3 > a')?.textContent).toBe('Summer party');
        expect(root.querySelector('article')?.classList).toContain('@xl:flex-row');
    });
});