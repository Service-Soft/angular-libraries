import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InputStringComponent } from '@service-soft/ui/input-string';
import { describe, expect, test } from 'vitest';

import { StepComponent } from './step.component';
import { StepperBeforeNext } from './stepper-before-next.type';
import { provideStepperConfig } from './stepper-config.provider';
import { StepperOrientation } from './stepper-orientation.type';
import { StepperComponent } from './stepper.component';

@Component({
    selector: 'ui-booking-host',
    template: `<ui-stepper finishLabel="Book now" [orientation]="orientation()" [linear]="linear()" [beforeNext]="beforeNext()"
        [(step)]="step" (finished)="finish()"><ui-step label="Dates"><ui-input-string label="Pick-up" [(value)]="pickUp" /></ui-step>
        <ui-step label="Car"><p>VW Golf</p></ui-step><ui-step label="Confirm"><p>Everything correct?</p></ui-step></ui-stepper>`,
    imports: [StepperComponent, StepComponent, InputStringComponent]
})
class BookingHostComponent {
    readonly step: WritableSignal<number> = signal(0);
    readonly beforeNext: WritableSignal<StepperBeforeNext | undefined> = signal(undefined);
    readonly pickUp: WritableSignal<string> = signal('');
    readonly orientation: WritableSignal<StepperOrientation> = signal('horizontal');
    readonly linear: WritableSignal<boolean> = signal(true);
    finished: number = 0;

    finish(): void {
        this.finished++;
    }
}

async function render(): Promise<[ComponentFixture<BookingHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<BookingHostComponent> = TestBed.createComponent(BookingHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findShownPanel(root: HTMLElement): HTMLElement | undefined {
    return [...root.querySelectorAll<HTMLElement>('ui-form')].find(panel => !panel.hasAttribute('hidden'));
}

function findStepTexts(root: HTMLElement): string[] {
    return [...root.querySelectorAll('ol > li')].map(step => step.textContent.replaceAll(/\s+/g, ' ').trim());
}

async function clickButton(fixture: ComponentFixture<BookingHostComponent>, root: HTMLElement, text: string): Promise<void> {
    const buttons: HTMLButtonElement[] = [...findShownPanel(root)?.querySelectorAll('button') ?? []];
    buttons.find(button => button.textContent.trim() === text)?.click();
    await fixture.whenStable();
}

// the stepper goes on after the promise of beforeNext, which no task of Angular waits for.
async function settle(fixture: ComponentFixture<BookingHostComponent>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve));
    await fixture.whenStable();
}

async function fillInPickUp(fixture: ComponentFixture<BookingHostComponent>): Promise<void> {
    fixture.componentInstance.pickUp.set('May 12');
    await fixture.whenStable();
}

describe('StepperComponent', () => {
    test('lists its steps and shows the first one with its name as the heading, without a button back', async () => {
        const [, root] = await render();
        const steps: HTMLElement[] = [...root.querySelectorAll<HTMLElement>('ol > li')];

        expect(root.querySelector('ol')?.getAttribute('aria-label')).toBe('Steps');
        expect(findStepTexts(root)).toEqual(['1 Dates', '2 Car', '3 Confirm']);
        expect(steps.map(step => step.getAttribute('aria-current') ?? undefined)).toEqual(['step', undefined, undefined]);
        expect(root.textContent).toContain('Step 1 of 3');
        const panel: HTMLElement | undefined = findShownPanel(root);
        expect(panel?.querySelector('h2')?.textContent).toBe('Dates');
        expect(panel?.querySelector('input')).not.toBeNull();
        expect([...panel?.querySelectorAll('button') ?? []].map(button => button.textContent.trim())).toEqual(['Next']);
    });

    test('only goes on once the controls of the step are valid, and moves the focus to the heading of the next', async () => {
        const [fixture, root] = await render();

        await clickButton(fixture, root, 'Next');
        expect(fixture.componentInstance.step()).toBe(0);
        expect(findShownPanel(root)?.querySelector('input')
            ?.getAttribute('aria-invalid')).toBe('true');
        expect(document.activeElement).toBe(findShownPanel(root)?.querySelector('input'));

        await fillInPickUp(fixture);
        await clickButton(fixture, root, 'Next');
        expect(fixture.componentInstance.step()).toBe(1);
        expect(findShownPanel(root)?.querySelector('h2')?.textContent).toBe('Car');
        expect(document.activeElement).toBe(findShownPanel(root)?.querySelector('h2'));
        expect(findStepTexts(root)).toEqual(['Dates completed', '2 Car', '3 Confirm']);
        expect(root.textContent).toContain('Step 2 of 3');
        // the input of the first step keeps its value while it is hidden
        expect(root.querySelector('input')?.value).toBe('May 12');
    });

    test('goes back, and finishes on the last step with the label it was given', async () => {
        const [fixture, root] = await render();
        await fillInPickUp(fixture);
        await clickButton(fixture, root, 'Next');

        await clickButton(fixture, root, 'Back');
        expect(fixture.componentInstance.step()).toBe(0);
        expect(document.activeElement?.textContent).toBe('Dates');

        fixture.componentInstance.step.set(2);
        await fixture.whenStable();
        await clickButton(fixture, root, 'Book now');
        expect(fixture.componentInstance.step()).toBe(2);
        expect(fixture.componentInstance.finished).toBe(1);
    });

    test('waits for beforeNext once the step is valid, busy meanwhile, and stays on the step when it says no', async () => {
        const [fixture, root] = await render();
        const checkedSteps: number[] = [];
        let answer: (goesOn: boolean) => void = () => undefined;
        fixture.componentInstance.beforeNext.set(step => {
            checkedSteps.push(step);
            return new Promise<boolean>(resolve => answer = resolve);
        });
        await fillInPickUp(fixture);

        await clickButton(fixture, root, 'Next');
        const next: HTMLButtonElement | null | undefined = findShownPanel(root)?.querySelector('button[type="submit"]');
        expect(checkedSteps).toEqual([0]);
        expect(next?.getAttribute('aria-busy')).toBe('true');
        expect(next?.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe('Checking');
        // a second click while it runs is dropped
        await clickButton(fixture, root, 'Next');
        expect(checkedSteps).toEqual([0]);

        answer(false);
        await settle(fixture);
        expect(fixture.componentInstance.step()).toBe(0);
        expect(next?.hasAttribute('aria-busy')).toBe(false);

        await clickButton(fixture, root, 'Next');
        answer(true);
        await settle(fixture);
        expect(checkedSteps).toEqual([0, 0]);
        expect(fixture.componentInstance.step()).toBe(1);
    });

    test('lets the user go back to a done step by its name when it isn\'t linear', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.step.set(2);
        await fixture.whenStable();
        expect(root.querySelector('ol button')).toBeNull();

        fixture.componentInstance.linear.set(false);
        await fixture.whenStable();
        const buttons: HTMLButtonElement[] = [...root.querySelectorAll<HTMLButtonElement>('ol button')];
        expect(buttons.map(button => button.textContent.trim())).toEqual(['Dates completed', 'Car completed']);

        buttons[1]?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.step()).toBe(1);
        expect(document.activeElement?.textContent).toBe('Car');
    });

    test('shows the content of the current step below its name when vertical, with the texts of the config', async () => {
        TestBed.configureTestingModule({ providers: [provideStepperConfig({ label: 'Schritte', nextLabel: 'Weiter', headingLevel: 3 })] });
        const [fixture, root] = await render();
        fixture.componentInstance.orientation.set('vertical');
        await fixture.whenStable();

        const first: HTMLElement | null = root.querySelector('ol > li');
        expect(root.querySelector('ol')?.getAttribute('aria-label')).toBe('Schritte');
        expect(first?.querySelector('h3')?.textContent).toBe('Dates');
        expect(first?.querySelector('ui-form:not([hidden]) input')).not.toBeNull();
        expect(root.textContent).not.toContain('Step 1 of 3');
        expect(findShownPanel(root)?.querySelector('h3')).toBeNull();
        expect(findShownPanel(root)?.querySelector('button')?.textContent.trim()).toBe('Weiter');
    });
});