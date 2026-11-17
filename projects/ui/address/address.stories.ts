import { Meta, StoryObj } from '@storybook/angular';

import { AddressComponent } from './address.component';
import { PostalAddress } from './postal-address.model';

const ADDRESS: PostalAddress = { street: 'Main Street 1', postalCode: '50999', city: 'Cologne', country: 'Germany' };

const meta: Meta<AddressComponent> = {
    title: 'UI/Address',
    component: AddressComponent,
    render: args => ({
        props: { ...args, address: ADDRESS },
        template: `
            <ui-address
                name="Dental practice Example"
                phone="+49 2234 12 34-5"
                fax="+49 2234 12 34-6"
                email="info@example.com"
                [address]="address"
                [icons]="icons"
                [businessType]="businessType"
            />
        `
    }),
    argTypes: {
        icons: { control: 'boolean' },
        businessType: { control: 'text' }
    },
    args: {
        icons: true,
        businessType: 'Dentist'
    }
};
export default meta;

type Story = StoryObj<AddressComponent>;

export const Playground: Story = {};

// a label before each contact instead of its icon.
export const WithLabels: Story = {
    render: () => ({
        props: { address: ADDRESS },
        template: `
            <ui-address
                name="Dental practice Example"
                phone="+49 2234 12 34-5"
                fax="+49 2234 12 34-6"
                email="info@example.com"
                [address]="address"
                [icons]="false"
            />
        `
    })
};

// only what is set shows: no name, no fax, no country.
export const OnlyAddressAndPhone: Story = {
    render: () => ({
        props: { address: { street: 'Sports Park 3', postalCode: '50999', city: 'Cologne' } },
        template: '<ui-address phone="0221 98 76 54" [address]="address" />'
    })
};

// in a footer on a colored surface, whose links take the on- color of it.
export const OnColor: Story = {
    render: () => ({
        props: { address: ADDRESS },
        template: `
            <footer class="surface-primary p-6">
                <div>
                    <ui-address
                        name="SG Example e.V."
                        phone="+49 221 98 76 54"
                        email="club-office-with-a-long-name@example.com"
                        businessType="SportsClub"
                        [address]="address"
                    />
                </div>
            </footer>
        `
    })
};