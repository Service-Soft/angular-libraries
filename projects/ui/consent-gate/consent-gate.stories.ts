import { IframeComponent } from '@service-soft/ui/iframe';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { ConsentGateComponent } from './consent-gate.component';

const CONTENT: string = '<ng-template><ui-iframe src="embed-example.html" label="Video of the club" /></ng-template>';

const meta: Meta<ConsentGateComponent> = {
    title: 'UI/Consent gate',
    component: ConsentGateComponent,
    decorators: [moduleMetadata({ imports: [IframeComponent] })],
    render: args => ({
        props: args,
        template: `
            <ui-consent-gate
                class="max-w-2xl"
                provider="YouTube"
                privacyPolicyUrl="#privacy"
                providerPrivacyPolicyUrl="https://policies.google.com/privacy"
                aspectRatio="16 / 9"
                [alwaysAllow]="alwaysAllow"
                [(consented)]="consented"
            >
                ${CONTENT}
            </ui-consent-gate>
        `
    }),
    argTypes: {
        alwaysAllow: { control: 'boolean' },
        consented: { control: 'boolean' }
    },
    args: {
        alwaysAllow: true,
        consented: false
    }
};
export default meta;

type Story = StoryObj<ConsentGateComponent>;

// "Load YouTube" loads the embedded page in place of the placeholder.
export const Playground: Story = {};

// once allowed, the content shows in the space the placeholder kept for it.
export const Consented: Story = {
    args: { consented: true }
};

// without a ratio and links, the placeholder is as high as its text.
export const Minimal: Story = {
    render: () => ({
        template: `<ui-consent-gate class="max-w-md" provider="Instagram">${CONTENT}</ui-consent-gate>`
    })
};

// the text grows the box of a ratio instead of being cut off, like on a narrow screen.
export const Narrow: Story = {
    render: () => ({
        template: `
            <ui-consent-gate
                class="max-w-64"
                provider="YouTube"
                privacyPolicyUrl="#privacy"
                providerPrivacyPolicyUrl="https://policies.google.com/privacy"
                aspectRatio="16 / 9"
                alwaysAllow
            >
                ${CONTENT}
            </ui-consent-gate>
        `
    })
};

// on a colored surface, the placeholder takes its container color.
export const OnColor: Story = {
    render: () => ({
        template: `
            <div class="surface-secondary p-6">
                <div><ui-consent-gate class="max-w-2xl" provider="YouTube" privacyPolicyUrl="#privacy">${CONTENT}</ui-consent-gate></div>
            </div>
        `
    })
};