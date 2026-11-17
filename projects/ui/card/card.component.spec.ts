import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideCardConfig } from './card-config.provider';
import { CardComponent } from './card.component';

@Component({
    selector: 'ui-card-host',
    template: `
        <ui-card><h2>Orders</h2><p>12 waiting to be shipped</p></ui-card>
        <ui-card variant="outlined"><p>Returns</p></ui-card>
    `,
    imports: [CardComponent]
})
class CardHostComponent {}

@Component({
    selector: 'ui-flush-card-host',
    template: '<ui-card flush><p class="p-4">Returns</p></ui-card>',
    imports: [CardComponent]
})
class FlushCardHostComponent {}

async function render(): Promise<HTMLElement[]> {
    const fixture: ComponentFixture<CardHostComponent> = TestBed.createComponent(CardHostComponent);
    await fixture.whenStable();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('ui-card'));
}

describe('CardComponent', () => {
    test('shows its content on a surface of its variant, elevated unless it says otherwise', async () => {
        const [elevated, outlined] = await render();

        expect(elevated?.querySelector('h2')?.textContent).toBe('Orders');
        expect(elevated?.textContent).toContain('12 waiting to be shipped');
        expect(elevated?.classList).toContain('shadow-1');
        expect(elevated?.classList).toContain('rounded-card');
        // a transparent border keeps its shape in forced colors mode
        expect(elevated?.classList).toContain('border-transparent');
        expect(outlined?.classList).toContain('border-outline-variant');
        expect(outlined?.classList).not.toContain('shadow-1');
    });

    test('takes the variant the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideCardConfig({ variant: 'filled' })] });
        const [card, outlined] = await render();

        expect(card?.classList).toContain('bg-surface-container');
        expect(outlined?.classList).toContain('border-outline-variant');
    });

    test('leaves the padding to its content when it is flush', async () => {
        const [padded] = await render();
        const fixture: ComponentFixture<FlushCardHostComponent> = TestBed.createComponent(FlushCardHostComponent);
        await fixture.whenStable();
        const flush: HTMLElement | null = (fixture.nativeElement as HTMLElement).querySelector('ui-card');

        expect(padded?.classList).toContain('p-4');
        expect(flush?.classList).not.toContain('p-4');
        expect(flush?.classList).toContain('shadow-1');
    });
});