import { signal } from '@angular/core';
import { faBaby, faShieldHalved, faTeethOpen, faTooth } from '@fortawesome/free-solid-svg-icons';
import { Meta, StoryObj } from '@storybook/angular';

import { FilterTileOption } from './filter-tile-option.model';
import { FilterTilesComponent } from './filter-tiles.component';

const CATEGORIES: FilterTileOption<string>[] = [
    { value: 'prophylaxis', label: 'Prophylaxis', icon: faShieldHalved, count: 4 },
    { value: 'implants', label: 'Implants', icon: faTooth, count: 3 },
    { value: 'orthodontics', label: 'Orthodontics', icon: faTeethOpen, count: 2 },
    { value: 'kids', label: 'Kids', icon: faBaby, count: 5 }
];

const meta: Meta<FilterTilesComponent<string>> = {
    title: 'UI/Filter tiles',
    component: FilterTilesComponent,
    argTypes: {
        color: { control: 'inline-radio', options: ['primary', 'secondary'] },
        multiple: { control: 'boolean' }
    },
    args: {
        color: 'primary',
        multiple: false
    },
    render: args => ({
        props: { ...args, options: CATEGORIES, chosen: signal<string[]>([]) },
        template: `
            <div class="grid gap-4">
                <ui-filter-tiles
                    label="Categories"
                    [options]="options"
                    [allCount]="14"
                    [color]="color"
                    [multiple]="multiple"
                    [(value)]="chosen"
                />
                <p class="text-body-sm text-on-surface-variant">Chosen: {{ chosen().join(', ') || 'everything' }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<FilterTilesComponent<string>>;

export const Playground: Story = {};

// one tile chosen, in both colors.
export const Chosen: Story = {
    render: () => ({
        props: { options: CATEGORIES },
        template: `
            <div class="grid gap-6">
                <ui-filter-tiles label="Categories" [options]="options" [allCount]="14" [value]="['implants']" />
                <ui-filter-tiles label="Categories" color="secondary" [options]="options" [allCount]="14" [value]="['implants']" />
            </div>
        `
    })
};

// several tiles chosen at once.
export const Multiple: Story = {
    render: () => ({
        props: { options: CATEGORIES },
        template: '<ui-filter-tiles label="Categories" multiple [options]="options" [value]="[\'prophylaxis\', \'kids\']" />'
    })
};

// without icons and counts, the tiles only have their labels; a long one wraps.
export const LabelsOnly: Story = {
    render: () => ({
        props: {
            options: [
                { value: 'news', label: 'News' },
                { value: 'events', label: 'Events' },
                { value: 'board', label: 'Messages of the board of the club' }
            ]
        },
        template: '<div class="max-w-md"><ui-filter-tiles label="Kinds of posts" [options]="options" /></div>'
    })
};