import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideLinkConfig } from '@service-soft/ui/link';
import { describe, expect, test } from 'vitest';

import { provideLogoCloudConfig } from './logo-cloud-config.provider';
import { LogoCloudLogo } from './logo-cloud-logo.model';
import { LogoCloudComponent } from './logo-cloud.component';

const DATA_LOGO: string = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 1"/>')}`;

@Component({
    selector: 'ui-logo-cloud-host',
    template: '<ui-logo-cloud [logos]="logos" />',
    imports: [LogoCloudComponent]
})
class LogoCloudHostComponent {
    readonly logos: LogoCloudLogo[] = [
        { src: '/sponsors/acme.svg', alt: 'Acme', width: 160, height: 48, href: 'https://acme.example' },
        { src: DATA_LOGO, alt: 'Bakery Miller', width: 120, height: 30 },
        { src: '/sponsors/garage.png', alt: 'Garage Smith', width: 200, height: 50, href: 'https://garage.example', openInNewTab: false }
    ];
}

async function render(): Promise<HTMLElement[]> {
    const fixture: ComponentFixture<LogoCloudHostComponent> = TestBed.createComponent(LogoCloudHostComponent);
    await fixture.whenStable();
    return [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('li')];
}

describe('LogoCloudComponent', () => {
    test('is a list of the logos, linked where they have an href, which opens in a new tab and says so', async () => {
        const [acme, bakery, garage] = await render();

        expect(acme.parentElement?.getAttribute('role')).toBe('list');
        const link: HTMLAnchorElement | null = acme.querySelector('a');
        expect(link?.href).toBe('https://acme.example/');
        expect(link?.target).toBe('_blank');
        expect(link?.rel).toBe('noopener');
        // the name of the link is the alt of its logo, and that it opens in a new tab
        expect(link?.querySelector('img')?.alt).toBe('Acme');
        expect(link?.querySelector('.sr-only')?.textContent).toBe('(opens in a new tab)');

        expect(bakery.querySelector('a')).toBeNull();
        expect(bakery.querySelector('img')?.alt).toBe('Bakery Miller');

        expect(garage.querySelector('a')?.hasAttribute('target')).toBe(false);
        expect(garage.querySelector('.sr-only')).toBeNull();
    });

    test('loads images with NgOptimizedImage, data urls as they are, all as high as each other', async () => {
        const [acme, bakery] = await render();
        const optimized: HTMLImageElement | null = acme.querySelector('img');
        const inline: HTMLImageElement | null = bakery.querySelector('img');

        // NgOptimizedImage loads images below the fold lazily, and keeps their aspect ratio with width and height
        expect(optimized?.getAttribute('loading')).toBe('lazy');
        expect([optimized?.getAttribute('width'), optimized?.getAttribute('height')]).toEqual(['160', '48']);
        expect(inline?.getAttribute('src')).toBe(DATA_LOGO);
        expect(inline?.hasAttribute('loading')).toBe(false);
        expect(optimized?.classList).toContain('h-logo-cloud');
        expect(inline?.classList).toContain('h-logo-cloud');
    });

    test('takes whether links open in a new tab from the app', async () => {
        TestBed.configureTestingModule({ providers: [provideLogoCloudConfig({ openInNewTab: false })] });
        const [acme] = await render();

        expect(acme.querySelector('a')?.hasAttribute('target')).toBe(false);
        expect(acme.querySelector('.sr-only')).toBeNull();
    });

    test('tells screen readers about a new tab in the words of provideLinkConfig', async () => {
        TestBed.configureTestingModule({ providers: [provideLinkConfig({ newTabLabel: 'öffnet in neuem Tab' })] });
        const [acme] = await render();

        expect(acme.querySelector('.sr-only')?.textContent).toBe('(öffnet in neuem Tab)');
    });
});