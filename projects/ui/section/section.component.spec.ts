import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeadingLevel } from '@service-soft/ui/heading';
import { describe, expect, test } from 'vitest';

import { SectionBackground } from './section-background.type';
import { provideSectionConfig } from './section-config.provider';
import { SectionComponent } from './section.component';

@Component({
    selector: 'ui-section-host',
    template: `
        <ui-section sectionId="prices" heading="Prices" eyebrow="Membership" lead="One fee for every department." [level]="level()"
            [background]="background()"><p>From 10 € a month.</p></ui-section>
    `,
    imports: [SectionComponent]
})
class SectionHostComponent {
    readonly level: WritableSignal<HeadingLevel> = signal(2);

    readonly background: WritableSignal<SectionBackground> = signal('surface');
}

@Component({
    selector: 'ui-plain-section-host',
    template: '<ui-section><p>Only content.</p></ui-section><ui-section heading="Intro" /><ui-section heading="Intro" />',
    imports: [SectionComponent]
})
class PlainSectionHostComponent {}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

describe('SectionComponent', () => {
    test('is a section named by its heading, with the eyebrow above and the lead below it, and its id for anchors', async () => {
        const [, root] = await render(SectionHostComponent);
        const section: HTMLElement | null = root.querySelector('section');

        expect(section?.id).toBe('prices');
        // the id stays on the section, not on the component's own element as well
        expect(root.querySelector('ui-section')?.hasAttribute('id')).toBe(false);
        expect(root.querySelector('h2')?.textContent.trim()).toBe('Prices');
        expect(section?.getAttribute('aria-labelledby')).toBe('prices-heading');
        expect(root.querySelector('#prices-heading')?.textContent.trim()).toBe('Prices');
        expect(root.querySelector('hgroup p')?.textContent.trim()).toBe('Membership');
        expect(root.querySelector('hgroup')?.nextElementSibling?.textContent.trim()).toBe('One fee for every department.');
        expect(section?.textContent).toContain('From 10 € a month.');
    });

    test('renders the heading in its level and the background as a colored surface', async () => {
        const [fixture, root] = await render(SectionHostComponent);
        fixture.componentInstance.level.set(1);
        fixture.componentInstance.background.set('primary');
        await fixture.whenStable();

        expect(root.querySelector('h2')).toBeNull();
        expect(root.querySelector('h1')?.textContent.trim()).toBe('Prices');
        expect(root.querySelector('#prices-heading')?.classList).toContain('text-display');
        expect(root.querySelector('section')?.classList).toContain('surface-primary');
    });

    test('has no heading and no name without a heading, and generates distinct ids without a sectionId', async () => {
        const [, root] = await render(PlainSectionHostComponent);
        const [plain, first, second] = [...root.querySelectorAll('section')];

        expect(plain.querySelector('hgroup')).toBeNull();
        expect(plain.hasAttribute('aria-labelledby')).toBe(false);
        expect(plain.hasAttribute('id')).toBe(false);
        expect(first.getAttribute('aria-labelledby')).not.toBe(second.getAttribute('aria-labelledby'));
        expect(first.querySelector(`#${first.getAttribute('aria-labelledby')}`)?.textContent.trim()).toBe('Intro');
    });

    test('takes the level, the background and the alignment the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideSectionConfig({ level: 3, background: 'surface-container', align: 'center' })] });
        const [, root] = await render(PlainSectionHostComponent);

        expect(root.querySelector('h3')?.textContent.trim()).toBe('Intro');
        expect(root.querySelector('section')?.classList).toContain('bg-surface-container');
        expect(root.querySelector('hgroup')?.parentElement?.classList).toContain('text-center');
    });
});