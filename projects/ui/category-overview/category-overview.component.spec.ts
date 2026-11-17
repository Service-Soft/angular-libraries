import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideCategoryOverviewConfig } from './category-overview-config.provider';
import { CategoryOverviewGroup } from './category-overview-group.model';
import { CategoryOverviewComponent } from './category-overview.component';

@Component({
    selector: 'ui-category-overview-host',
    template: '<ui-category-overview [groups]="groups" />',
    imports: [CategoryOverviewComponent]
})
class CategoryOverviewHostComponent {
    readonly groups: CategoryOverviewGroup[] = [
        {
            name: 'Prophylaxis',
            id: 'prophylaxis',
            items: [
                { title: 'Teeth cleaning', text: 'Removes plaque and tartar.' },
                { title: 'Fissure sealing' }
            ]
        },
        { name: 'Implants', items: [{ title: 'Single tooth implant', text: 'Replaces one tooth.' }] }
    ];
}

/**
 * A category as it shows: the tag and text of its heading, and the titles and texts of its items.
 */
type ShownGroup = [string, string, [string, string][]];

async function render(): Promise<HTMLElement> {
    const fixture: ComponentFixture<CategoryOverviewHostComponent> = TestBed.createComponent(CategoryOverviewHostComponent);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
}

function findGroups(root: HTMLElement): ShownGroup[] {
    return [...root.querySelectorAll('section')].map(section => {
        const heading: Element | null | undefined = section.querySelector(':scope > ui-heading')?.firstElementChild;
        const items: [string, string][] = [...section.querySelectorAll('li')].map(item => {
            const title: Element | null | undefined = item.querySelector('ui-heading')?.firstElementChild;
            return [`${title?.tagName}: ${title?.textContent}`, item.querySelector('p')?.textContent ?? ''];
        });
        return [heading?.tagName ?? '', heading?.textContent ?? '', items];
    });
}

describe('CategoryOverviewComponent', () => {
    test('shows the items of every category in a list below its heading, their titles a level below', async () => {
        const root: HTMLElement = await render();

        expect(findGroups(root)).toEqual([
            ['H2', 'Prophylaxis', [['H3: Teeth cleaning', 'Removes plaque and tartar.'], ['H3: Fissure sealing', '']]],
            ['H2', 'Implants', [['H3: Single tooth implant', 'Replaces one tooth.']]]
        ]);
        // a link to a category leads to its section
        expect(root.querySelector('section')?.id).toBe('prophylaxis');
        expect(root.querySelectorAll('section')[1]?.hasAttribute('id')).toBe(false);
        // the check in front of every item is decorative
        expect(root.querySelector('li svg')?.getAttribute('aria-hidden')).toBe('true');
    });

    test('takes the heading level the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideCategoryOverviewConfig({ headingLevel: 3 })] });
        const root: HTMLElement = await render();

        expect(findGroups(root)[0]?.[0]).toBe('H3');
        expect(findGroups(root)[0]?.[2][0]?.[0]).toBe('H4: Teeth cleaning');
    });
});