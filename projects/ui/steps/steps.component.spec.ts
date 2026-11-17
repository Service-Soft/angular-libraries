import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { StepComponent } from './step.component';
import { provideStepsConfig } from './steps-config.provider';
import { StepsComponent } from './steps.component';

@Component({
    selector: 'ui-steps-host',
    template: `
        <ui-steps><ui-step heading="Sign up"><p>Online or in the office.</p></ui-step><ui-step heading="Try it" />
            @if (third()) {<ui-step heading="Join" />}</ui-steps>
    `,
    imports: [StepsComponent, StepComponent]
})
class StepsHostComponent {
    readonly third: WritableSignal<boolean> = signal(true);
}

async function render(): Promise<[ComponentFixture<StepsHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<StepsHostComponent> = TestBed.createComponent(StepsHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the number each step shows, which screen readers skip.
function getNumbers(root: HTMLElement): (string | undefined)[] {
    return [...root.querySelectorAll('ui-step')].map(step => step.querySelector('[aria-hidden="true"]')?.textContent.trim());
}

describe('StepsComponent', () => {
    test('is an ordered list of the steps, numbered in their order, with their heading and text', async () => {
        const [, root] = await render();
        const list: HTMLElement | null = root.querySelector('ol');
        const steps: Element[] = [...root.querySelectorAll('ui-step')];

        expect(list?.getAttribute('role')).toBe('list');
        expect(steps.map(step => [step.parentElement, step.getAttribute('role')])).toEqual(steps.map(() => [list, 'listitem']));
        expect(getNumbers(root)).toEqual(['1', '2', '3']);
        expect(steps[0].querySelector('p')?.textContent).toBe('Sign up');
        expect(steps[0].textContent).toContain('Online or in the office.');
    });

    test('numbers the steps again when one is removed', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.third.set(false);
        await fixture.whenStable();

        expect(getNumbers(root)).toEqual(['1', '2']);
    });

    test('stands next to each other from the breakpoint of the list on, with the orientation the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideStepsConfig({ orientation: 'horizontal' })] });
        const [, root] = await render();

        expect(root.querySelector('ol')?.classList).toContain('@3xl:grid-flow-col');
        expect(root.querySelector('ui-step')?.classList).toContain('@3xl:grid-cols-1');
        // a step as high as the highest one of the row keeps its marker at the top, level with the others
        expect(root.querySelector('ui-step')?.classList).toContain('content-start');
    });
});