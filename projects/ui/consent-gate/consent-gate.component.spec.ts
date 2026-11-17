import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideConsentGateConfig } from './consent-gate-config.provider';
import { ConsentGateComponent } from './consent-gate.component';

@Component({
    selector: 'ui-consent-gate-host',
    templateUrl: './consent-gate.component.spec.html',
    imports: [ConsentGateComponent]
})
class ConsentGateHostComponent {
    readonly consented: WritableSignal<boolean> = signal(false);

    alwaysAllowed: number = 0;
}

async function render(): Promise<[ComponentFixture<ConsentGateHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<ConsentGateHostComponent> = TestBed.createComponent(ConsentGateHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findButton(root: HTMLElement, text: string): HTMLButtonElement | undefined {
    return [...root.querySelectorAll('button')].find(button => button.textContent.trim() === text);
}

describe('ConsentGateComponent', () => {
    test('shows who the content is from and why it needs consent, and nothing of the content', async () => {
        TestBed.configureTestingModule({ providers: [provideConsentGateConfig({ privacyPolicyUrl: '/privacy' })] });
        const [, root] = await render();

        expect(root.querySelector('[data-video]')).toBeNull();
        expect(root.textContent).toContain('Content from YouTube');
        expect(root.textContent).toContain('your browser loads it from YouTube');
        const [privacyPolicy, providerPrivacyPolicy] = root.querySelectorAll('a');
        expect(privacyPolicy?.getAttribute('href')).toBe('/privacy');
        expect(privacyPolicy?.textContent.trim()).toBe('Privacy policy');
        // the policy of the provider opens in a new tab, so the user doesn't lose the page
        expect(providerPrivacyPolicy?.getAttribute('href')).toBe('https://policies.google.com/privacy');
        expect(providerPrivacyPolicy?.getAttribute('target')).toBe('_blank');
        expect(providerPrivacyPolicy?.textContent).toContain('Privacy policy of YouTube');
        expect(root.querySelector<HTMLElement>('ui-consent-gate')?.style.aspectRatio).toBe('16 / 9');
    });

    test('loads the content once the user allowed it this once, and gives it the focus of the button', async () => {
        const [fixture, root] = await render();
        const load: HTMLButtonElement | undefined = findButton(root, 'Load YouTube');
        load?.focus();
        load?.click();
        await fixture.whenStable();

        expect(fixture.componentInstance.consented()).toBe(true);
        expect(fixture.componentInstance.alwaysAllowed).toBe(0);
        expect(root.querySelector('[data-video]')?.textContent).toBe('The video');
        expect(document.activeElement).toBe(root.querySelector('[data-video]')?.parentElement);
    });

    test('tells the app when the user always allows the provider', async () => {
        const [fixture, root] = await render();
        findButton(root, 'Always allow YouTube')?.click();
        await fixture.whenStable();

        expect(fixture.componentInstance.consented()).toBe(true);
        expect(fixture.componentInstance.alwaysAllowed).toBe(1);
    });

    test('shows the content right away when the app knows the consent already', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.consented.set(true);
        await fixture.whenStable();

        expect(root.querySelector('[data-video]')).not.toBeNull();
        expect(root.querySelector('button')).toBeNull();
    });
});