import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ScrollRegionDirective } from './scroll-region.directive';

@Component({
    selector: 'ui-scroll-region-host',
    template: '<div class="overflow-x-auto" uiScrollRegion="Orders"><table><tr><td>A</td></tr></table></div>',
    imports: [ScrollRegionDirective]
})
class ScrollRegionHostComponent {}

/**
 * The callbacks of the ResizeObservers of the page, which the test calls.
 */
const resizeCallbacks: ResizeObserverCallback[] = [];

// jsdom has no layout, so the widths of the box and of its content are the boundary a test sets, and it has no
// ResizeObserver, whose callbacks the test calls when a width changed.
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

let contentWidth: number;

// like the browser after a width changed. The observer each callback gets is never read.
function resize(): void {
    const observer: ResizeObserver = new FakeResizeObserver(() => undefined);
    for (const notify of resizeCallbacks) {
        notify([], observer);
    }
}

async function render(): Promise<[ComponentFixture<ScrollRegionHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<ScrollRegionHostComponent> = TestBed.createComponent(ScrollRegionHostComponent);
    await fixture.whenStable();
    return [fixture, (fixture.nativeElement as HTMLElement).querySelector('div') as HTMLElement];
}

describe('ScrollRegionDirective', () => {
    beforeEach(() => {
        contentWidth = 300;
        vi.stubGlobal('ResizeObserver', FakeResizeObserver);
        vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(() => contentWidth);
        vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(() => 300);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.restoreAllMocks();
    });

    test('is a plain box while its content fits', async () => {
        const [, box] = await render();

        expect(box.hasAttribute('tabindex')).toBe(false);
        expect(box.hasAttribute('role')).toBe(false);
        expect(box.hasAttribute('aria-label')).toBe(false);
    });

    test('takes the focus and is a named region once its content is wider, and is plain again when it fits', async () => {
        const [fixture, box] = await render();

        contentWidth = 500;
        resize();
        await fixture.whenStable();
        expect(box.getAttribute('tabindex')).toBe('0');
        expect(box.getAttribute('role')).toBe('region');
        expect(box.getAttribute('aria-label')).toBe('Orders');

        contentWidth = 300;
        resize();
        await fixture.whenStable();
        expect(box.hasAttribute('tabindex')).toBe(false);
    });
});