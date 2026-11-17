import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideRichTextConfig } from './rich-text-config.provider';
import { RichTextDomPurifyWindow } from './rich-text-dom-purify-window.type';
import { provideRichTextDomPurify } from './rich-text-dom-purify.provider';
import { RichTextDomPurify } from './rich-text-dom-purify.type';
import { RichTextComponent } from './rich-text.component';

const HTML: string = `
    <h2 id="opening-hours" style="color: red">Opening hours</h2>
    <p onclick="alert(1)">Monday to Friday, <a href="/contact">call us</a> first.</p>
    <script>alert(2)</script>
    <iframe src="https://example.com/map"></iframe>
`;

@Component({
    selector: 'ui-rich-text-host',
    template: '<ui-rich-text [html]="html" />',
    imports: [RichTextComponent]
})
class RichTextHostComponent {
    readonly html: string = HTML;
}

/**
 * The config of the stand-in for DOMPurify, which allows the tags it names.
 */
type PurifyConfig = {
    /**
     * The tags it keeps beside its own.
     */
    ADD_TAGS?: string[]
};

/**
 * The windows the stand-in for DOMPurify was created for.
 */
const purifiedWindows: RichTextDomPurifyWindow[] = [];

// dompurify isn't a dependency of the workspace: a stand-in of its shape, which removes scripts and event handlers
// like it does, and iframes unless the config adds them.
const domPurify: RichTextDomPurify<PurifyConfig> = window => {
    purifiedWindows.push(window);
    return {
        sanitize: (html, config) => {
            const safe: string = html.replaceAll(/<script>.*?<\/script>/g, '').replaceAll(/ on\w+="[^"]*"/g, '');
            return config?.ADD_TAGS?.includes('iframe') === true ? safe : safe.replaceAll(/<iframe.*?<\/iframe>/g, '');
        }
    };
};

async function render(): Promise<HTMLElement> {
    const fixture: ComponentFixture<RichTextHostComponent> = TestBed.createComponent(RichTextHostComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

describe('RichTextComponent', () => {
    test('shows the html sanitized by Angular, which removes scripts, handlers, ids, styles and unknown elements', async () => {
        const root: HTMLElement = await render();
        const heading: HTMLElement | null = root.querySelector('ui-rich-text h2');

        expect(heading?.textContent).toBe('Opening hours');
        expect(heading?.hasAttribute('id')).toBe(false);
        expect(heading?.hasAttribute('style')).toBe(false);
        expect(root.querySelector('p')?.hasAttribute('onclick')).toBe(false);
        expect(root.querySelector('a')?.getAttribute('href')).toBe('/contact');
        expect(root.querySelector('script, iframe')).toBeNull();
        // the elements of the html are styled through the element that holds them
        expect(root.querySelector('ui-rich-text > div')?.classList).toContain('[&_h2]:text-title');
    });

    test('trusts the html a sanitizer of the app returns', async () => {
        TestBed.configureTestingModule({ providers: [provideRichTextConfig({ sanitize: html => html.replace('Opening', 'Our') })] });
        const root: HTMLElement = await render();

        expect(root.querySelector('h2')?.textContent).toBe('Our hours');
        expect(root.querySelector('h2')?.id).toBe('opening-hours');
        expect(root.querySelector('iframe')).not.toBeNull();
    });

    test('sanitizes with DOMPurify in the window of the browser, with its config', async () => {
        purifiedWindows.length = 0;
        TestBed.configureTestingModule({ providers: [provideRichTextDomPurify(domPurify, { config: { ADD_TAGS: ['iframe'] } })] });
        const root: HTMLElement = await render();

        expect(purifiedWindows).toEqual([window]);
        expect(root.querySelector('h2')?.id).toBe('opening-hours');
        expect(root.querySelector('h2')?.getAttribute('style')).toBe('color: red');
        expect(root.querySelector('iframe')?.getAttribute('src')).toBe('https://example.com/map');
        expect(root.querySelector('script')).toBeNull();
        expect(root.querySelector('p')?.hasAttribute('onclick')).toBe(false);
    });

    test('sanitizes with DOMPurify in the window it is given on the server, and with Angular without one', async () => {
        purifiedWindows.length = 0;
        const serverWindow: RichTextDomPurifyWindow = window;
        TestBed.configureTestingModule({
            providers: [{ provide: PLATFORM_ID, useValue: 'server' }, provideRichTextDomPurify(domPurify, { serverWindow })]
        });
        expect((await render()).querySelector('h2')?.id).toBe('opening-hours');
        expect(purifiedWindows).toEqual([serverWindow]);

        TestBed.resetTestingModule();
        purifiedWindows.length = 0;
        TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }, provideRichTextDomPurify(domPurify)] });
        expect((await render()).querySelector('h2')?.hasAttribute('id')).toBe(false);
        expect(purifiedWindows).toEqual([]);
    });
});