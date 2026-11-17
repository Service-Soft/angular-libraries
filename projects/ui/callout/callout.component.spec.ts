import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { faBell, faCircleInfo, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@service-soft/ui/icon';
import { describe, expect, test } from 'vitest';

import { provideCalloutConfig } from './callout-config.provider';
import { CalloutTone } from './callout-tone.type';
import { CalloutComponent } from './callout.component';

@Component({
    selector: 'ui-callout-host',
    template: `
        <ui-callout [tone]="tone()" [heading]="heading()" [icon]="icon()">
            <p>The office is closed on public holidays.</p>
        </ui-callout>
    `,
    imports: [CalloutComponent]
})
class CalloutHostComponent {
    readonly tone: WritableSignal<CalloutTone> = signal('warning');

    readonly heading: WritableSignal<string | undefined> = signal('Closed on holidays');

    readonly icon: WritableSignal<IconDefinition | undefined> = signal(undefined);
}

async function render(): Promise<[ComponentFixture<CalloutHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<CalloutHostComponent> = TestBed.createComponent(CalloutHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

// the path of the svg the callout draws, which tells the icons apart.
function getIconPath(root: HTMLElement): string | null | undefined {
    return root.querySelector('ui-icon path')?.getAttribute('d');
}

describe('CalloutComponent', () => {
    test('tells screen readers its tone before its heading and content, and is no live region', async () => {
        const [, root] = await render();
        const box: HTMLElement | null = root.querySelector('ui-callout > div');

        expect(root.querySelector('.sr-only')?.textContent.trim()).toBe('Warning');
        const texts: string[] = [...box?.lastElementChild?.children ?? []].map(part => part.textContent.trim());
        expect(texts).toEqual(['Warning', 'Closed on holidays', 'The office is closed on public holidays.']);
        expect(box?.classList).toContain('bg-warning-tint');
        expect(root.querySelector('[role]')).toBeNull();
        expect(root.querySelector('[aria-live]')).toBeNull();
        // the text above says the tone, so the icon is decorative
        expect(root.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        expect(getIconPath(root)).toBe(faTriangleExclamation.icon[4]);
    });

    test('a neutral callout reads only its content, and an icon of its own replaces the one of the tone', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.tone.set('neutral');
        fixture.componentInstance.heading.set(undefined);
        fixture.componentInstance.icon.set(faBell);
        await fixture.whenStable();

        expect(root.querySelector('.sr-only')).toBeNull();
        expect(root.querySelector('p')?.textContent.trim()).toBe('The office is closed on public holidays.');
        expect(root.querySelector('ui-callout > div')?.classList).toContain('bg-surface-container');
        expect(getIconPath(root)).toBe(faBell.icon[4]);
    });

    test('takes the texts for screen readers the app provides', async () => {
        const toneLabels: Record<CalloutTone, string | undefined> = {
            neutral: undefined, info: 'Hinweis', success: 'Erfolg', warning: 'Warnung', error: 'Fehler', promo: 'Angebot'
        };
        TestBed.configureTestingModule({ providers: [provideCalloutConfig({ toneLabels })] });
        const [fixture, root] = await render();
        fixture.componentInstance.tone.set('promo');
        await fixture.whenStable();
        expect(root.querySelector('.sr-only')?.textContent.trim()).toBe('Angebot');

        fixture.componentInstance.tone.set('info');
        await fixture.whenStable();
        expect(root.querySelector('.sr-only')?.textContent.trim()).toBe('Hinweis');
        expect(getIconPath(root)).toBe(faCircleInfo.icon[4]);
    });
});