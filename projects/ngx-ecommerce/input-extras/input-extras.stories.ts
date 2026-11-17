import { JsonPipe } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import { faBicycle, faCar, faMugHot, faPaw, faSoap } from '@fortawesome/free-solid-svg-icons';
import { applicationConfig, Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { ExtraOption } from './extra-option.model';
import { InputExtrasComponent } from './input-extras.component';
import { SelectedExtra } from './selected-extra.model';

const RADIO: 'inline-radio' = 'inline-radio';

// the extras of a holiday flat: some are on or off, others have a quantity.
const EXTRAS: ExtraOption[] = [
    { id: 'breakfast', label: 'Breakfast', description: 'Buffet, 7 to 10', icon: faMugHot, price: 1500, unit: 'perDay', type: 'toggle' },
    { id: 'parking', label: 'Parking space', description: 'In the garage', icon: faCar, price: 800, unit: 'perDay', type: 'toggle' },
    { id: 'cleaning', label: 'Final cleaning', icon: faSoap, price: 4500, unit: 'once', type: 'toggle' },
    { id: 'bike', label: 'Bike', description: 'With a helmet', icon: faBicycle, price: 1200, unit: 'perDay', type: 'quantity', max: 4 },
    { id: 'pet', label: 'Pet', icon: faPaw, price: 1000, unit: 'perItem', type: 'quantity', max: 2 }
];

const IMAGE_EXTRAS: ExtraOption[] = [
    {
        id: 'kayak',
        label: 'Kayak',
        description: 'For two, with paddles',
        image: { url: '/photo-4.svg', width: 1200, height: 800 },
        price: 3500,
        unit: 'perDay',
        type: 'quantity',
        max: 3
    },
    { id: 'picnic', label: 'Picnic', image: { url: '/photo-5.svg', width: 1200, height: 800 }, price: 2400, unit: 'once', type: 'toggle' }
];

const CHOSEN: SelectedExtra[] = [{ id: 'breakfast', quantity: 1 }, { id: 'bike', quantity: 2 }];

const meta: Meta<InputExtrasComponent> = {
    title: 'Ecommerce/Input extras',
    component: InputExtrasComponent,
    decorators: [moduleMetadata({ imports: [JsonPipe] })],
    argTypes: {
        appearance: { control: RADIO, options: ['checkbox', 'switch'] },
        color: { control: RADIO, options: ['neutral', 'primary', 'secondary', 'success'] },
        size: { control: RADIO, options: ['sm', 'md', 'lg'] },
        showTotal: { control: 'boolean' },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        appearance: 'checkbox',
        color: 'primary',
        size: 'md',
        showTotal: true,
        required: false,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, extras: EXTRAS, value: CHOSEN },
        template: `
            <div class="grid max-w-2xl gap-2">
                <ngx-input-extras
                    label="Extras"
                    hint="For your stay of 3 nights"
                    [days]="3"
                    [options]="extras"
                    [appearance]="appearance"
                    [color]="color"
                    [size]="size"
                    [showTotal]="showTotal"
                    [required]="required"
                    [disabled]="disabled"
                    [readonly]="readonly"
                    [(value)]="value"
                />
                <p class="text-body-sm text-on-surface-variant">Value: {{ value | json }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputExtrasComponent>;

export const Playground: Story = {};

// a switch for each extra that is on or off, like a setting.
export const Switches: Story = {
    render: () => ({
        props: { extras: EXTRAS, value: CHOSEN },
        template: `
            <div class="max-w-2xl">
                <ngx-input-extras label="Extras" appearance="switch" [options]="extras" [(value)]="value" />
            </div>
        `
    })
};

// a picture in front of the title instead of an icon.
export const Images: Story = {
    render: () => ({
        props: { extras: IMAGE_EXTRAS },
        template: '<div class="max-w-2xl"><ngx-input-extras label="Extras" showTotal [options]="extras" /></div>'
    })
};

// a sold out extra, a whole input that is disabled or read only, and the errors of a quantity above its max and of a
// required input without a choice.
export const States: Story = {
    render: () => ({
        props: {
            extras: EXTRAS.map(extra => extra.id === 'parking' ? { ...extra, disabled: true, description: 'Sold out' } : extra),
            tooMany: [{ id: 'bike', quantity: 6 }],
            value: CHOSEN
        },
        template: `
            <div class="grid max-w-2xl gap-8">
                <ngx-input-extras label="One sold out" [options]="extras" [(value)]="value" />
                <ngx-input-extras label="Disabled" disabled [options]="extras" [value]="value" />
                <ngx-input-extras label="Read only" readonly [options]="extras" [value]="value" />
                <ngx-input-extras label="Too many bikes" [showValidationError]="true" [options]="extras" [value]="tooMany" />
                <ngx-input-extras label="Required" required [showValidationError]="true" [options]="extras" />
            </div>
        `
    })
};

// each color marks the chosen cards and their checkboxes.
export const Colors: Story = {
    render: () => ({
        props: { extras: EXTRAS.slice(0, 4), value: CHOSEN },
        template: `
            <div class="grid max-w-2xl gap-8">
                @for (color of ['neutral', 'primary', 'secondary', 'success']; track color) {
                    <ngx-input-extras [label]="color" [color]="color" [options]="extras" [value]="value" />
                }
            </div>
        `
    })
};

// prices in the format of the language of the app, the price and the buttons below the title on a small phone.
export const GermanNarrow: Story = {
    decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'de' }] })],
    render: () => ({
        props: { extras: EXTRAS, value: CHOSEN },
        template: `
            <div class="max-w-80">
                <ngx-input-extras label="Extras" showTotal [days]="3" [options]="extras" [(value)]="value" />
            </div>
        `
    })
};