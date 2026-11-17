import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { faCartShopping, faInbox, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { HeadingLevel } from '@service-soft/ui/heading';
import { IconDefinition } from '@service-soft/ui/icon';
import { describe, expect, test } from 'vitest';

import { EmptyStateActionsComponent } from './empty-state-actions.component';
import { provideEmptyStateConfig } from './empty-state-config.provider';
import { EmptyStateVariant } from './empty-state-variant.type';
import { EmptyStateComponent } from './empty-state.component';

@Component({
    selector: 'ui-empty-state-host',
    template: `
        <ui-empty-state title="No orders yet" text="Orders show here once a customer ordered." [variant]="variant()" [headingLevel]="level()" [icon]="icon()">
            <ui-empty-state-actions><button type="button">New order</button></ui-empty-state-actions>
        </ui-empty-state>
    `,
    imports: [EmptyStateComponent, EmptyStateActionsComponent]
})
class EmptyStateHostComponent {
    readonly variant: WritableSignal<EmptyStateVariant> = signal('empty');

    readonly level: WritableSignal<HeadingLevel | undefined> = signal(undefined);

    readonly icon: WritableSignal<IconDefinition | undefined> = signal(undefined);
}

// binds nothing but the title, so every other input takes the default of the config.
@Component({
    selector: 'ui-empty-state-defaults-host',
    template: '<ui-empty-state title="No orders yet" />',
    imports: [EmptyStateComponent]
})
class DefaultsHostComponent {}

async function render(): Promise<[ComponentFixture<EmptyStateHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<EmptyStateHostComponent> = TestBed.createComponent(EmptyStateHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findIconPath(root: HTMLElement): string | null | undefined {
    return root.querySelector('svg path')?.getAttribute('d');
}

describe('EmptyStateComponent', () => {
    test('shows the icon of its variant, the title, the text and the actions, with a title that is no heading by default', async () => {
        const [, root] = await render();

        expect(findIconPath(root)).toBe(faInbox.icon[4]);
        // decorative, the title says it
        expect(root.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        expect(root.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull();
        expect([...root.querySelectorAll('p')].map(text => text.textContent.trim())).toEqual([
            'No orders yet',
            'Orders show here once a customer ordered.'
        ]);
        expect(root.querySelector('ui-empty-state-actions button')?.textContent).toBe('New order');
    });

    test('is a heading of the level it is given, and an error in the error color', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.level.set(2);
        fixture.componentInstance.variant.set('error');
        await fixture.whenStable();

        expect(root.querySelector('h2')?.textContent.trim()).toBe('No orders yet');
        expect(findIconPath(root)).toBe(faTriangleExclamation.icon[4]);
        expect(root.querySelector('svg')?.closest('span')?.classList).toContain('text-error');

        fixture.componentInstance.icon.set(faCartShopping);
        await fixture.whenStable();
        expect(findIconPath(root)).toBe(faCartShopping.icon[4]);
    });

    test('takes the heading level and size the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideEmptyStateConfig({ headingLevel: 3, size: 'compact' })] });
        const fixture: ComponentFixture<DefaultsHostComponent> = TestBed.createComponent(DefaultsHostComponent);
        await fixture.whenStable();
        const root: HTMLElement = fixture.nativeElement as HTMLElement;

        expect(root.querySelector('h3')?.textContent.trim()).toBe('No orders yet');
        expect(root.querySelector('ui-empty-state > div')?.classList).toContain('py-6');
    });
});