import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideExpandableTextConfig } from '@service-soft/ui/expandable-text';
import { describe, expect, test } from 'vitest';

import { provideShowcaseCardConfig } from './showcase-card-config.provider';
import { ShowcaseCardDetailsComponent } from './showcase-card-details.component';
import { ShowcaseCardImage } from './showcase-card-image.model';
import { ShowcaseCardLogo } from './showcase-card-logo.model';
import { ShowcaseCardComponent } from './showcase-card.component';

@Component({
    selector: 'ui-showcase-card-host',
    template: `
        <ui-showcase-card title="New website" start="2022-02" end="open" [summary]="summary" [image]="image" [tags]="tags" [logos]="logos">
        <ui-showcase-card-details><p>We moved 400 pages.</p></ui-showcase-card-details><a href="/references/club">Read more</a></ui-showcase-card>
        <ui-showcase-card title="Summer party" [start]="date()" />
    `,
    imports: [ShowcaseCardComponent, ShowcaseCardDetailsComponent]
})
class ShowcaseCardHostComponent {
    readonly summary: string = 'A website that a club maintains itself.';

    readonly image: ShowcaseCardImage = { src: '/photos/website.jpg', alt: 'The start page' };

    readonly tags: string[] = ['Angular', 'Tailwind'];

    readonly logos: ShowcaseCardLogo[] = [{ src: '/logos/club.svg', alt: 'SG Example', width: 120, height: 40 }];

    readonly date: WritableSignal<string | undefined> = signal('2026-07-03');
}

async function render(): Promise<[ComponentFixture<ShowcaseCardHostComponent>, HTMLElement[]]> {
    const fixture: ComponentFixture<ShowcaseCardHostComponent> = TestBed.createComponent(ShowcaseCardHostComponent);
    await fixture.whenStable();
    return [fixture, [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('ui-showcase-card')]];
}

describe('ShowcaseCardComponent', () => {
    test('is an article with its image, its title and period, summary, tags, logos, longer text and links', async () => {
        const [, [card]] = await render();
        const article: HTMLElement | null | undefined = card?.querySelector('ui-card article');

        expect(article?.querySelector('img[fill]')?.getAttribute('alt')).toBe('The start page');
        expect(article?.querySelector('hgroup h2')?.textContent).toBe('New website');
        expect(article?.querySelector('hgroup p')?.textContent.trim()).toBe('02/2022 – today');
        expect(article?.querySelector('hgroup time')?.getAttribute('datetime')).toBe('2022-02-01');
        expect(article?.querySelector(':scope > div > p')?.textContent).toBe('A website that a club maintains itself.');
        expect([...article?.querySelectorAll('ul[aria-label="Tags"] li ui-badge') ?? []].map(tag => tag.textContent.trim())).toEqual(['Angular', 'Tailwind']);
        expect(article?.querySelector('ul li img')?.getAttribute('alt')).toBe('SG Example');
        // the longer text shows its first lines and stays in the page, the links stay at the bottom
        const details: HTMLElement | null | undefined = article?.querySelector('ui-showcase-card-details ui-expandable-text > div');
        expect(details?.classList).toContain('line-clamp-3');
        expect(details?.textContent).toContain('We moved 400 pages.');
        expect(article?.querySelector(':scope > div > div:last-child > a')?.getAttribute('href')).toBe('/references/club');
    });

    test('leaves out what it isn\'t given, like the longer text and the period', async () => {
        const [fixture, [, card]] = await render();

        expect(card?.querySelector('hgroup p')?.textContent.trim()).toBe('07/2026');
        // the lists of tags and logos stay empty, which hides them
        expect(card?.querySelectorAll('img, li, ui-expandable-text')).toHaveLength(0);
        expect([...card?.querySelectorAll('ul') ?? []].map(list => list.classList.contains('empty:hidden'))).toEqual([true, true]);

        fixture.componentInstance.date.set(undefined);
        await fixture.whenStable();
        expect(card?.querySelector('hgroup p')).toBeNull();
    });

    test('takes its heading level and texts from the config', async () => {
        TestBed.configureTestingModule({
            providers: [provideShowcaseCardConfig({ headingLevel: 3, tagsLabel: 'Schlagworte' }), provideExpandableTextConfig({ lines: 5 })]
        });
        const [, [card]] = await render();

        expect(card?.querySelector('h3')?.textContent).toBe('New website');
        expect(card?.querySelector('ui-expandable-text > div')?.classList).toContain('line-clamp-5');
        expect(card?.querySelector('ul')?.getAttribute('aria-label')).toBe('Schlagworte');
    });
});