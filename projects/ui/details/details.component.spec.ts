import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideDetailsConfig } from './details-config.provider';
import { DetailsComponent } from './details.component';
import { SummaryComponent } from './summary.component';

@Component({
    selector: 'ui-details-host',
    template: `
        <ui-details name="faq" [(open)]="open"><p>Two working days.</p><ui-summary>Shipping</ui-summary></ui-details>
    `,
    imports: [DetailsComponent, SummaryComponent]
})
class DetailsHostComponent {
    readonly open: WritableSignal<boolean> = signal(false);
}

async function render(): Promise<[ComponentFixture<DetailsHostComponent>, HTMLDetailsElement]> {
    const fixture: ComponentFixture<DetailsHostComponent> = TestBed.createComponent(DetailsHostComponent);
    await fixture.whenStable();
    const details: HTMLDetailsElement | null = (fixture.nativeElement as HTMLElement).querySelector('details');
    if (details == undefined) {
        throw new Error('The details did not render.');
    }
    return [fixture, details];
}

describe('DetailsComponent', () => {
    test('renders the summary first, wherever it is written, and passes the name on', async () => {
        const [, details] = await render();

        // the browser only uses the first child as the summary
        expect(details.firstElementChild?.tagName).toBe('SUMMARY');
        expect(details.firstElementChild?.textContent).toContain('Shipping');
        expect(details.textContent).toContain('Two working days.');
        expect(details.getAttribute('name')).toBe('faq');
        expect(details.querySelector('summary svg')?.getAttribute('aria-hidden')).toBe('true');
    });

    test('binds open two-way, also when the browser opens or closes it', async () => {
        const [fixture, details] = await render();

        fixture.componentInstance.open.set(true);
        await fixture.whenStable();
        expect(details.open).toBe(true);

        // like a click on the summary, or another section with the same name opening
        details.open = false;
        details.dispatchEvent(new Event('toggle'));
        await fixture.whenStable();
        expect(fixture.componentInstance.open()).toBe(false);
    });
});
describe('DetailsComponent variants', () => {
    test('is outlined and neutral by default, and takes its look from the config', async () => {
        const [, details] = await render();
        expect(details.classList).toContain('border-outline-variant');
        // what it is on shows through, like the stripe of a row
        expect([...details.classList].some(name => name.startsWith('bg-'))).toBe(false);
        expect(details.querySelector('svg')?.classList).toContain('text-on-surface-variant');

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: [provideDetailsConfig({ variant: 'outlined', color: 'primary' })] });
        const [, outlined] = await render();
        // the color shows whether it is open or not
        expect(outlined.open).toBe(false);
        expect(outlined.classList).toContain('border-primary');
        expect(outlined.querySelector('svg')?.classList).toContain('text-primary');
    });

    test('colors only its summary when it is filled in a theme color, above content in the container color', async () => {
        TestBed.configureTestingModule({ providers: [provideDetailsConfig({ variant: 'filled', color: 'secondary' })] });
        const [, filled] = await render();

        expect(filled.querySelector('summary')?.classList).toContain('surface-secondary');
        expect(filled.classList).toContain('bg-surface-container');
        expect(filled.classList).not.toContain('surface-secondary');
        // the chevron is a child of the colored summary, whose hints are the on- variant of the color
        expect(filled.querySelector('svg')?.classList).toContain('text-on-surface-variant');
    });
});