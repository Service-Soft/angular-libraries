import { signal, WritableSignal } from '@angular/core';
import { faShieldHalved, faTooth } from '@fortawesome/free-solid-svg-icons';
import { FilterTilesComponent } from '@service-soft/ui/filter-tiles';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { CategoryOverviewGroup } from './category-overview-group.model';
import { CategoryOverviewComponent } from './category-overview.component';

const TREATMENTS: (CategoryOverviewGroup & { value: string })[] = [
    {
        value: 'prophylaxis',
        name: 'Prophylaxis',
        id: 'prophylaxis',
        items: [
            { title: 'Professional teeth cleaning', text: 'Removes plaque and tartar, also where a toothbrush can\'t reach.' },
            { title: 'Fissure sealing', text: 'Protects the grooves of the molars of children against caries.' },
            { title: 'Check-ups', text: 'Twice a year, so problems are found while they are still small.' }
        ]
    },
    {
        value: 'implants',
        name: 'Implants',
        id: 'implants',
        items: [
            { title: 'Single tooth implant', text: 'Replaces one tooth without touching the ones next to it.' },
            { title: 'Implant-supported bridge', text: 'Several teeth in a row on two or more implants.' }
        ]
    }
];

const meta: Meta<CategoryOverviewComponent> = {
    title: 'UI/Category overview',
    component: CategoryOverviewComponent,
    decorators: [moduleMetadata({ imports: [FilterTilesComponent] })],
    args: {
        groups: TREATMENTS
    },
    render: args => ({
        props: args,
        template: '<ui-category-overview [groups]="groups" />'
    })
};
export default meta;

type Story = StoryObj<CategoryOverviewComponent>;

export const Playground: Story = {};

// the treatments page of a dental practice: the tiles filter the categories below them.
export const WithFilterTiles: Story = {
    render: () => {
        const chosen: WritableSignal<string[]> = signal([]);
        return {
            props: {
                chosen,
                options: [
                    { value: 'prophylaxis', label: 'Prophylaxis', icon: faShieldHalved, count: 3 },
                    { value: 'implants', label: 'Implants', icon: faTooth, count: 2 }
                ],
                filterGroups: (values: string[]) => TREATMENTS.filter(group => values.length === 0 || values.includes(group.value))
            },
            template: `
                <div class="grid gap-8">
                    <ui-filter-tiles label="Categories of treatments" [options]="options" [allCount]="5" [(value)]="chosen" />
                    <ui-category-overview [groups]="filterGroups(chosen())" />
                </div>
            `
        };
    }
};

// in a narrow column, the cards stand below each other.
export const Narrow: Story = {
    render: () => ({
        props: { groups: TREATMENTS },
        template: '<div class="max-w-sm"><ui-category-overview [groups]="groups" [headingLevel]="3" /></div>'
    })
};