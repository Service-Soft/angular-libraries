import { faBox, faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { IconComponent } from '@service-soft/ui/icon';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { LinkComponent } from './link.component';

const meta: Meta<LinkComponent> = {
    title: 'UI/Link',
    component: LinkComponent,
    decorators: [moduleMetadata({ imports: [IconComponent] })]
};
export default meta;

type Story = StoryObj<LinkComponent>;

export const Inline: Story = {
    render: () => ({
        template: `
            <p class="max-w-md text-body text-on-surface">
                By ordering you accept the <a ui-link href="#terms">terms of service</a> and the
                <a ui-link href="#privacy">privacy policy</a>.
            </p>
        `
    })
};

// a link to another site and one that opens in a new tab show an icon after their text. The new tab is also read out
// by screen readers.
export const External: Story = {
    render: () => ({
        template: `
            <p class="max-w-md text-body text-on-surface">
                Read the <a ui-link href="https://example.com/docs">documentation</a> or open the
                <a ui-link href="#help" target="_blank">help</a> next to this page.
            </p>
            <nav aria-label="External" class="mt-4">
                <a ui-link appearance="nav" href="https://example.com/status">Status page</a>
            </nav>
        `
    })
};

// the current page is underlined, so it stands out by more than its color.
export const Navigation: Story = {
    render: () => ({
        props: { box: faBox },
        template: `
            <nav aria-label="Main">
                <ul class="flex flex-wrap gap-2">
                    <li><a ui-link appearance="nav" href="#home">Home</a></li>
                    <li><a ui-link appearance="nav" href="#products"><ui-icon [icon]="box" /> Products</a></li>
                    <li><a ui-link appearance="nav" href="#orders" aria-current="page">Orders</a></li>
                </ul>
            </nav>
        `
    })
};

// a row of pills, like the sub pages of a section: the current page is filled.
export const Pills: Story = {
    render: () => ({
        template: `
            <nav aria-label="Football">
                <ul class="flex flex-wrap gap-2">
                    <li><a ui-link appearance="pill" href="#start" aria-current="page">Start</a></li>
                    <li><a ui-link appearance="pill" href="#training">Training</a></li>
                    <li><a ui-link appearance="pill" href="#teams">Teams</a></li>
                </ul>
            </nav>
        `
    })
};

// below each other over the full width, like in a drawer, with a button that looks like the links.
export const NavigationBlock: Story = {
    render: () => ({
        props: { logOut: faRightFromBracket },
        template: `
            <ul class="grid w-64 gap-1">
                <li><a ui-link appearance="nav" block href="#home" aria-current="page">Home</a></li>
                <li><a ui-link appearance="nav" block href="#orders">Orders</a></li>
                <li><button ui-link appearance="nav" block type="button"><ui-icon [icon]="logOut" /> Log out</button></li>
            </ul>
        `
    })
};

// keeps the look of what it links, like the name of the app.
export const Plain: Story = {
    render: () => ({
        template: '<span class="font-heading text-title text-on-surface"><a ui-link appearance="plain" href="#home">Shop</a></span>'
    })
};

// the look of the text around it, underlined on hover, like the headlines of a list of news.
export const Subtle: Story = {
    render: () => ({
        template: `
            <ul class="flex flex-col gap-1 text-body text-on-surface">
                <li><a ui-link appearance="subtle" href="#summer-party">Summer party on July 12</a></li>
                <li><a ui-link appearance="subtle" href="#courses">New courses from May on</a></li>
            </ul>
        `
    })
};