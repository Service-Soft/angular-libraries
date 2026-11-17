import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { faCheck, faStar, faXmark } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@service-soft/ui/icon';
import { describe, expect, test } from 'vitest';

import { CheckListColor } from './check-list-color.type';
import { provideCheckListConfig } from './check-list-config.provider';
import { CheckListItemComponent } from './check-list-item.component';
import { CheckListComponent } from './check-list.component';

@Component({
    selector: 'ui-check-list-host',
    template: `
        <ui-check-list [color]="color()"><ui-check-list-item>Unlimited courses</ui-check-list-item>
            <ui-check-list-item [included]="false">Personal coach</ui-check-list-item><ui-check-list-item [icon]="star">Sauna</ui-check-list-item></ui-check-list>
    `,
    imports: [CheckListComponent, CheckListItemComponent]
})
class CheckListHostComponent {
    readonly color: WritableSignal<CheckListColor> = signal('primary');

    readonly star: typeof faStar = faStar;
}

async function render(): Promise<[ComponentFixture<CheckListHostComponent>, HTMLElement[]]> {
    const fixture: ComponentFixture<CheckListHostComponent> = TestBed.createComponent(CheckListHostComponent);
    await fixture.whenStable();
    return [fixture, [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('ui-check-list-item')]];
}

// the icon of an item that is not included.
const CROSS: IconDefinition = faXmark;

function getIconPath(item: HTMLElement): string | null | undefined {
    return item.querySelector('path')?.getAttribute('d');
}

describe('CheckListComponent', () => {
    test('is a list of items with a check, and a cross and a text for screen readers for one that is not included', async () => {
        const [, [included, excluded, own]] = await render();

        expect(included.parentElement?.tagName).toBe('UL');
        expect(included.parentElement?.getAttribute('role')).toBe('list');
        expect(included.getAttribute('role')).toBe('listitem');
        expect(included.textContent.trim()).toBe('Unlimited courses');
        expect(getIconPath(included)).toBe(faCheck.icon[4]);
        expect(included.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        expect(included.querySelector('.sr-only')).toBeNull();

        expect(getIconPath(excluded)).toBe(CROSS.icon[4]);
        expect(excluded.querySelector('.sr-only')?.textContent).toBe('(not included)');
        expect(excluded.querySelector('span')?.classList).toContain('text-on-surface-variant');
        expect(getIconPath(own)).toBe(faStar.icon[4]);
    });

    test('draws the icons of the included items in the color of the list', async () => {
        const [fixture, [included, excluded]] = await render();
        expect(included.querySelector('span')?.classList).toContain('text-primary');

        fixture.componentInstance.color.set('success');
        await fixture.whenStable();
        expect(included.querySelector('span')?.classList).toContain('text-success-text');
        expect(excluded.querySelector('span')?.classList).not.toContain('text-success-text');
    });

    test('takes the icons and the text the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideCheckListConfig({ excludedLabel: 'nicht enthalten', icon: faStar })] });
        const [, [included, excluded]] = await render();

        expect(getIconPath(included)).toBe(faStar.icon[4]);
        expect(excluded.querySelector('.sr-only')?.textContent).toBe('(nicht enthalten)');
    });
});