import { InputStringComponent } from '@service-soft/ui/input-string';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { TabComponent } from './tab.component';
import { TabsComponent } from './tabs.component';

const meta: Meta<TabsComponent> = {
    title: 'UI/Tabs',
    component: TabsComponent,
    decorators: [moduleMetadata({ imports: [TabComponent, InputStringComponent] })],
    argTypes: {
        variant: { control: 'inline-radio', options: ['underlined', 'filled'] },
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary'] }
    },
    args: {
        variant: 'underlined',
        color: 'primary'
    },
    render: args => ({
        props: { ...args, selected: undefined },
        template: `
            <div class="grid max-w-xl gap-2">
                <ui-tabs [variant]="variant" [color]="color" [(selected)]="selected">
                    <ui-tab value="general" label="General">
                        <div class="grid gap-4">
                            <ui-input-string label="Name" value="Jane Doe" />
                            <ui-input-string label="Email" type="email" value="jane@example.com" />
                        </div>
                    </ui-tab>
                    <ui-tab value="address" label="Address">
                        <div class="grid gap-4">
                            <ui-input-string label="Street" />
                            <ui-input-string label="City" />
                        </div>
                    </ui-tab>
                    <ui-tab value="billing" label="Billing" disabled>
                        <p class="text-body text-on-surface">Billing settings</p>
                    </ui-tab>
                </ui-tabs>
                <p class="text-body-sm text-on-surface-variant">Selected: {{ selected ?? 'none' }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<TabsComponent>;

export const Default: Story = {};

// every variant in every color, each with a disabled tab.
export const Variants: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-xl gap-6">
                @for (variant of ['underlined', 'filled']; track variant) {
                    @for (color of ['neutral', 'primary', 'secondary']; track color) {
                        <ui-tabs [variant]="variant" [color]="color">
                            <ui-tab value="general" label="General">
                                <p class="text-body text-on-surface">{{ variant }} {{ color }}</p>
                            </ui-tab>
                            <ui-tab value="address" label="Address"><p class="text-body text-on-surface">The address.</p></ui-tab>
                            <ui-tab value="billing" label="Billing" disabled><p class="text-body text-on-surface">Billing.</p></ui-tab>
                        </ui-tabs>
                    }
                }
            </div>
        `
    })
};

// more filled tabs than fit scroll sideways inside their strip.
export const ManyFilledTabs: Story = {
    render: () => ({
        template: `
            <div class="max-w-80">
                <ui-tabs variant="filled">
                    @for (month of ['January', 'February', 'March', 'April', 'May', 'June']; track month) {
                        <ui-tab [value]="month" [label]="month">
                            <p class="text-body text-on-surface">The reports of {{ month }}.</p>
                        </ui-tab>
                    }
                </ui-tabs>
            </div>
        `
    })
};

// more tabs than fit scroll sideways instead of wrapping into a second row.
export const ManyTabs: Story = {
    render: () => ({
        template: `
            <div class="max-w-80">
                <ui-tabs>
                    @for (month of ['January', 'February', 'March', 'April', 'May', 'June']; track month) {
                        <ui-tab [value]="month" [label]="month">
                            <p class="text-body text-on-surface">The reports of {{ month }}.</p>
                        </ui-tab>
                    }
                </ui-tabs>
            </div>
        `
    })
};