import { Meta, StoryObj } from '@storybook/angular';

import { PaginationComponent } from './pagination.component';

const meta: Meta<PaginationComponent> = {
    title: 'UI/Pagination',
    component: PaginationComponent,
    argTypes: {
        color: { control: 'inline-radio', options: ['primary', 'secondary'] }
    },
    args: { totalAmount: 95, pageSize: 10, page: 1, color: 'primary' }
};
export default meta;

type Story = StoryObj<PaginationComponent>;

export const FirstPage: Story = {};

// the current page in the middle of the five.
export const MiddlePage: Story = {
    args: { page: 5 }
};

export const LastPage: Story = {
    args: { page: 10 }
};

// few enough pages to show them all.
export const FewPages: Story = {
    args: { totalAmount: 30 }
};