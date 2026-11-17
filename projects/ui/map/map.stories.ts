import { DataListComponent } from '@service-soft/ui/data-list';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { MapLocation } from './map-location.model';
import { MapComponent } from './map.component';
import { OPEN_STREET_MAP_PROVIDER } from './open-street-map-provider';

const PRACTICE: MapLocation = { address: 'Main Street 1, 50999 Cologne', coordinates: { latitude: 50.9375, longitude: 6.9603 } };

const meta: Meta<MapComponent> = {
    title: 'UI/Map',
    component: MapComponent,
    decorators: [moduleMetadata({ imports: [DataListComponent] })],
    render: args => ({
        props: { ...args, location: PRACTICE },
        template: '<ui-map class="max-w-2xl" label="Map of the practice" [location]="location" [zoom]="zoom" [alwaysAllow]="alwaysAllow" />'
    }),
    argTypes: {
        zoom: { control: { type: 'range', min: 1, max: 20, step: 1 } },
        alwaysAllow: { control: 'boolean' }
    },
    args: {
        zoom: 15,
        alwaysAllow: false
    }
};
export default meta;

type Story = StoryObj<MapComponent>;

// Google Maps loads only after "Load Google Maps". The route link works before, it sends nothing on its own.
export const Playground: Story = {};

export const OpenStreetMap: Story = {
    render: () => ({
        props: { location: PRACTICE, provider: OPEN_STREET_MAP_PROVIDER },
        template: '<ui-map class="max-w-2xl" label="Map of the practice" alwaysAllow [location]="location" [provider]="provider" />'
    })
};

// how to get there is a data list of the app next to the map.
export const WithDirections: Story = {
    render: () => ({
        props: { location: PRACTICE },
        template: `
            <div class="grid max-w-4xl gap-6 md:grid-cols-2">
                <ui-map label="Map of the practice" [location]="location" />
                <ui-data-list
                    [items]="[
                        { label: 'By train', value: 'Cologne main station, then tram 7 to Main Street, 3 minutes on foot' },
                        { label: 'By car', value: 'A4, exit Cologne-South, then follow the signs to the city centre' },
                        { label: 'Parking', value: 'Free parking spaces in the courtyard, one of them for wheelchair users' }
                    ]"
                />
            </div>
        `
    })
};

// without a ratio, the map fills the height the app gives it.
export const FillingItsHeight: Story = {
    render: () => ({
        props: { location: PRACTICE, aspectRatio: undefined },
        template: '<ui-map class="h-96 max-w-md" label="Map of the practice" [location]="location" [aspectRatio]="aspectRatio" />'
    })
};