import { faBolt, faLeaf, faStar } from '@fortawesome/free-solid-svg-icons';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { InputCardMetaDirective } from './input-card-meta.directive';
import { InputCardOption } from './input-card-option.model';
import { InputCardsMultipleComponent } from './input-cards-multiple.component';
import { InputCardsComponent } from './input-cards.component';

const RADIO: 'inline-radio' = 'inline-radio';

const CARS: InputCardOption<string>[] = [
    { label: 'VW Golf', value: 'golf', description: 'Compact, 5 seats, manual', image: { url: '/photo-1.svg', width: 1200, height: 800 } },
    { label: 'VW Polo', value: 'polo', description: 'Small, 5 seats, automatic', image: { url: '/photo-2.svg', width: 1200, height: 800 } },
    {
        label: 'VW Transporter',
        value: 'transporter',
        description: 'Van, 9 seats, booked out on these days',
        image: { url: '/photo-3.svg', width: 1200, height: 800 },
        disabled: true
    }
];

const PRICES: Record<string, string> = { golf: '€39', polo: '€29', transporter: '€89' };

const EXTRAS: InputCardOption<string>[] = [
    { label: 'Child seat', value: 'child-seat', description: 'For children from 9 to 18 kg' },
    { label: 'Snow chains', value: 'snow-chains', description: 'Required in the mountains in winter' },
    { label: 'Second driver', value: 'second-driver', description: 'Someone else may drive as well' }
];

const PLANS: InputCardOption<string>[] = [
    { label: 'Basic', value: 'basic', icon: faLeaf, description: 'Everything to get started' },
    { label: 'Pro', value: 'pro', icon: faBolt, description: 'For teams that grow' },
    { label: 'Enterprise', value: 'enterprise', icon: faStar, description: 'With a contact person of your own' }
];

const meta: Meta<InputCardsComponent<string>> = {
    title: 'UI/Input cards',
    component: InputCardsComponent,
    decorators: [moduleMetadata({ imports: [InputCardsMultipleComponent, InputCardMetaDirective] })],
    argTypes: {
        color: { control: RADIO, options: ['neutral', 'primary', 'secondary', 'success'] },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        color: 'primary',
        required: true,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, cars: CARS, prices: PRICES, value: 'golf' },
        template: `
            <div class="grid max-w-4xl gap-2">
                <ui-input-cards
                    label="Car"
                    hint="All cars include unlimited kilometers"
                    [options]="cars"
                    [color]="color"
                    [required]="required"
                    [disabled]="disabled"
                    [readonly]="readonly"
                    [(value)]="value"
                >
                    <ng-template let-car [uiInputCardMeta]="cars">
                        {{ prices[car.value] }} <span class="text-body-sm text-on-surface-variant">a day</span>
                    </ng-template>
                </ui-input-cards>
                <p class="text-body-sm text-on-surface-variant">Value: {{ value }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputCardsComponent<string>>;

export const Playground: Story = {};

// checkboxes instead of radio buttons, for any number of the options.
export const Multiple: Story = {
    render: () => ({
        props: { extras: EXTRAS, value: ['snow-chains'] },
        template: `
            <div class="grid max-w-4xl gap-2">
                <ui-input-cards-multiple label="Extras" [required]="false" [options]="extras" [(value)]="value">
                    <ng-template uiInputCardMeta>€5 a day</ng-template>
                </ui-input-cards-multiple>
                <p class="text-body-sm text-on-surface-variant">Value: {{ value.join(', ') }}</p>
            </div>
        `
    })
};

// an icon in front of the title instead of an image.
export const Icons: Story = {
    render: () => ({
        props: { plans: PLANS },
        template: '<ui-input-cards class="max-w-4xl" label="Plan" [options]="plans" value="pro" />'
    })
};

// a few short options as one row of segments, the chosen one filled with a check mark, in every size and color, and its
// states. Narrower than its row, it stacks.
export const Segmented: Story = {
    render: () => ({
        props: {
            sizes: [
                { label: 'S', value: 's' },
                { label: 'M', value: 'm' },
                { label: 'L', value: 'l' },
                { label: 'XL', value: 'xl', disabled: true }
            ],
            periods: [{ label: 'Monthly', value: 'month' }, { label: 'Yearly', value: 'year', icon: faStar }]
        },
        template: `
            <div class="grid max-w-xl gap-6">
                @for (size of ['sm', 'md', 'lg']; track size) {
                    <ui-input-cards appearance="segmented" [label]="'Size ' + size" [size]="size" [options]="sizes" value="m" />
                }
                @for (color of ['neutral', 'primary', 'secondary', 'success']; track color) {
                    <ui-input-cards appearance="segmented" [label]="color" [color]="color" [options]="periods" value="year" />
                }
                <ui-input-cards appearance="segmented" label="Required, nothing chosen" [options]="periods" [showValidationError]="true" />
                <ui-input-cards appearance="segmented" label="Read only" readonly [options]="periods" value="month" />
                <ui-input-cards appearance="segmented" label="Disabled" disabled [options]="periods" value="month" />
                <div class="max-w-60">
                    <ui-input-cards appearance="segmented" label="Narrow" [options]="sizes" value="s" />
                </div>
            </div>
        `
    })
};

// the error of a required choice, read only, disabled, and the same for checkboxes.
export const States: Story = {
    render: () => ({
        props: { plans: PLANS, extras: EXTRAS },
        template: `
            <div class="grid max-w-4xl gap-6">
                <ui-input-cards label="Required, nothing chosen" [options]="plans" [showValidationError]="true" />
                <ui-input-cards label="Read only" readonly [options]="plans" value="basic" />
                <ui-input-cards label="Disabled" disabled [options]="plans" value="basic" />
                <ui-input-cards-multiple label="At least one, nothing chosen" [options]="extras" [showValidationError]="true" />
                <ui-input-cards-multiple label="Read only" readonly [options]="extras" [value]="['child-seat']" />
            </div>
        `
    })
};

// a chosen card and a chosen checkbox in each color.
export const Colors: Story = {
    render: () => ({
        props: { plans: PLANS.slice(0, 2), extras: EXTRAS.slice(0, 2) },
        template: `
            <div class="grid max-w-4xl gap-6">
                @for (color of ['neutral', 'primary', 'secondary', 'success']; track color) {
                    <div class="grid gap-3 md:grid-cols-2">
                        <ui-input-cards [label]="color" [color]="color" [options]="plans" value="basic" />
                        <ui-input-cards-multiple [label]="color" [color]="color" [options]="extras" [value]="['child-seat']" />
                    </div>
                }
            </div>
        `
    })
};