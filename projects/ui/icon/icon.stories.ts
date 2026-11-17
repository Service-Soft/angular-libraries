import { faArrowRotateLeft, faCirclePlus, faClock, faUser } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { IconComponent } from './icon.component';

const meta: Meta<IconComponent> = {
    title: 'UI/Icon',
    component: IconComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent] })]
};
export default meta;

type Story = StoryObj<IconComponent>;

// icons grow with the text and take its color.
export const InText: Story = {
    render: () => ({
        props: { faClock, faUser },
        template: `
            <div class="grid gap-2">
                <p class="text-body"><ui-icon [icon]="faClock" /> 12.10.2026 14:30</p>
                <p class="text-title text-primary"><ui-icon [icon]="faUser" /> Jane Doe</p>
                <p class="text-body"><ui-icon label="Created at" [icon]="faClock" /> 12.10.2026</p>
            </div>
        `
    })
};

// the button sizes and spaces the icon like any svg inside it.
export const InAButton: Story = {
    render: () => ({
        props: { faCirclePlus, faArrowRotateLeft },
        template: `
            <div class="flex gap-2">
                <button ui-button type="button"><ui-icon [icon]="faCirclePlus" /> Add</button>
                <button ui-button type="button" variant="outlined" iconOnly aria-label="Reset">
                    <ui-icon [icon]="faArrowRotateLeft" />
                </button>
            </div>
        `
    })
};