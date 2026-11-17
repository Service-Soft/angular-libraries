import { Component, LOCALE_ID, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { StatComponent } from './stat.component';

@Component({
    selector: 'ui-stat-host',
    template: '<ui-stat label="Members" prefix="+" [value]="value()" [duration]="1000" />',
    imports: [StatComponent]
})
class StatHostComponent {
    readonly value: WritableSignal<number> = signal(1200);
}

// jsdom can't tell whether an element is in view, so the test does it: it calls the observer like the browser does when
// the element scrolls into view.
class IntersectionObserverStub implements IntersectionObserver {
    static readonly observers: IntersectionObserverStub[] = [];

    // the viewport, which is what an observer without a root of its own watches
    readonly root: Element | Document | null = document;

    readonly rootMargin: string = '0px';

    readonly scrollMargin: string = '0px';

    readonly thresholds: readonly number[] = [0];

    private readonly targets: Element[] = [];

    constructor(private readonly callback: IntersectionObserverCallback) {
        IntersectionObserverStub.observers.push(this);
    }

    static scrollIntoView(): void {
        for (const observer of IntersectionObserverStub.observers) {
            observer.callback(observer.targets.map(target => ({
                target,
                isIntersecting: true,
                intersectionRatio: 1,
                boundingClientRect: target.getBoundingClientRect(),
                intersectionRect: target.getBoundingClientRect(),
                rootBounds: document.documentElement.getBoundingClientRect(),
                time: performance.now()
            })), observer);
        }
    }

    observe(target: Element): void {
        this.targets.push(target);
    }

    unobserve(): void {}

    disconnect(): void {
        this.targets.length = 0;
    }

    takeRecords(): IntersectionObserverEntry[] {
        return [];
    }
}

// jsdom has no media queries, so the test says whether the user prefers reduced motion.
function stubReducedMotion(reduced: boolean): void {
    vi.stubGlobal('matchMedia', (query: string) => ({ media: query, matches: query === '(prefers-reduced-motion: no-preference)' ? !reduced : reduced }));
}

async function render(): Promise<[ComponentFixture<StatHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<StatHostComponent> = TestBed.createComponent(StatHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// what shows, what screen readers read, and the text below the number.
function getTexts(root: HTMLElement): { shown: string | undefined, read: string | undefined, label: string | undefined } {
    const parts: Element[] = [...root.querySelectorAll('ui-stat > span > span')];
    return {
        shown: parts[1]?.textContent,
        read: root.querySelector('.sr-only')?.textContent,
        label: root.querySelector('ui-stat')?.lastElementChild?.textContent
    };
}

describe('StatComponent', () => {
    beforeEach(() => {
        IntersectionObserverStub.observers.length = 0;
        vi.stubGlobal('IntersectionObserver', IntersectionObserverStub);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    test('shows the final value with reduced motion, and screen readers read only that', async () => {
        stubReducedMotion(true);
        const [, root] = await render();

        expect(getTexts(root)).toEqual({ shown: '+1,200', read: '+1,200', label: 'Members' });
        // the copies that show are hidden from screen readers
        expect([...root.querySelectorAll('ui-stat > span > span[aria-hidden="true"]')].length).toBe(2);
        expect(IntersectionObserverStub.observers).toEqual([]);
    });

    test('counts up from 0 once it scrolls into view, while screen readers read the final value', async () => {
        stubReducedMotion(false);
        const [fixture, root] = await render();
        // before it is in view, it shows the final value, like a page that is printed or never scrolled to it
        expect(getTexts(root).shown).toBe('+1,200');

        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
        IntersectionObserverStub.scrollIntoView();
        fixture.detectChanges();
        expect(getTexts(root)).toEqual({ shown: '+0', read: '+1,200', label: 'Members' });

        vi.advanceTimersByTime(500);
        fixture.detectChanges();
        const halfway: number = Number(getTexts(root).shown?.replaceAll(/\D/g, ''));
        // it slows down towards the value, so it is past the middle halfway through
        expect(halfway).toBeGreaterThan(600);
        expect(halfway).toBeLessThan(1200);

        vi.advanceTimersByTime(600);
        fixture.detectChanges();
        expect(getTexts(root)).toEqual({ shown: '+1,200', read: '+1,200', label: 'Members' });
    });

    test('keeps the fraction digits of the value while it counts, written in the language of the app', async () => {
        TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'de' }] });
        stubReducedMotion(false);
        const [fixture, root] = await render();
        fixture.componentInstance.value.set(4.5);
        await fixture.whenStable();
        expect(getTexts(root).read).toBe('+4,5');

        vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] });
        IntersectionObserverStub.scrollIntoView();
        vi.advanceTimersByTime(300);
        fixture.detectChanges();
        expect(getTexts(root).shown).toMatch(/^\+\d,\d$/);
    });
});