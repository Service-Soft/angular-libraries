import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { HeadingLevel } from './heading-level.type';
import { HeadingComponent } from './heading.component';

@Component({
    selector: 'ui-heading-host',
    template: '<ui-heading id="prices" class="text-title" [level]="level()">Our <a href="/prices">prices</a></ui-heading>',
    imports: [HeadingComponent]
})
class HeadingHostComponent {
    readonly level: WritableSignal<HeadingLevel> = signal(2);
}

describe('HeadingComponent', () => {
    test('renders a native heading of every level around its content, and keeps the attributes on its own element', async () => {
        const fixture: ComponentFixture<HeadingHostComponent> = TestBed.createComponent(HeadingHostComponent);
        const root: HTMLElement = fixture.nativeElement as HTMLElement;
        const levels: HeadingLevel[] = [1, 2, 3, 4, 5, 6];

        for (const level of levels) {
            fixture.componentInstance.level.set(level);
            await fixture.whenStable();
            const headings: Element[] = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')];
            expect(headings.map(heading => [heading.tagName, heading.textContent])).toEqual([[`H${level}`, 'Our prices']]);
            // the content is projected once, with its elements, like a link
            expect(headings[0]?.querySelector('a')?.getAttribute('href')).toBe('/prices');
        }
        expect(root.querySelectorAll('a').length).toBe(1);
        // an aria-labelledby can point to its own element, whose text is the one of the heading
        expect(root.querySelector('ui-heading')?.id).toBe('prices');
        expect(root.querySelector('ui-heading')?.classList).toContain('text-title');
    });
});