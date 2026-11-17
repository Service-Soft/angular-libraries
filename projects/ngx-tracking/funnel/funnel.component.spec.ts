import { Component, input, InputSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { FunnelPoint } from './funnel-point.model';
import { FunnelComponent } from './funnel.component';

@Component({
    selector: 'ngx-host',
    template: '<ngx-funnel label="Checkout" [funnelPoints]="points()" />',
    imports: [FunnelComponent]
})
class HostComponent {
    readonly points: InputSignal<FunnelPoint[]> = input<FunnelPoint[]>([
        { name: 'Visit', value: 200 },
        { name: 'Add to cart', value: 50 },
        { name: 'Purchase', value: 10 }
    ]);
}

async function render(points?: FunnelPoint[]): Promise<HTMLElement> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    if (points) {
        fixture.componentRef.setInput('points', points);
    }
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

function getShapes(root: HTMLElement): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>('li > div')];
}

describe('FunnelComponent', () => {
    test('lists every step with its value and share of the first, as text screen readers read', async () => {
        const root: HTMLElement = await render();

        expect(root.querySelector('ol')?.getAttribute('aria-label')).toBe('Checkout');
        expect([...root.querySelectorAll('li > span')].map(step => step.textContent?.trim()))
            .toEqual(['Visit: 200 (100%)', 'Add to cart: 50 (25%)', 'Purchase: 10 (5%)']);
        expect(getShapes(root).every(shape => shape.getAttribute('aria-hidden') === 'true')).toBe(true);
    });

    test('narrows each shape to the width of the next step', async () => {
        const shapes: HTMLElement[] = getShapes(await render());

        expect(shapes.map(shape => shape.style.width)).toEqual(['100%', '25%', '5%']);
        // 100% narrows to 25%: 37.5% off on each side
        expect(shapes[0].style.clipPath).toBe('polygon(0 0, 100% 0, 62.5% 100%, 37.5% 100%)');
        expect(shapes[2].style.clipPath).toBe('');
    });

    test('shows a funnel nobody entered without dividing by zero', async () => {
        const root: HTMLElement = await render([{ name: 'Visit', value: 0 }, { name: 'Purchase', value: 0 }]);

        expect([...root.querySelectorAll('li > span')].map(step => step.textContent?.trim())).toEqual(['Visit: 0 (0%)', 'Purchase: 0 (0%)']);
        expect(getShapes(root).map(shape => shape.style.width)).toEqual(['0%', '0%']);
    });
});