import { faWrench } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { ResultActionsComponent } from './result-actions.component';
import { ResultTone } from './result-tone.type';
import { ResultComponent } from './result.component';

const TONES: ResultTone[] = ['neutral', 'info', 'success', 'warning', 'error'];

const meta: Meta<ResultComponent> = {
    title: 'UI/Result',
    component: ResultComponent,
    decorators: [moduleMetadata({ imports: [ResultActionsComponent, ButtonComponent] })],
    argTypes: {
        tone: { control: 'inline-radio', options: TONES }
    },
    args: {
        tone: 'success',
        heading: 'Thank you for your booking'
    },
    render: args => ({
        props: args,
        template: `
            <ui-result [tone]="tone" [heading]="heading">
                <p>We sent the confirmation to your email address. Your car is ready for pick-up on May 12.</p>
                <ui-result-actions>
                    <a ui-button href="#bookings">Show my booking</a>
                    <a ui-button variant="outlined" href="#start">Back to the start page</a>
                </ui-result-actions>
            </ui-result>
        `
    })
};
export default meta;

type Story = StoryObj<ResultComponent>;

export const Playground: Story = {};

// every tone with its icon, as sections of a page, so their headings are h2.
export const Tones: Story = {
    render: () => ({
        props: { tones: TONES },
        template: `
            <div class="grid gap-4 md:grid-cols-2">
                @for (tone of tones; track tone) {
                    <ui-result [tone]="tone" [heading]="tone" [headingLevel]="2">
                        <p>What happened, and what to do now.</p>
                    </ui-result>
                }
            </div>
        `
    })
};

// a payment that failed, with a way to try again.
export const PaymentFailed: Story = {
    render: () => ({
        template: `
            <ui-result tone="error" heading="The payment didn't go through">
                <p>Your bank declined the payment. Nothing was charged.</p>
                <ui-result-actions>
                    <button ui-button type="button">Try again</button>
                    <a ui-button variant="text" href="#contact">Contact us</a>
                </ui-result-actions>
            </ui-result>
        `
    })
};

// neutral with an icon of its own.
export const Maintenance: Story = {
    render: () => ({
        props: { wrench: faWrench },
        template: `
            <ui-result heading="We'll be right back" [icon]="wrench">
                <p>We are updating the site and will be back at 6 pm.</p>
            </ui-result>
        `
    })
};