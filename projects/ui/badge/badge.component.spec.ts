import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideBadgeConfig } from './badge-config.provider';
import { BadgeComponent } from './badge.component';

@Component({
    selector: 'ui-badge-host',
    template: '<ui-badge>News</ui-badge><ui-badge color="secondary" variant="filled" size="md">Recommended</ui-badge><ui-badge color="neutral">Tag</ui-badge>',
    imports: [BadgeComponent]
})
class BadgeHostComponent {}

async function render(): Promise<HTMLElement[]> {
    const fixture: ComponentFixture<BadgeHostComponent> = TestBed.createComponent(BadgeHostComponent);
    await fixture.whenStable();
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('ui-badge')];
}

function getClasses(badge: HTMLElement | undefined): string[] {
    return [...badge?.classList ?? []];
}

describe('BadgeComponent', () => {
    test('shows its text in the pairs of colors whose contrast is checked, tinted and small unless it says otherwise', async () => {
        const [tinted, filled, neutral] = await render();

        expect(tinted?.textContent).toBe('News');
        expect(getClasses(tinted)).toEqual(expect.arrayContaining(['bg-primary-tint', 'text-primary', 'text-label-sm', 'rounded-badge']));
        // a transparent border keeps its shape in forced colors mode
        expect(getClasses(tinted)).toContain('border-transparent');
        expect(getClasses(filled)).toEqual(expect.arrayContaining(['bg-secondary', 'text-on-secondary', 'text-label']));
        expect(getClasses(neutral)).toEqual(expect.arrayContaining(['bg-surface-container', 'text-on-surface', 'border-outline-variant']));
    });

    test('takes its defaults from the config', async () => {
        TestBed.configureTestingModule({ providers: [provideBadgeConfig({ color: 'success', variant: 'filled' })] });
        const [badge] = await render();

        expect(getClasses(badge)).toEqual(expect.arrayContaining(['bg-success', 'text-on-success']));
    });
});