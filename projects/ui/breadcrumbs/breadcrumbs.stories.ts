import { LinkComponent } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { BreadcrumbComponent } from './breadcrumb.component';
import { BreadcrumbsComponent } from './breadcrumbs.component';

const meta: Meta<BreadcrumbsComponent> = {
    title: 'UI/Breadcrumbs',
    component: BreadcrumbsComponent,
    decorators: [moduleMetadata({ imports: [BreadcrumbComponent, LinkComponent] })]
};
export default meta;

type Story = StoryObj<BreadcrumbsComponent>;

export const Default: Story = {
    render: () => ({
        template: `
            <ui-breadcrumbs>
                <ui-breadcrumb><a ui-link href="#home">Home</a></ui-breadcrumb>
                <ui-breadcrumb><a ui-link href="#orders">Orders</a></ui-breadcrumb>
                <ui-breadcrumb><a ui-link href="#order-1001" aria-current="page">Order 1001</a></ui-breadcrumb>
            </ui-breadcrumbs>
        `
    })
};

// the current page links nowhere, so it is text.
export const CurrentPageAsText: Story = {
    render: () => ({
        template: `
            <ui-breadcrumbs label="You are here">
                <ui-breadcrumb><a ui-link href="#home">Home</a></ui-breadcrumb>
                <ui-breadcrumb><a ui-link href="#settings">Settings</a></ui-breadcrumb>
                <ui-breadcrumb><span aria-current="page">Second factors</span></ui-breadcrumb>
            </ui-breadcrumbs>
        `
    })
};