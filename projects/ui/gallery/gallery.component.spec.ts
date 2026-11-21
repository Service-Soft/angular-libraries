import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorHandlerTestingUtilities } from 'testing/error-handler';
import { beforeEach, describe, expect, test } from 'vitest';

import { provideGalleryConfig } from './gallery-config.provider';
import { GalleryImage } from './gallery-image.model';
import { GalleryComponent } from './gallery.component';

@Component({
    selector: 'ui-gallery-host',
    template: '<ui-gallery [images]="images()" />',
    imports: [GalleryComponent]
})
class GalleryHostComponent {
    readonly images: WritableSignal<GalleryImage[]> = signal([
        { src: '/photos/stage.jpg', alt: 'The band on stage', caption: 'Photo: Ada Lovelace' },
        { src: '/photos/cake.jpg', alt: 'The cake buffet' },
        { src: '/photos/kids.jpg', alt: 'Kids at the bouncy castle' }
    ]);
}

async function render(): Promise<[ComponentFixture<GalleryHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<GalleryHostComponent> = TestBed.createComponent(GalleryHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getDialog(root: HTMLElement): HTMLDialogElement {
    const dialog: HTMLDialogElement | null = root.querySelector('dialog');
    if (dialog == undefined) {
        throw new Error('The dialog did not render.');
    }
    return dialog;
}

async function pressKey(fixture: ComponentFixture<unknown>, target: Element | null | undefined, key: string): Promise<void> {
    target?.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
    await fixture.whenStable();
}

describe('GalleryComponent', () => {
    beforeEach(() => {
        // jsdom has no modal dialogs, only the open attribute
        HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement): void {
            this.setAttribute('open', '');
        };
        HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement): void {
            this.removeAttribute('open');
            this.dispatchEvent(new Event('close'));
        };
    });

    test('shows a thumbnail button for every picture, named by its alt', async () => {
        const [, root] = await render();
        const thumbnails: HTMLButtonElement[] = [...root.querySelectorAll<HTMLButtonElement>('ul > li > button')];

        expect(thumbnails.map(button => button.querySelector('img')?.getAttribute('alt'))).toEqual([
            'The band on stage',
            'The cake buffet',
            'Kids at the bouncy castle'
        ]);
        expect(getDialog(root).open).toBe(false);
        // only the picture that is open loads large
        expect(getDialog(root).querySelector('img')).toBeNull();
    });

    test('opens a picture large with its caption and position, and moves through them with the buttons and the arrow keys', async () => {
        const [fixture, root] = await render();
        root.querySelectorAll<HTMLButtonElement>('ul > li > button')[0]?.click();
        await fixture.whenStable();
        const dialog: HTMLDialogElement = getDialog(root);
        const findShown: () => string[] = () => [
            dialog.querySelector('figure img')?.getAttribute('alt') ?? '',
            dialog.querySelector('figcaption')?.textContent ?? '',
            dialog.querySelector('p[aria-hidden="true"]')?.textContent ?? '',
            dialog.querySelector('[role="status"]')?.textContent ?? ''
        ];

        expect(dialog.open).toBe(true);
        expect(dialog.getAttribute('aria-label')).toBe('Pictures');
        expect(findShown()).toEqual(['The band on stage', 'Photo: Ada Lovelace', '1 / 3', 'Picture 1 of 3: The band on stage']);

        dialog.querySelector<HTMLButtonElement>('button[aria-label="Next picture"]')?.click();
        await fixture.whenStable();
        expect(findShown()).toEqual(['The cake buffet', '', '2 / 3', 'Picture 2 of 3: The cake buffet']);

        const closeButton: HTMLButtonElement | null = dialog.querySelector('button[aria-label="Close"]');
        await pressKey(fixture, closeButton, 'ArrowRight');
        expect(findShown()[2]).toBe('3 / 3');
        // after the last comes the first, and before the first the last
        await pressKey(fixture, closeButton, 'ArrowRight');
        expect(findShown()[2]).toBe('1 / 3');
        await pressKey(fixture, closeButton, 'ArrowLeft');
        expect(findShown()[2]).toBe('3 / 3');

        dialog.close();
        await fixture.whenStable();
        expect(dialog.querySelector('figure')).toBeNull();
    });

    test('has no buttons to move with a single picture, and takes its texts from the config', async () => {
        TestBed.configureTestingModule({ providers: [provideGalleryConfig({ label: 'Bilder', positionLabel: (position, count) => `Bild ${position} von ${count}` })] });
        const [fixture, root] = await render();
        fixture.componentInstance.images.set([{ src: '/photos/stage.jpg', alt: 'Die Band' }]);
        await fixture.whenStable();
        root.querySelector<HTMLButtonElement>('ul > li > button')?.click();
        await fixture.whenStable();
        const dialog: HTMLDialogElement = getDialog(root);

        expect(dialog.getAttribute('aria-label')).toBe('Bilder');
        expect(dialog.querySelectorAll('button')).toHaveLength(1);
        expect(dialog.querySelector('[role="status"]')?.textContent).toBe('Bild 1 von 1: Die Band');
    });

    test('reports a picture without an alt to the error handler', async () => {
        const errors: unknown[] = [];
        TestBed.configureTestingModule({ providers: [ErrorHandlerTestingUtilities.provideErrorList(errors)] });
        const [fixture] = await render();
        fixture.componentInstance.images.set([{ src: '/photos/stage.jpg', alt: ' ' }]);
        await fixture.whenStable();

        expect(errors).toEqual([new Error('Every picture of a ui-gallery needs an alt, /photos/stage.jpg has none.')]);
    });
});