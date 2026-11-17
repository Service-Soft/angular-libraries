import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import { describe, expect, test } from 'vitest';

import { provideBylineConfig } from './byline-config.provider';
import { BylineItem } from './byline-item.model';
import { BylineComponent } from './byline.component';

@Component({
    selector: 'ui-byline-host',
    template: `
        <ui-byline author="Ada Lovelace" date="2026-11-15" category="Club news"
            [readingTime]="readingTime()" [showAvatar]="showAvatar()" [items]="items" />
    `,
    imports: [BylineComponent]
})
class BylineHostComponent {
    readonly readingTime: WritableSignal<number | undefined> = signal(5);

    readonly showAvatar: WritableSignal<boolean> = signal(false);

    readonly items: BylineItem[] = [{ text: '12 comments', icon: faComment }];
}

async function render(): Promise<[ComponentFixture<BylineHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<BylineHostComponent> = TestBed.createComponent(BylineHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the entries, without the separators between them.
function getEntries(root: HTMLElement): string[] {
    return [...root.querySelectorAll('p > :not([aria-hidden])')].map(entry => entry.textContent.trim());
}

describe('BylineComponent', () => {
    test('shows the entries that are set in one paragraph, separated by decorative dots', async () => {
        const [, root] = await render();

        expect(getEntries(root)).toEqual(['Ada Lovelace', 'Nov 15, 2026', '5 min read', 'Club news', '12 comments']);
        expect(root.querySelectorAll('p > [aria-hidden="true"]')).toHaveLength(4);
        expect(root.querySelector('time')?.getAttribute('datetime')).toBe('2026-11-15');
        expect(root.querySelector('ui-avatar')).toBeNull();
        // the icon of an entry of your own is decorative
        expect(root.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    });

    test('leaves out what isn\'t set and shows the avatar of the author when asked to', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.readingTime.set(undefined);
        fixture.componentInstance.showAvatar.set(true);
        await fixture.whenStable();

        expect(getEntries(root)).toEqual(['AL Ada Lovelace', 'Nov 15, 2026', 'Club news', '12 comments']);
        // decorative, the name next to it is read already
        expect(root.querySelector('ui-avatar > span')?.getAttribute('aria-hidden')).toBe('true');
    });

    test('writes the date and the reading time the way the app provides', async () => {
        TestBed.configureTestingModule({
            providers: [provideBylineConfig({ dateFormat: { year: 'numeric' }, readingTimeLabel: minutes => `${minutes} Min. Lesezeit` })]
        });
        const [, root] = await render();

        expect(getEntries(root).slice(1, 3)).toEqual(['2026', '5 Min. Lesezeit']);
    });
});