import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { DetailsComponent } from './details.component';
import { SummaryComponent } from './summary.component';

const meta: Meta<DetailsComponent> = {
    title: 'UI/Details',
    component: DetailsComponent,
    decorators: [moduleMetadata({ imports: [SummaryComponent] })]
};
export default meta;

type Story = StoryObj<DetailsComponent>;

export const Default: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-xl gap-2">
                <ui-details>
                    <ui-summary>Shipping</ui-summary>
                    <p>Orders ship within two working days.</p>
                </ui-details>
                <ui-details [open]="true">
                    <ui-summary>Returns</ui-summary>
                    <p>You can return every order within 30 days.</p>
                </ui-details>
            </div>
        `
    })
};

// the same name makes them exclusive, like an accordion: opening one closes the other.
export const OnlyOneOpen: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-xl gap-2">
                <ui-details name="faq" [open]="true">
                    <ui-summary>How long does shipping take?</ui-summary>
                    <p>Two working days.</p>
                </ui-details>
                <ui-details name="faq">
                    <ui-summary>Can I return an order?</ui-summary>
                    <p>Within 30 days.</p>
                </ui-details>
            </div>
        `
    })
};

// a summary with several parts wraps them on narrow screens instead of overflowing.
export const RichSummary: Story = {
    render: () => ({
        template: `
            <ui-details class="max-w-xl" [open]="true">
                <ui-summary>
                    <span class="font-semibold">Update</span>
                    <span class="text-on-surface-variant">12.10.2026 14:30</span>
                    <span class="text-on-surface-variant">Jane Doe</span>
                </ui-summary>
                <p>The name changed from Jane to Jane Doe.</p>
            </ui-details>
        `
    })
};
// every look in every color: filled in a theme color, the summary takes it; outlined and plain, its line and chevron.
export const Variants: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-xl gap-6">
                @for (variant of ['outlined', 'filled', 'plain']; track variant) {
                    <div class="grid gap-2">
                        @for (color of ['neutral', 'primary', 'secondary']; track color) {
                            <ui-details [variant]="variant" [color]="color" [open]="color === 'primary'">
                                <ui-summary>{{ variant }}, {{ color }}</ui-summary>
                                <p>Orders ship within two working days.</p>
                            </ui-details>
                        }
                    </div>
                }
            </div>
        `
    })
};