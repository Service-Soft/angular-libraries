import { Meta, StoryObj } from '@storybook/angular';

import { SecondFactorFormComponent } from './second-factor-form.component';

const meta: Meta<SecondFactorFormComponent> = {
    title: 'Auth/Second factor form',
    component: SecondFactorFormComponent,
    args: { methods: ['otp', 'email', 'recovery-code'] }
};
export default meta;

type Story = StoryObj<SecondFactorFormComponent>;

export const Default: Story = {};

export const SendsCode: Story = {
    args: { methods: ['email', 'otp'] }
};

export const Passkey: Story = {
    args: { methods: ['passkey', 'otp'] }
};

export const NoUsableMethod: Story = {
    args: { methods: ['hardware-token'] }
};