import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { GOOGLE_MAPS_PROVIDER } from './google-maps-provider';
import { provideMapConfig } from './map-config.provider';
import { MapLocation } from './map-location.model';
import { MapComponent } from './map.component';
import { OPEN_STREET_MAP_PROVIDER } from './open-street-map-provider';

const PRACTICE: MapLocation = { address: 'Main Street 1, 50999 Cologne', coordinates: { latitude: 50.9375, longitude: 6.9603 } };

@Component({
    selector: 'ui-map-host',
    template: '<ui-map label="Map of the practice" [location]="location" [(consented)]="consented" />',
    imports: [MapComponent]
})
class MapHostComponent {
    readonly location: MapLocation = PRACTICE;

    readonly consented: WritableSignal<boolean> = signal(false);
}

async function render(): Promise<[ComponentFixture<MapHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<MapHostComponent> = TestBed.createComponent(MapHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

describe('MapComponent', () => {
    test('loads the map of Google Maps only after the consent, and links the route before it', async () => {
        const [fixture, root] = await render();

        expect(root.querySelector('iframe')).toBeNull();
        expect(root.textContent).toContain('Content from Google Maps');
        const route: HTMLAnchorElement | null = root.querySelector('a[target="_blank"][ui-button]');
        expect(route?.getAttribute('href')).toBe('https://www.google.com/maps/dir/?api=1&destination=Main%20Street%201%2C%2050999%20Cologne');
        expect(route?.textContent).toContain('Plan route');

        [...root.querySelectorAll('button')].find(button => button.textContent.includes('Load'))?.click();
        await fixture.whenStable();
        const iframe: HTMLIFrameElement | null = root.querySelector('iframe');
        expect(fixture.componentInstance.consented()).toBe(true);
        expect(iframe?.getAttribute('src')).toBe('https://www.google.com/maps?q=Main%20Street%201%2C%2050999%20Cologne&z=15&output=embed');
        expect(iframe?.title).toBe('Map of the practice');
    });

    test('takes the provider the app provides, like OpenStreetMap', async () => {
        TestBed.configureTestingModule({ providers: [provideMapConfig({ provider: OPEN_STREET_MAP_PROVIDER, zoom: 16 })] });
        const [fixture, root] = await render();
        fixture.componentInstance.consented.set(true);
        await fixture.whenStable();

        expect(root.querySelector('iframe')?.getAttribute('src')).toBe(
            'https://www.openstreetmap.org/export/embed.html?bbox=6.95755,50.93613,6.96305,50.93887&layer=mapnik&marker=50.9375,6.9603'
        );
        expect(root.querySelector('a[ui-button]')?.getAttribute('href')).toBe('https://www.openstreetmap.org/directions?route=%3B50.9375%2C6.9603');
    });
});

describe('map providers', () => {
    test('find a location without an address by its coordinates, and without coordinates by its address', () => {
        expect(GOOGLE_MAPS_PROVIDER.resolveEmbedUrl({ coordinates: { latitude: 50.9, longitude: 6.9 } }, 12)).toBe(
            'https://www.google.com/maps?q=50.9%2C6.9&z=12&output=embed'
        );
        expect(OPEN_STREET_MAP_PROVIDER.resolveRouteUrl({ address: 'Main Street 1, Cologne' })).toBe(
            'https://www.openstreetmap.org/search?query=Main%20Street%201%2C%20Cologne'
        );
        // the embed of OpenStreetMap can only show coordinates
        expect(() => OPEN_STREET_MAP_PROVIDER.resolveEmbedUrl({ address: 'Main Street 1, Cologne' }, 15)).toThrow(/coordinates/);
    });
});