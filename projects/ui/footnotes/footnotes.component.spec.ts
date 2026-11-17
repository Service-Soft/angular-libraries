import { APP_BASE_HREF } from '@angular/common';
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, test } from 'vitest';

import { FootnoteComponent } from './footnote.component';
import { provideFootnotesConfig } from './footnotes-config.provider';
import { FootnotesComponent } from './footnotes.component';

@Component({
    selector: 'ui-footnotes-host',
    template: `
        @if (showsFirst()) {<p>Founded<ui-footnote [list]="sources">Chronicle, page 4.</ui-footnote>.</p>}
        <p>Members<ui-footnote [list]="sources">Report <a href="/report">2025</a>.</ui-footnote> and a pool<ui-footnote [list]="notes">1972.</ui-footnote></p>
        <ui-footnotes #sources idPrefix="sources" /><ui-footnotes #notes label="Notes" />
    `,
    imports: [FootnoteComponent, FootnotesComponent]
})
class FootnotesHostComponent {
    readonly showsFirst: WritableSignal<boolean> = signal(true);
}

/**
 * A reference in the text: its number, its href, its name and what describes it.
 */
type Reference = [string, string, string, string];

/**
 * A footnote of a list: its id, its text and the href and name of its link back.
 */
type Note = [string, string, string, string];

async function render(): Promise<[ComponentFixture<FootnotesHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<FootnotesHostComponent> = TestBed.createComponent(FootnotesHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// cspell:ignore noteref
function findReferences(root: HTMLElement): Reference[] {
    return [...root.querySelectorAll('p sup > a[role="doc-noteref"]')].map(link => [
        link.textContent,
        link.getAttribute('href') ?? '',
        link.getAttribute('aria-label') ?? '',
        root.querySelector(`#${link.getAttribute('aria-describedby')}`)?.textContent.trim() ?? ''
    ]);
}

function findNotes(list: Element | null | undefined): Note[] {
    return [...list?.querySelectorAll('ol > li') ?? []].map(item => {
        const back: Element | null = item.querySelector('a[role="doc-backlink"]');
        return [item.id, item.querySelector('span')?.textContent.trim() ?? '', back?.getAttribute('href') ?? '', back?.getAttribute('aria-label') ?? ''];
    });
}

describe('FootnotesComponent and FootnoteComponent', () => {
    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [{ provide: APP_BASE_HREF, useValue: '/' }] });
    });

    test('number the references of each list by their order, link to their footnotes and back, and are described by them', async () => {
        const [, root] = await render();
        const path: string = location.pathname;
        const [sources, notes] = root.querySelectorAll('ui-footnotes');

        expect(findReferences(root)).toEqual([
            ['1', `${path}#sources-note-1`, 'Footnote 1', 'Chronicle, page 4.'],
            ['2', `${path}#sources-note-2`, 'Footnote 2', 'Report 2025.'],
            ['1', expect.stringMatching(/#ui-footnotes-\d+-note-1$/), 'Footnote 1', '1972.']
        ]);
        expect(findNotes(sources)).toEqual([
            ['sources-note-1', 'Chronicle, page 4.', `${path}#sources-ref-1`, 'Back to reference 1'],
            ['sources-note-2', 'Report 2025.', `${path}#sources-ref-2`, 'Back to reference 2']
        ]);
        expect(root.querySelector('#sources-ref-2')?.textContent).toBe('2');
        expect(sources?.querySelector('section')?.getAttribute('aria-label')).toBe('Footnotes');
        expect(notes?.querySelector('section')?.getAttribute('aria-label')).toBe('Notes');
        // the content of a footnote shows in the list only, with its links
        expect(root.querySelector('p')?.textContent).toBe('Founded1.');
        expect(sources?.querySelector('li span a')?.getAttribute('href')).toBe('/report');
    });

    test('number again when a reference is gone', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.showsFirst.set(false);
        await fixture.whenStable();

        expect(findReferences(root).map(([number, href]) => [number, href.split('#')[1]])).toEqual([['1', 'sources-note-1'], ['1', expect.any(String)]]);
        expect(findNotes(root.querySelector('ui-footnotes')).map(([id, text]) => [id, text])).toEqual([['sources-note-1', 'Report 2025.']]);
    });

    test('take their texts from the config', async () => {
        TestBed.configureTestingModule({
            providers: [provideFootnotesConfig({ label: 'Quellen', referenceLabel: number => `Fußnote ${number}`, backLabel: number => `Zurück zu ${number}` })]
        });
        const [, root] = await render();

        expect(root.querySelector('section')?.getAttribute('aria-label')).toBe('Quellen');
        expect(findReferences(root)[0]?.[2]).toBe('Fußnote 1');
        expect(findNotes(root.querySelector('ui-footnotes'))[0]?.[3]).toBe('Zurück zu 1');
    });
});