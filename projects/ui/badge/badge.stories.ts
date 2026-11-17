import { NgTemplateOutlet } from '@angular/common';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { BadgeColor } from './badge-color.type';
import { BadgeVariant } from './badge-variant.type';
import { BadgeComponent } from './badge.component';

const COLORS: BadgeColor[] = ['neutral', 'primary', 'secondary', 'error', 'success'];
const VARIANTS: BadgeVariant[] = ['filled', 'tinted'];

// any svg works, as long as it draws with currentColor.
const ICON: string = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">'
    + '<path d="M12 3l2.6 5.9 6.4.6-4.8 4.3 1.4 6.3L12 16.9 6.4 20.1l1.4-6.3L3 9.5l6.4-.6z" /></svg>';

const RADIO: 'inline-radio' = 'inline-radio';

const meta: Meta<BadgeComponent> = {
    title: 'UI/Badge',
    component: BadgeComponent,
    argTypes: {
        color: { control: RADIO, options: COLORS },
        variant: { control: RADIO, options: VARIANTS },
        size: { control: RADIO, options: ['sm', 'md'] }
    },
    args: {
        color: 'primary',
        variant: 'tinted',
        size: 'sm'
    },
    render: args => ({
        props: args,
        template: '<ui-badge [color]="color" [variant]="variant" [size]="size">Club news</ui-badge>'
    })
};
export default meta;

type Story = StoryObj<BadgeComponent>;

export const Playground: Story = {};

// every color in both variants and sizes.
export const Variants: Story = {
    render: () => ({
        props: { colors: COLORS, variants: VARIANTS },
        template: `
            <div class="grid gap-3">
                @for (variant of variants; track variant) {
                    @for (size of ['sm', 'md']; track size) {
                        <div class="flex flex-wrap items-center gap-2">
                            @for (color of colors; track color) {
                                <ui-badge [color]="color" [variant]="variant" [size]="size">{{ variant }} {{ color }}</ui-badge>
                            }
                        </div>
                    }
                }
            </div>
        `
    })
};

// on a colored surface, whose content takes the on- colors of it; status colors keep theirs.
export const OnColor: Story = {
    decorators: [moduleMetadata({ imports: [NgTemplateOutlet] })],
    render: () => ({
        props: { colors: COLORS, variants: VARIANTS },
        template: `
            <ng-template #badges>
                @for (variant of variants; track variant) {
                    @for (color of colors; track color) {
                        <ui-badge [color]="color" [variant]="variant">{{ variant }} {{ color }}</ui-badge>
                    }
                }
            </ng-template>
            <div class="grid gap-4">
                <div class="surface-primary rounded-card p-4">
                    <div class="flex flex-wrap gap-2"><ng-container [ngTemplateOutlet]="badges" /></div>
                </div>
                <div class="surface-secondary rounded-card p-4">
                    <div class="flex flex-wrap gap-2"><ng-container [ngTemplateOutlet]="badges" /></div>
                </div>
            </div>
        `
    })
};

// a list of tags is a list of badges; with an icon, and a long one that wraps.
export const TagsAndIcons: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-56 gap-4">
                <ul class="flex flex-wrap gap-2" aria-label="Tags">
                    <li class="flex"><ui-badge color="neutral" size="md">Angular</ui-badge></li>
                    <li class="flex"><ui-badge color="neutral" size="md">Tailwind</ui-badge></li>
                    <li class="flex"><ui-badge color="neutral" size="md">SEO</ui-badge></li>
                </ul>
                <ui-badge class="self-start" color="primary" variant="filled">${ICON} Recommended</ui-badge>
                <ui-badge class="self-start">A label that is too long for a single line wraps</ui-badge>
            </div>
        `
    })
};