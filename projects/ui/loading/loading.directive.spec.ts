import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideLoadingConfig } from './loading-config.provider';
import { LoadingDirective } from './loading.directive';

@Component({
    selector: 'ui-loading-host',
    template: `
        <section aria-label="Orders" [uiLoading]="loading()"><button type="button">Open</button><p inert>Ignored</p></section>
        <button type="button">Outside</button>
    `,
    imports: [LoadingDirective]
})
class LoadingHostComponent {
    readonly loading: WritableSignal<boolean> = signal(false);
}

async function render(): Promise<[ComponentFixture<LoadingHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<LoadingHostComponent> = TestBed.createComponent(LoadingHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

async function setLoading(fixture: ComponentFixture<LoadingHostComponent>, loading: boolean): Promise<void> {
    fixture.componentInstance.loading.set(loading);
    await fixture.whenStable();
}

describe('LoadingDirective', () => {
    test('shows a spinner over only the area while it loads, which is busy and can\'t be used, and gives it back afterwards', async () => {
        const [fixture, root] = await render();
        const area: HTMLElement | null = root.querySelector('section');
        const [inside, outside] = root.querySelectorAll('button');
        expect(area?.hasAttribute('aria-busy')).toBe(false);
        expect(area?.querySelector('ui-loading-overlay')).toBeNull();

        await setLoading(fixture, true);
        expect(area?.getAttribute('aria-busy')).toBe('true');
        expect(inside?.closest('[inert]')).toBe(inside);
        expect(outside?.closest('[inert]')).toBeNull();
        // positioned, so the overlay covers the area and not its parent
        expect(area?.style.position).toBe('relative');
        const spinner: Element | null | undefined = area?.querySelector('ui-loading-overlay [role="progressbar"]');
        expect(spinner?.getAttribute('aria-label')).toBe('Loading');
        // the spinner is not inert, so screen readers can read it
        expect(spinner?.closest('[inert]')).toBeNull();

        await setLoading(fixture, false);
        expect(area?.hasAttribute('aria-busy')).toBe(false);
        expect(area?.querySelector('ui-loading-overlay')).toBeNull();
        expect(inside?.hasAttribute('inert')).toBe(false);
        // what the app made inert stays so
        expect(area?.querySelector('p')?.hasAttribute('inert')).toBe(true);
        expect(area?.style.position).toBe('');
    });

    test('reads the label the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideLoadingConfig({ label: 'Lädt' })] });
        const [fixture, root] = await render();
        await setLoading(fixture, true);

        expect(root.querySelector('[role="progressbar"]')?.getAttribute('aria-label')).toBe('Lädt');
    });

    test('shows no overlay on the server, only that the area is busy', async () => {
        const server: { ngServerMode?: boolean } = globalThis;
        server.ngServerMode = true;
        try {
            const [fixture, root] = await render();
            await setLoading(fixture, true);

            expect(root.querySelector('section')?.getAttribute('aria-busy')).toBe('true');
            expect(root.querySelector('ui-loading-overlay')).toBeNull();
        }
        finally {
            delete server.ngServerMode;
        }
    });
});