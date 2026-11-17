import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideMediaSplitConfig } from './media-split-config.provider';
import { MediaSplitMediaComponent } from './media-split-media.component';
import { MediaSplitPosition } from './media-split-position.type';
import { MediaSplitWidth } from './media-split-width.type';
import { MediaSplitComponent } from './media-split.component';

@Component({
    selector: 'ui-media-split-host',
    template: `
        <ui-media-split [position]="position()" [mediaWidth]="mediaWidth()"><h2>Our hall</h2><p>Built in 2024.</p>
            <ui-media-split-media><img src="/hall.jpg" alt="The new hall from the outside" /></ui-media-split-media></ui-media-split>
    `,
    imports: [MediaSplitComponent, MediaSplitMediaComponent]
})
class MediaSplitHostComponent {
    readonly position: WritableSignal<MediaSplitPosition> = signal('start');

    readonly mediaWidth: WritableSignal<MediaSplitWidth> = signal('half');
}

@Component({
    selector: 'ui-default-media-split-host',
    template: '<ui-media-split><ui-media-split-media><img src="/hall.jpg" alt="" /></ui-media-split-media><p>Text</p></ui-media-split>',
    imports: [MediaSplitComponent, MediaSplitMediaComponent]
})
class DefaultMediaSplitHostComponent {}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the grid and its two columns, the one of the media and the one of the text.
function getColumns(root: HTMLElement): [HTMLElement, HTMLElement, HTMLElement] {
    const grid: HTMLElement | null = root.querySelector('ui-media-split > div');
    const [media, text] = [...grid?.children ?? []];
    if (!(grid instanceof HTMLElement) || !(media instanceof HTMLElement) || !(text instanceof HTMLElement)) {
        throw new Error('The media split did not render its columns.');
    }
    return [grid, media, text];
}

describe('MediaSplitComponent', () => {
    test('puts the media first and the text after it, wherever they are written', async () => {
        const [, root] = await render(MediaSplitHostComponent);
        const [grid, media, text] = getColumns(root);

        expect(media.querySelector('img')?.alt).toBe('The new hall from the outside');
        expect(text.querySelector('h2')?.textContent).toBe('Our hall');
        expect(text.querySelector('img')).toBeNull();
        expect(grid.classList).toContain('@3xl:grid-cols-2');
        expect(media.classList).not.toContain('@3xl:order-last');
    });

    test('moves the media to the end only visually, so the order for screen readers stays the same', async () => {
        const [fixture, root] = await render(MediaSplitHostComponent);
        fixture.componentInstance.position.set('end');
        fixture.componentInstance.mediaWidth.set('narrow');
        await fixture.whenStable();
        const [grid, media] = getColumns(root);

        expect(grid.firstElementChild).toBe(media);
        expect(media.classList).toContain('@3xl:order-last');
        // the text is the first column now, the narrow media the second
        expect(grid.classList).toContain('@3xl:grid-cols-[2fr_1fr]');
    });

    test('takes the position, the width and the alignment the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideMediaSplitConfig({ position: 'end', mediaWidth: 'wide', align: 'start' })] });
        const [, root] = await render(DefaultMediaSplitHostComponent);
        const [grid, media] = getColumns(root);

        expect(grid.classList).toContain('@3xl:grid-cols-[2fr_3fr]');
        expect(grid.classList).toContain('@3xl:items-start');
        expect(media.classList).toContain('@3xl:order-last');
    });
});