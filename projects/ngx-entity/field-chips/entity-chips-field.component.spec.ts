import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntityClass, EntityUtilities, Property } from '@service-soft/ngx-entity/entity';
import { EntityFormComponent } from '@service-soft/ngx-entity/form';
import { FormTestingUtilities } from 'testing/form';
import { describe, expect, test } from 'vitest';

enum Weekday {
    MONDAY = 'Monday',
    FRIDAY = 'Friday'
}

class Article {
    @Property.array({ displayName: 'Tags', items: { type: 'string', options: ['angular', 'signals'], minLength: 3 } })
    tags!: string[];

    @Property.array({ displayName: 'Scores', items: { type: 'number', format: 'integer', min: 1, max: 10 } })
    scores!: number[];

    @Property.array({ displayName: 'Days', items: { type: 'string', enum: Weekday } })
    days!: Weekday[];
}

@Component({
    selector: 'ngx-host',
    template: '<ngx-entity-form [entity]="entity" [(value)]="value" />',
    imports: [EntityFormComponent]
})
class HostComponent {
    readonly entity: EntityClass<Article> = Article;
    readonly value: WritableSignal<Partial<Article>> = signal(EntityUtilities.resolveDefaults(Article));
}

async function render(): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    // the fields load their components first.
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getInput(root: HTMLElement, label: string): HTMLInputElement {
    const input: HTMLInputElement | undefined = FormTestingUtilities.findLabelledInput(root, label);
    if (input == undefined) {
        throw new Error(`No input labelled "${label}".`);
    }
    return input;
}

async function typeAndEnter(fixture: ComponentFixture<HostComponent>, input: HTMLInputElement, text: string): Promise<void> {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    await fixture.whenStable();
}

function findError(input: HTMLInputElement): string | undefined {
    return document.getElementById(input.getAttribute('aria-describedby') ?? '')?.textContent?.trim();
}

describe('EntityChipsFieldComponent', () => {
    test('takes typed strings and numbers that meet the rules of the items, and starts with an empty array', async () => {
        const [fixture, root] = await render();
        expect(fixture.componentInstance.value()).toEqual({ tags: [], scores: [], days: [] });

        await typeAndEnter(fixture, getInput(root, 'Tags'), 'testing');
        await typeAndEnter(fixture, getInput(root, 'Scores'), '7');
        expect(fixture.componentInstance.value()).toEqual({ tags: ['testing'], scores: [7], days: [] });
    });

    test('keeps a typed text that breaks a rule, with its error', async () => {
        const [fixture, root] = await render();
        const scores: HTMLInputElement = getInput(root, 'Scores');

        await typeAndEnter(fixture, scores, '11');
        scores.dispatchEvent(new Event('blur'));
        await fixture.whenStable();
        expect(fixture.componentInstance.value().scores).toEqual([]);
        expect(scores.value).toBe('11');
        expect(findError(scores)).toBe('The value is too large.');
        expect(scores.checkValidity()).toBe(false);

        await typeAndEnter(fixture, scores, '2.5');
        expect(findError(scores)).toBe('The value is not one of the allowed steps.');

        // no option contains it, so Enter takes the text, which is too short
        await typeAndEnter(fixture, getInput(root, 'Tags'), 'xy');
        expect(fixture.componentInstance.value().tags).toEqual([]);
        expect(findError(getInput(root, 'Tags'))).toBe('The value is too short.');
    });

    test('only chooses the members of an enum', async () => {
        const [fixture, root] = await render();
        const days: HTMLInputElement = getInput(root, 'Days');

        await typeAndEnter(fixture, days, 'Sunday');
        expect(fixture.componentInstance.value().days).toEqual([]);
        // a typed text that is no member has no error, it just isn't an option
        expect(days.checkValidity()).toBe(true);
    });
});