import { ButtonComponent } from '@service-soft/ui/button';
import { provideCardConfig } from '@service-soft/ui/card';
import { CheckListComponent, CheckListItemComponent } from '@service-soft/ui/check-list';
import { PriceComponent } from '@service-soft/ui/price';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { PricingCardActionsComponent } from './pricing-card-actions.component';
import { PricingCardComponent } from './pricing-card.component';

// what goes into a pricing card: its price, its features and its actions.
const CONTENT_IMPORTS: unknown[] = [
    ButtonComponent,
    CheckListComponent,
    CheckListItemComponent,
    PriceComponent,
    PricingCardActionsComponent
];

const meta: Meta<PricingCardComponent> = {
    title: 'UI/Pricing card',
    component: PricingCardComponent,
    decorators: [moduleMetadata({ imports: CONTENT_IMPORTS })],
    args: {
        name: 'Family',
        description: 'For two adults and their children under 18.',
        highlighted: false,
        badge: 'Recommended'
    },
    render: args => ({
        props: args,
        template: `
            <ui-pricing-card class="max-w-xs" [name]="name" [description]="description" [highlighted]="highlighted" [badge]="badge">
                <ui-price size="lg" period="month" [amount]="25" [format]="{ maximumFractionDigits: 0 }" />
                <ui-check-list>
                    <ui-check-list-item>Every course of every department</ui-check-list-item>
                    <ui-check-list-item>The gym, every day from 6 am</ui-check-list-item>
                    <ui-check-list-item [included]="false">A personal coach</ui-check-list-item>
                </ui-check-list>
                <ui-pricing-card-actions><a ui-button href="https://example.com/join">Become a member</a></ui-pricing-card-actions>
            </ui-pricing-card>
        `
    })
};
export default meta;

type Story = StoryObj<PricingCardComponent>;

export const Playground: Story = {};

const PLANS: string = `
    <div class="grid max-w-5xl gap-4 md:grid-cols-3">
        <ui-pricing-card name="Single" description="For one adult.">
            <ui-price size="lg" period="month" [amount]="15" [format]="{ maximumFractionDigits: 0 }" />
            <ui-check-list>
                <ui-check-list-item>Every course of one department</ui-check-list-item>
                <ui-check-list-item [included]="false">The gym</ui-check-list-item>
                <ui-check-list-item [included]="false">A personal coach</ui-check-list-item>
            </ui-check-list>
            <ui-pricing-card-actions><a ui-button variant="outlined" href="https://example.com/single">Choose Single</a></ui-pricing-card-actions>
        </ui-pricing-card>
        <ui-pricing-card name="Family" description="For two adults and their children under 18." highlighted>
            <ui-price size="lg" period="month" [amount]="25" [oldAmount]="30" [format]="{ maximumFractionDigits: 0 }" />
            <ui-check-list>
                <ui-check-list-item>Every course of every department</ui-check-list-item>
                <ui-check-list-item>The gym, every day from 6 am</ui-check-list-item>
                <ui-check-list-item [included]="false">A personal coach</ui-check-list-item>
            </ui-check-list>
            <ui-pricing-card-actions><a ui-button href="https://example.com/family">Choose Family</a></ui-pricing-card-actions>
        </ui-pricing-card>
        <ui-pricing-card name="Premium" description="Everything, with a coach who plans your training.">
            <ui-price size="lg" period="month" [amount]="45" [format]="{ maximumFractionDigits: 0 }" />
            <ui-check-list>
                <ui-check-list-item>Every course of every department</ui-check-list-item>
                <ui-check-list-item>The gym, every day from 6 am</ui-check-list-item>
                <ui-check-list-item>A personal coach</ui-check-list-item>
                <ui-check-list-item>The sauna</ui-check-list-item>
            </ui-check-list>
            <ui-pricing-card-actions><a ui-button variant="outlined" href="https://example.com/premium">Choose Premium</a></ui-pricing-card-actions>
        </ui-pricing-card>
    </div>
`;

// plans next to each other: every card is as high as the highest, with the actions at the same height. The recommended
// one is highlighted, elevated cards with a bar at the top.
export const Plans: Story = {
    render: () => ({ template: PLANS })
};

// outlined cards, highlighted with a border in the color.
export const PlansOutlined: Story = {
    decorators: [moduleMetadata({ providers: [provideCardConfig({ variant: 'outlined' })] })],
    render: () => ({ template: PLANS })
};

// filled cards, the highlighted one a colored surface, whose price, features and button take its on- colors.
export const PlansFilled: Story = {
    decorators: [moduleMetadata({ providers: [provideCardConfig({ variant: 'filled' })] })],
    render: () => ({ template: PLANS })
};