import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { faWrench } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconDefinition } from '@service-soft/ui/icon';
import { describe, expect, test } from 'vitest';

import { ResultActionsComponent } from './result-actions.component';
import { provideResultConfig } from './result-config.provider';
import { ResultComponent } from './result.component';

@Component({
    selector: 'ui-result-host',
    template: `<ui-result tone="success" heading="Thank you for your order"><p>We sent the confirmation to your email address.</p>
        <ui-result-actions><a ui-button href="/">Back to the start page</a></ui-result-actions></ui-result>
        <ui-result heading="Down for maintenance" [headingLevel]="2" [icon]="wrench" />`,
    imports: [ResultComponent, ResultActionsComponent, ButtonComponent]
})
class ResultHostComponent {
    readonly wrench: IconDefinition = faWrench;
}

async function render(): Promise<HTMLElement[]> {
    const fixture: ComponentFixture<ResultHostComponent> = TestBed.createComponent(ResultHostComponent);
    await fixture.whenStable();
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('ui-result')];
}

function getIconPath(result: HTMLElement | undefined): string | null | undefined {
    return result?.querySelector('svg path')?.getAttribute('d');
}

describe('ResultComponent', () => {
    test('shows the icon of its tone, its heading as a h1, the text and then the actions', async () => {
        const [success] = await render();

        const icon: Element | null | undefined = success?.querySelector('svg');
        expect(icon?.getAttribute('aria-hidden')).toBe('true');
        expect(icon?.closest('span')?.classList).toContain('bg-success');
        expect(success?.querySelector('h1')?.textContent).toBe('Thank you for your order');
        expect(success?.querySelector('p')?.textContent).toBe('We sent the confirmation to your email address.');
        const actions: Element | null | undefined = success?.querySelector('ui-result-actions');
        expect(actions?.querySelector('a')?.getAttribute('href')).toBe('/');
        expect(success?.lastElementChild).toBe(actions);
    });

    test('takes another heading level and icon, and is neutral unless it says otherwise', async () => {
        const [, maintenance] = await render();

        expect(maintenance?.querySelector('h1')).toBeNull();
        expect(maintenance?.querySelector('h2')?.textContent).toBe('Down for maintenance');
        expect(maintenance?.querySelector('svg')?.closest('span')?.classList).toContain('bg-surface-container');
        expect(getIconPath(maintenance)).toBe(faWrench.icon[4]);
    });

    test('takes the tone, the heading level and the icons the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideResultConfig({ tone: 'info', headingLevel: 2, icons: { success: faWrench } })] });
        const [success, maintenance] = await render();

        expect(success?.querySelector('h2')).not.toBeNull();
        expect(getIconPath(success)).toBe(faWrench.icon[4]);
        expect(maintenance?.querySelector('svg')?.closest('span')?.classList).toContain('bg-primary');
    });
});