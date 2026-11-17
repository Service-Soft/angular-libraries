import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { describe, expect, test } from 'vitest';

import { IconDefinition } from './icon-definition.model';
import { IconComponent } from './icon.component';

const DUOTONE: IconDefinition = { icon: [640, 512, [], 'f000', ['M0 0h10v10z', 'M20 20h10v10z']] };

@Component({
    selector: 'ui-icon-host',
    template: `
        <ui-icon [icon]="clock" />
        <ui-icon label="Created at" [icon]="clock" />
        <ui-icon [icon]="duotone" />
    `,
    imports: [IconComponent]
})
class IconHostComponent {
    readonly clock: IconDefinition = faClock;
    readonly duotone: IconDefinition = DUOTONE;
}

describe('IconComponent', () => {
    test('draws Font Awesome icons, decorative unless they have a label', async () => {
        const fixture: ComponentFixture<IconHostComponent> = TestBed.createComponent(IconHostComponent);
        await fixture.whenStable();
        const [decorative, labelled, duotone] = (fixture.nativeElement as HTMLElement).querySelectorAll('svg');

        expect(decorative?.getAttribute('viewBox')).toBe('0 0 512 512');
        expect(decorative?.querySelector('path')?.getAttribute('d')).toBe(faClock.icon[4]);
        expect(decorative?.getAttribute('aria-hidden')).toBe('true');
        expect(decorative?.hasAttribute('role')).toBe(false);

        expect(labelled?.getAttribute('role')).toBe('img');
        expect(labelled?.getAttribute('aria-label')).toBe('Created at');
        expect(labelled?.hasAttribute('aria-hidden')).toBe(false);

        expect(duotone?.getAttribute('viewBox')).toBe('0 0 640 512');
        expect(duotone?.querySelectorAll('path')).toHaveLength(2);
    });
});