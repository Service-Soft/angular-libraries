import { Component, ErrorHandler, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { IframeComponent } from './iframe.component';

@Component({
    selector: 'ui-iframe-host',
    template: '<ui-iframe label="Video of the club" [src]="src()" [aspectRatio]="aspectRatio()" />',
    imports: [IframeComponent]
})
class IframeHostComponent {
    readonly src: WritableSignal<string> = signal('https://www.youtube-nocookie.com/embed/abc');

    readonly aspectRatio: WritableSignal<string | undefined> = signal('4 / 3');
}

async function render(): Promise<[ComponentFixture<IframeHostComponent>, HTMLIFrameElement | null]> {
    const fixture: ComponentFixture<IframeHostComponent> = TestBed.createComponent(IframeHostComponent);
    await fixture.whenStable();
    return [fixture, (fixture.nativeElement as HTMLElement).querySelector('iframe')];
}

describe('IframeComponent', () => {
    test('is an iframe named by its label, which loads lazily in its ratio', async () => {
        const [fixture, iframe] = await render();

        expect(iframe?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abc');
        expect(iframe?.title).toBe('Video of the club');
        expect(iframe?.getAttribute('loading')).toBe('lazy');
        expect(iframe?.style.aspectRatio).toBe('4 / 3');

        // without a ratio it fills its parent
        fixture.componentInstance.aspectRatio.set(undefined);
        await fixture.whenStable();
        expect(iframe?.style.aspectRatio).toBe('');
        expect(iframe?.classList).toContain('size-full');
    });

    test('refuses a url that would run script in the page', async () => {
        const errors: unknown[] = [];
        TestBed.configureTestingModule({ providers: [{ provide: ErrorHandler, useValue: { handleError: (error: unknown) => errors.push(error) } }] });
        const [fixture, iframe] = await render();
        fixture.componentInstance.src.set('javascript:alert(1)');
        await fixture.whenStable().catch((error: unknown) => errors.push(error));

        expect(String(errors[0])).toContain('only loads http and https urls');
        expect(iframe?.getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abc');
    });
});