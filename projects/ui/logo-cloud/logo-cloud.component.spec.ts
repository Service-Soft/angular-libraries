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
    logos: LogoCloudLogo[] = [
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

    test('loads images with NgOptimizedImage, data urls as they are, all with the area of the same square', async () => {
        const [acme, bakery, garage] = await render();
        const optimized: HTMLImageElement | null = acme.querySelector('img');
        const inline: HTMLImageElement | null = bakery.querySelector('img');

        // NgOptimizedImage loads images below the fold lazily, and keeps their aspect ratio with width and height
        expect(optimized?.getAttribute('loading')).toBe('lazy');
        expect([optimized?.getAttribute('width'), optimized?.getAttribute('height')]).toEqual(['160', '48']);
        expect(inline?.getAttribute('src')).toBe(DATA_LOGO);
        expect(inline?.hasAttribute('loading')).toBe(false);
        // a logo 3.33 times as wide as high is 1 / √3.33 as high as the square and √3.33 as wide, one 4 times as wide
        // half as high and twice as wide
        expect(optimized?.style.height).toBe('calc(var(--spacing-logo-cloud) * 0.548)');
        expect(inline?.style.height).toBe('calc(var(--spacing-logo-cloud) * 0.5)');
        expect(garage?.querySelector('img')?.style.height).toBe('calc(var(--spacing-logo-cloud) * 0.5)');
    });

    test('keeps a very wide logo within two and a half squares, and a tall one within a quarter more than a square', async () => {
        const fixture: ComponentFixture<LogoCloudHostComponent> = TestBed.createComponent(LogoCloudHostComponent);
        fixture.componentInstance.logos = [
            { src: '/wordmark.png', alt: 'Wordmark', width: 500, height: 50 },
            { src: '/tall.png', alt: 'Tall', width: 50, height: 200 }
        ];
        await fixture.whenStable();
        const [wordmark, tall] = [...(fixture.nativeElement as HTMLElement).querySelectorAll('img')];

        // 10 times as wide: 2.5 squares wide is a quarter of the height, where the area would be 1 / √10 ≈ 0.316
        expect(wordmark?.style.height).toBe('calc(var(--spacing-logo-cloud) * 0.25)');
        // 4 times as high: the area would be 2 squares high
        expect(tall?.style.height).toBe('calc(var(--spacing-logo-cloud) * 1.25)');
    });

    test('takes whether links open in a new tab from the app', async () => {
        TestBed.configureTestingModule({ providers: [provideLogoCloudConfig({ openInNewTab: false })] });
        const [acme] = await render();

        expect(acme.querySelector('a')?.hasAttribute('target')).toBe(false);
        expect(acme.querySelector('.sr-only')).toBeNull();
    });

    test('keeps the colors of the logos, or draws them gray until the pointer is on them or their link has the focus', async () => {
        const [acme] = await render();
        expect(acme.querySelector('img')?.classList).not.toContain('grayscale');

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({ providers: [provideLogoCloudConfig({ grayscale: true })] });
        const [grayAcme, grayBakery] = await render();

        for (const logo of [grayAcme, grayBakery]) {
            const classes: DOMTokenList | undefined = logo.querySelector('img')?.classList;
            expect(logo.classList).toContain('group');
            expect(classes).toContain('grayscale');
            // the color fades in and out instead of jumping
            expect(classes).toContain('motion-safe:duration-500');
            expect(classes).toContain('group-hover:grayscale-0');
            expect(classes).toContain('group-focus-within:grayscale-0');
        }
    });

    test('tells screen readers about a new tab in the words of provideLinkConfig', async () => {
        TestBed.configureTestingModule({ providers: [provideLinkConfig({ newTabLabel: 'öffnet in neuem Tab' })] });
        const [acme] = await render();

        expect(acme.querySelector('.sr-only')?.textContent).toBe('(öffnet in neuem Tab)');
    });
});