import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { PaginationComponent } from './pagination.component';

@Component({
    selector: 'ui-pagination-host',
    template: '<ui-pagination [totalAmount]="totalAmount()" [pageSize]="10" [(page)]="page" />',
    imports: [PaginationComponent]
})
class PaginationHostComponent {
    readonly page: WritableSignal<number> = signal(1);

    readonly totalAmount: WritableSignal<number> = signal(95);
}

async function render(page: number, totalAmount: number = 95): Promise<[ComponentFixture<PaginationHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<PaginationHostComponent> = TestBed.createComponent(PaginationHostComponent);
    fixture.componentInstance.page.set(page);
    fixture.componentInstance.totalAmount.set(totalAmount);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the items as the user sees them, with the current page in brackets.
function getItems(root: HTMLElement): string[] {
    return [...root.querySelectorAll('li')].map(item => {
        const text: string = item.textContent.trim();
        return item.querySelector('[aria-current="page"]') == undefined ? text : `[${text}]`;
    });
}

function findButton(root: HTMLElement, name: string): HTMLButtonElement {
    const button: HTMLButtonElement | undefined = [...root.querySelectorAll('button')].find(other => other.getAttribute('aria-label') === name);
    if (button == undefined) {
        throw new Error(`There is no button "${name}".`);
    }
    return button;
}

describe('PaginationComponent', () => {
    // the arrows have no text: first, previous, then the pages, then next and last
    test('shows five pages around the current one, moved to the side near the first and the last page', async () => {
        const [fixture, root] = await render(5);
        expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('Pages');
        expect(getItems(root)).toEqual(['', '', '3', '4', '[5]', '6', '7', '', '']);

        fixture.componentInstance.page.set(2);
        await fixture.whenStable();
        expect(getItems(root)).toEqual(['', '', '1', '[2]', '3', '4', '5', '', '']);

        fixture.componentInstance.page.set(10);
        await fixture.whenStable();
        expect(getItems(root)).toEqual(['', '', '6', '7', '8', '9', '[10]', '', '']);

        // fewer pages than buttons
        fixture.componentInstance.totalAmount.set(30);
        fixture.componentInstance.page.set(2);
        await fixture.whenStable();
        expect(getItems(root)).toEqual(['', '', '1', '[2]', '3', '', '']);
    });

    test('makes the number of every page as wide as the one of the last page, so the buttons keep their width', async () => {
        const [, root] = await render(1);

        const numbers: HTMLElement[] = [...root.querySelectorAll<HTMLElement>('button[aria-label^="Page"] span')];
        expect(numbers.map(number => number.style.minWidth)).toEqual(['2ch', '2ch', '2ch', '2ch', '2ch']);
    });

    test('goes to the first and the last page, and leaves the focus on its button once the arrow can\'t be used', async () => {
        const [fixture, root] = await render(5);

        findButton(root, 'Last page').focus();
        findButton(root, 'Last page').click();
        await fixture.whenStable();
        expect(fixture.componentInstance.page()).toBe(10);
        expect(findButton(root, 'Last page').disabled).toBe(true);
        expect(document.activeElement).toBe(findButton(root, 'Page 10'));

        findButton(root, 'First page').click();
        await fixture.whenStable();
        expect(fixture.componentInstance.page()).toBe(1);
        expect(findButton(root, 'First page').disabled).toBe(true);
        expect(document.activeElement).toBe(findButton(root, 'Page 1'));
    });

    test('goes to a page with its button and the arrows, which can\'t go past the first and the last page', async () => {
        const [fixture, root] = await render(1, 30);
        expect(findButton(root, 'Previous page').disabled).toBe(true);

        findButton(root, 'Page 2').click();
        await fixture.whenStable();
        expect(fixture.componentInstance.page()).toBe(2);

        findButton(root, 'Next page').focus();
        findButton(root, 'Next page').click();
        await fixture.whenStable();
        expect(fixture.componentInstance.page()).toBe(3);
        expect(findButton(root, 'Next page').disabled).toBe(true);
        // the arrow can no longer be used, so the page that was reached has focus
        expect(document.activeElement).toBe(findButton(root, 'Page 3'));
    });

    // a button that becomes or stops being the current one fades its color. While the pages move, the current one
    // stays in the same button, so the highlight doesn't fade in behind the numbers.
    test('keeps the current page in the same button while the pages move, and the focus on the page that was clicked', async () => {
        const [fixture, root] = await render(5);
        const current: HTMLButtonElement = findButton(root, 'Page 5');

        findButton(root, 'Page 6').focus();
        findButton(root, 'Page 6').click();
        await fixture.whenStable();
        expect(getItems(root)).toEqual(['', '', '4', '5', '[6]', '7', '8', '', '']);
        expect(findButton(root, 'Page 6')).toBe(current);
        expect(document.activeElement).toBe(current);
    });

    test('shows nothing while there is only one page', async () => {
        const [, root] = await render(1, 10);
        expect(root.querySelector('nav')).toBeNull();
    });
});