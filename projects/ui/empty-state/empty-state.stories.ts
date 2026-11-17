import { ButtonComponent } from '@service-soft/ui/button';
import { CardComponent } from '@service-soft/ui/card';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { EmptyStateActionsComponent } from './empty-state-actions.component';
import { EmptyStateComponent } from './empty-state.component';

const RADIO: 'inline-radio' = 'inline-radio';

const meta: Meta<EmptyStateComponent> = {
    title: 'UI/Empty state',
    component: EmptyStateComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent, CardComponent, EmptyStateActionsComponent] })],
    render: args => ({
        props: args,
        template: `
            <ui-empty-state
                [title]="title"
                [text]="text"
                [variant]="variant"
                [size]="size"
                [headingLevel]="headingLevel"
            >
                <ui-empty-state-actions><button ui-button type="button">New order</button></ui-empty-state-actions>
            </ui-empty-state>
        `
    }),
    argTypes: {
        variant: { control: RADIO, options: ['empty', 'no-results', 'error'] },
        size: { control: RADIO, options: ['md', 'compact'] },
        headingLevel: { control: RADIO, options: [undefined, 2, 3] }
    },
    args: {
        title: 'No orders yet',
        text: 'Orders show here once a customer ordered. Create the first one yourself, like for an order by phone.',
        variant: 'empty',
        size: 'md',
        headingLevel: 2
    }
};
export default meta;

type Story = StoryObj<EmptyStateComponent>;

export const Playground: Story = {};

// nothing yet, nothing that matches, and what couldn't be loaded, each with its icon. The error is in the error color.
export const Variants: Story = {
    render: () => ({
        template: `
            <div class="grid gap-4 md:grid-cols-3">
                <ui-card>
                    <ui-empty-state title="No orders yet" text="Orders show here once a customer ordered." [headingLevel]="2" />
                </ui-card>
                <ui-card>
                    <ui-empty-state variant="no-results" title="No results" text="Nothing matches 'blue chairs'." [headingLevel]="2">
                        <ui-empty-state-actions>
                            <button ui-button type="button" variant="outlined">Clear the search</button>
                        </ui-empty-state-actions>
                    </ui-empty-state>
                </ui-card>
                <ui-card>
                    <ui-empty-state variant="error" title="The orders couldn't be loaded" text="Check your connection." [headingLevel]="2">
                        <ui-empty-state-actions><button ui-button type="button">Try again</button></ui-empty-state-actions>
                    </ui-empty-state>
                </ui-card>
            </div>
        `
    })
};

// compact, like inside of a list, without a heading.
export const Compact: Story = {
    render: () => ({
        template: `
            <ui-card class="max-w-sm" variant="outlined">
                <h2 class="mb-2 font-heading text-title">Notifications</h2>
                <ui-empty-state size="compact" title="You're all caught up" />
            </ui-card>
        `
    })
};

// on a colored surface, whose text it takes.
export const OnColor: Story = {
    render: () => ({
        template: `
            <div class="surface-primary max-w-md rounded-card p-4">
                <div><ui-empty-state variant="no-results" title="No events this week" text="The next one is on Monday." /></div>
            </div>
        `
    })
};