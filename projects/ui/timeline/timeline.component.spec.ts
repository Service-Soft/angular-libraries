import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { TimelineEntryComponent } from './timeline-entry.component';
import { TimelineComponent } from './timeline.component';

@Component({
    selector: 'ui-timeline-host',
    template: `
        <ui-timeline><ui-timeline-entry date="March 1921" datetime="1921-03" heading="Founded"><p>By twelve gymnasts.</p></ui-timeline-entry>
            <ui-timeline-entry date="1950 – 1960" heading="The first hall" /></ui-timeline>
    `,
    imports: [TimelineComponent, TimelineEntryComponent]
})
class TimelineHostComponent {}

describe('TimelineComponent', () => {
    test('is an ordered list of the entries, with their date, heading and text', async () => {
        const fixture: ComponentFixture<TimelineHostComponent> = TestBed.createComponent(TimelineHostComponent);
        await fixture.whenStable();
        const root: HTMLElement = fixture.nativeElement as HTMLElement;
        const list: HTMLElement | null = root.querySelector('ol');
        const [founded] = [...root.querySelectorAll('ui-timeline-entry')];

        expect(list?.getAttribute('role')).toBe('list');
        expect([founded.parentElement, founded.getAttribute('role')]).toEqual([list, 'listitem']);
        expect(founded.querySelector('p')?.textContent).toBe('Founded');
        expect(founded.textContent).toContain('By twelve gymnasts.');
        // the line and the dot are decorative
        expect(founded.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    });

    test('gives machines the date in a time element where it has one', async () => {
        const fixture: ComponentFixture<TimelineHostComponent> = TestBed.createComponent(TimelineHostComponent);
        await fixture.whenStable();
        const [founded, hall] = [...(fixture.nativeElement as HTMLElement).querySelectorAll('ui-timeline-entry')];

        expect(founded.querySelector('time')?.getAttribute('datetime')).toBe('1921-03');
        expect(founded.querySelector('time')?.textContent).toBe('March 1921');
        expect(hall.querySelector('time')).toBeNull();
        expect(hall.textContent).toContain('1950 – 1960');
    });
});