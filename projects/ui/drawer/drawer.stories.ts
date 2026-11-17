import { ButtonComponent } from '@service-soft/ui/button';
import { DetailsComponent, SummaryComponent } from '@service-soft/ui/details';
import { LinkComponent } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { DrawerColor } from './drawer-color.type';
import { DrawerSide } from './drawer-side.type';
import { DrawerComponent } from './drawer.component';

/**
 * The inputs of the drawer stories.
 */
type DrawerStoryArgs = {
    /**
     * Whether the drawer is open.
     */
    open: boolean,
    /**
     * The edge it slides in from.
     */
    side: DrawerSide,
    /**
     * Its background.
     */
    color: DrawerColor,
    /**
     * Whether it shows its label with a button that closes it.
     */
    header: boolean
};

// the links span the drawer, `block`, so a tap anywhere in their row hits them, not only on their text. A section that
// opens and a button show how the content follows the color of the drawer.
const meta: Meta<DrawerStoryArgs> = {
    title: 'UI/Drawer',
    component: DrawerComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent, LinkComponent, DetailsComponent, SummaryComponent] })],
    args: { open: false, side: 'start', color: 'surface', header: false },
    argTypes: {
        color: { control: 'inline-radio', options: ['surface', 'container', 'primary', 'secondary'] }
    },
    render: args => ({
        props: args,
        template: `
            <button ui-button type="button" (click)="open = true">Open the navigation</button>
            <ui-drawer label="Navigation" [side]="side" [color]="color" [header]="header" [(open)]="open">
                <nav aria-label="Main">
                    <ul class="grid gap-1">
                        <li><a ui-link appearance="nav" block href="#home" aria-current="page" (click)="open = false">Home</a></li>
                        <li><a ui-link appearance="nav" block href="#orders" (click)="open = false">Orders</a></li>
                        <li><a ui-link appearance="nav" block href="#settings" (click)="open = false">Settings</a></li>
                    </ul>
                </nav>
                <ui-details class="mt-4">
                    <ui-summary>Help</ui-summary>
                    <p>Write to support for questions about your orders.</p>
                </ui-details>
                <button ui-button type="button" class="mt-4" (click)="open = false">Log out</button>
            </ui-drawer>
        `
    })
};
export default meta;

type Story = StoryObj<DrawerStoryArgs>;

export const Default: Story = {};

export const Open: Story = {
    args: { open: true }
};

export const OpenAtTheEnd: Story = {
    args: { open: true, side: 'end' }
};

// with a heading and a button that closes it, which touch users find more easily than a tap next to it.
export const WithHeader: Story = {
    args: { open: true, header: true }
};

export const Container: Story = {
    args: { open: true, header: true, color: 'container' }
};

// a colored surface: links, the section and the button take the on- colors of primary.
export const Primary: Story = {
    args: { open: true, header: true, color: 'primary' }
};

export const Secondary: Story = {
    args: { open: true, header: true, color: 'secondary' }
};