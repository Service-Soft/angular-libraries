import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputValidation } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { InputSliderComponent } from './input-slider.component';

@Component({
    selector: 'ui-two-way-host',
    template: '<ui-input-slider label="Volume" hint="0 to 10" name="volume" [min]="0" [max]="10" [(value)]="volume" />',
    imports: [InputSliderComponent]
})
class TwoWayHostComponent {
    readonly volume: WritableSignal<number> = signal(7);
}

@Component({
    selector: 'ui-validation-host',
    template: '<ui-input-slider label="Rating" [min]="1" [max]="5" [customValidation]="validateHonest" [showValidationError]="true" [(value)]="rating" />',
    imports: [InputSliderComponent]
})
class ValidationHostComponent {
    readonly rating: WritableSignal<number> = signal(3);
    readonly validateHonest: InputValidation<number> = value => value === 5 ? 'Nobody is perfect.' : undefined;
}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getSlider(root: HTMLElement): HTMLInputElement {
    const slider: HTMLInputElement | undefined = root.querySelector<HTMLInputElement>('input[type="range"]') ?? undefined;
    if (slider == undefined) {
        throw new Error('The slider did not render.');
    }
    return slider;
}

async function move(fixture: ComponentFixture<unknown>, slider: HTMLInputElement, value: string): Promise<void> {
    slider.value = value;
    slider.dispatchEvent(new Event('input'));
    await fixture.whenStable();
}

function findDescription(root: HTMLElement, slider: HTMLInputElement): string | undefined {
    const ids: string[] = slider.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

describe('InputSliderComponent', () => {
    test('binds the value two-way within its range, and shows it next to the track', async () => {
        const [fixture, root] = await render(TwoWayHostComponent);
        const slider: HTMLInputElement = getSlider(root);
        // a value above the default max of 100 would be clamped if the range came after it
        expect(slider.value).toBe('7');
        expect(slider.max).toBe('10');
        expect(root.querySelector('output')?.textContent?.trim()).toBe('7');

        await move(fixture, slider, '3');
        expect(fixture.componentInstance.volume()).toBe(3);
        expect(root.querySelector('output')?.textContent?.trim()).toBe('3');

        fixture.componentInstance.volume.set(9);
        await fixture.whenStable();
        expect(slider.value).toBe('9');
    });

    test('is labelled and described by its hint, and its number is only read once', async () => {
        const [, root] = await render(TwoWayHostComponent);
        const slider: HTMLInputElement = getSlider(root);

        expect(root.querySelector('label')?.getAttribute('for')).toBe(slider.id);
        // it always holds a number, so its label doesn't say it is required
        expect(root.querySelector('label')?.textContent).not.toContain('*');
        expect(slider.name).toBe('volume');
        expect(findDescription(root, slider)).toBe('0 to 10');
        expect(root.querySelector('output')?.getAttribute('aria-hidden')).toBe('true');
    });

    test('validates with customValidation, the one rule the browser leaves to it', async () => {
        const [fixture, root] = await render(ValidationHostComponent);
        const slider: HTMLInputElement = getSlider(root);
        expect(slider.checkValidity()).toBe(true);

        await move(fixture, slider, '5');
        expect(slider.validity.customError).toBe(true);
        expect(slider.getAttribute('aria-invalid')).toBe('true');
        expect(findDescription(root, slider)).toBe('Nobody is perfect.');
    });
});