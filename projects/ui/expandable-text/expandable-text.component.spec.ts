import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { provideExpandableTextConfig } from './expandable-text-config.provider';
import { ExpandableTextComponent } from './expandable-text.component';

@Component({
    selector: 'ui-expandable-text-host',
    template: '<ui-expandable-text [(expanded)]="expanded"><p>The club was founded in 1920.</p><p>It has 2,000 members.</p></ui-expandable-text>',
    imports: [ExpandableTextComponent]
})
class ExpandableTextHostComponent {
    readonly expanded: WritableSignal<boolean> = signal(false);
}

/**
 * The callbacks of the ResizeObservers of the page, which the test calls.
 */
const resizeCallbacks: ResizeObserverCallback[] = [];

// jsdom has no layout, so the heights of the text and of its content are the boundary a test sets, and it has no
// ResizeObserver, whose callbacks the test calls when the width changed.
class FakeResizeObserver implements ResizeObserver {
    constructor(private readonly callback: ResizeObserverCallback) {
        resizeCallbacks.push(callback);
    }

    observe(): void {
        // the test calls the callback itself
    }

    unobserve(): void {
        // nothing is observed
    }

    disconnect(): void {
        resizeCallbacks.splice(resizeCallbacks.indexOf(this.callback), 1);
    }
}

/**
 * How high the content of the text is, while it shows 72px of it.
 */
let contentHeight: number = 200;

async function render(): Promise<[ComponentFixture<ExpandableTextHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<ExpandableTextHostComponent> = TestBed.createComponent(ExpandableTextHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

describe('ExpandableTextComponent', () => {
    beforeEach(() => {
        contentHeight = 200;
        vi.stubGlobal('ResizeObserver', FakeResizeObserver);
        vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(() => contentHeight);
        vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockImplementation(() => 72);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    test('shows its first lines and a button that shows all of it in place, while the whole text stays in the page', async () => {
        const [fixture, root] = await render();
        const content: HTMLElement | null = root.querySelector('ui-expandable-text > div');
        const button: HTMLButtonElement | null = root.querySelector('button');

        expect(content?.classList).toContain('line-clamp-3');
        expect(content?.textContent).toContain('It has 2,000 members.');
        expect(button?.textContent.trim()).toBe('Read more');
        expect(button?.getAttribute('aria-expanded')).toBe('false');
        expect(button?.getAttribute('aria-controls')).toBe(content?.id);

        button?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.expanded()).toBe(true);
        expect(content?.classList).toContain('line-clamp-none');
        expect(button?.textContent.trim()).toBe('Show less');
        expect(button?.getAttribute('aria-expanded')).toBe('true');
    });

    test('has no button while the text fits its lines, and gets one once it doesn\'t, like on a narrower screen', async () => {
        contentHeight = 72;
        const [fixture, root] = await render();
        expect(root.querySelector('button')).toBeNull();

        contentHeight = 120;
        const observer: ResizeObserver = new FakeResizeObserver(() => undefined);
        for (const notify of resizeCallbacks) {
            notify([], observer);
        }
        await fixture.whenStable();
        expect(root.querySelector('button')?.textContent.trim()).toBe('Read more');
    });

    test('takes its lines and texts from the config', async () => {
        TestBed.configureTestingModule({ providers: [provideExpandableTextConfig({ lines: 5, moreLabel: 'Weiterlesen' })] });
        const [, root] = await render();

        expect(root.querySelector('ui-expandable-text > div')?.classList).toContain('line-clamp-5');
        expect(root.querySelector('button')?.textContent.trim()).toBe('Weiterlesen');
    });
});