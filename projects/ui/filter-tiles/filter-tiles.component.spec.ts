import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { faTooth } from '@fortawesome/free-solid-svg-icons';
import { describe, expect, test } from 'vitest';

import { FilterTileOption } from './filter-tile-option.model';
import { provideFilterTilesConfig } from './filter-tiles-config.provider';
import { FilterTilesComponent } from './filter-tiles.component';

@Component({
    selector: 'ui-filter-tiles-host',
    template: `
        <ui-filter-tiles label="Categories" [options]="options" [allCount]="7" [multiple]="multiple()" [(value)]="chosen" />
    `,
    imports: [FilterTilesComponent]
})
class FilterTilesHostComponent {
    readonly options: FilterTileOption<string>[] = [
        { value: 'implants', label: 'Implants', icon: faTooth, count: 3 },
        { value: 'prophylaxis', label: 'Prophylaxis', count: 4 },
        { value: 'kids', label: 'Kids' }
    ];

    readonly chosen: WritableSignal<string[]> = signal([]);

    readonly multiple: WritableSignal<boolean> = signal(false);
}

/**
 * A tile as screen readers read it: its name and whether it is pressed.
 */
type Tile = [string, boolean];

async function render(): Promise<[ComponentFixture<FilterTilesHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<FilterTilesHostComponent> = TestBed.createComponent(FilterTilesHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findTiles(root: HTMLElement): Tile[] {
    return [...root.querySelectorAll('[role="group"] > button')].map(button => {
        const name: string = [...button.querySelectorAll('span:not([aria-hidden])')].map(span => span.textContent.trim()).join(' ');
        return [name, button.getAttribute('aria-pressed') === 'true'];
    });
}

async function press(fixture: ComponentFixture<unknown>, root: HTMLElement, index: number): Promise<void> {
    root.querySelectorAll<HTMLButtonElement>('[role="group"] > button')[index]?.click();
    await fixture.whenStable();
}

describe('FilterTilesComponent', () => {
    test('is a named group of toggle buttons, everything first, with the counts read with what they count', async () => {
        const [, root] = await render();

        expect(root.querySelector('[role="group"]')?.getAttribute('aria-label')).toBe('Categories');
        expect(findTiles(root)).toEqual([
            ['All (7 items)', true],
            ['Implants (3 items)', false],
            ['Prophylaxis (4 items)', false],
            ['Kids', false]
        ]);
        // the tile of everything has an icon as well, as one of the others has
        expect(root.querySelectorAll('button:first-child svg, button:nth-child(2) svg')).toHaveLength(2);
        expect(root.querySelector('button:nth-child(3) svg')).toBeNull();
    });

    test('chooses one tile at a time, and shows everything again when it is pressed again or everything is', async () => {
        const [fixture, root] = await render();

        await press(fixture, root, 1);
        expect(fixture.componentInstance.chosen()).toEqual(['implants']);
        expect(findTiles(root).map(([, pressed]) => pressed)).toEqual([false, true, false, false]);
        expect(root.querySelector('button:nth-child(2)')?.classList).toContain('bg-primary');

        await press(fixture, root, 2);
        expect(fixture.componentInstance.chosen()).toEqual(['prophylaxis']);
        await press(fixture, root, 2);
        expect(fixture.componentInstance.chosen()).toEqual([]);

        await press(fixture, root, 3);
        await press(fixture, root, 0);
        expect(fixture.componentInstance.chosen()).toEqual([]);
    });

    test('chooses every tile on its own with multiple', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.multiple.set(true);
        await fixture.whenStable();

        await press(fixture, root, 1);
        await press(fixture, root, 3);
        expect(fixture.componentInstance.chosen()).toEqual(['implants', 'kids']);
        expect(findTiles(root).map(([, pressed]) => pressed)).toEqual([false, true, false, true]);

        await press(fixture, root, 1);
        expect(fixture.componentInstance.chosen()).toEqual(['kids']);
    });

    test('takes its texts and its color from the config', async () => {
        TestBed.configureTestingModule({
            providers: [provideFilterTilesConfig({ allLabel: 'Alle', countLabel: count => `${count} Behandlungen`, color: 'secondary' })]
        });
        const [, root] = await render();

        expect(findTiles(root)[0]).toEqual(['Alle (7 Behandlungen)', true]);
        expect(root.querySelector('button')?.classList).toContain('bg-secondary');
    });
});