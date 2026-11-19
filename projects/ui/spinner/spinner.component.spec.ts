import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideSpinnerConfig } from './spinner-config.provider';
import { SpinnerComponent } from './spinner.component';

@Component({
    selector: 'ui-spinner-host',
    template: '<ui-spinner /><ui-spinner label="Loading orders" size="lg" />',
    imports: [SpinnerComponent]
})
class SpinnerHostComponent {}

async function render(): Promise<HTMLElement[]> {
    const fixture: ComponentFixture<SpinnerHostComponent> = TestBed.createComponent(SpinnerHostComponent);
    await fixture.whenStable();
    return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="progressbar"]'));
}

describe('SpinnerComponent', () => {
    test('is a progress bar without a value, named by its label, whose drawing screen readers skip', async () => {
        const [spinner, labelled] = await render();

        expect(spinner?.getAttribute('aria-label')).toBe('Loading');
        expect(spinner?.hasAttribute('aria-valuenow')).toBe(false);
        expect(spinner?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        expect(labelled?.getAttribute('aria-label')).toBe('Loading orders');
        expect(labelled?.querySelector('svg')?.classList.contains('size-[3em]')).toBe(true);
    });

    test('takes the label and size the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideSpinnerConfig({ label: 'Lädt', size: 'sm' })] });
        const [spinner] = await render();

        expect(spinner?.getAttribute('aria-label')).toBe('Lädt');
        expect(spinner?.querySelector('svg')?.classList.contains('size-[1em]')).toBe(true);
    });
});