import { LinkComponent } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { FaqItemComponent } from './faq-item.component';
import { FaqComponent } from './faq.component';

const QUESTIONS: string = `
    <ui-faq-item question="How much is a membership?">
        <p>From 15 € a month for one adult, 25 € for a family.</p>
        <p>Children and students pay half.</p>
    </ui-faq-item>
    <ui-faq-item question="Can I try it before I join?">
        <p>Train with any group for free for two weeks, just come by.</p>
    </ui-faq-item>
    <ui-faq-item question="How do I cancel my membership?">
        <p>With a letter or an email to the office, at the end of a quarter. See <a ui-link href="https://example.com/terms">the terms</a>.</p>
    </ui-faq-item>
`;

const meta: Meta<FaqComponent> = {
    title: 'UI/FAQ',
    component: FaqComponent,
    decorators: [moduleMetadata({ imports: [FaqItemComponent, LinkComponent] })],
    argTypes: {
        variant: { control: 'inline-radio', options: ['plain', 'outlined', 'filled'] }
    },
    args: {
        variant: 'plain',
        microdata: true,
        exclusive: false
    },
    render: args => ({
        props: args,
        template: `<ui-faq class="max-w-2xl" [variant]="variant" [microdata]="microdata" [exclusive]="exclusive">${QUESTIONS}</ui-faq>`
    })
};
export default meta;

type Story = StoryObj<FaqComponent>;

export const Playground: Story = {};

// the variants of a details section, the first question open.
export const Variants: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-2xl gap-10">
                @for (variant of ['plain', 'outlined', 'filled']; track variant) {
                    <ui-faq [variant]="variant">
                        <ui-faq-item [open]="true" [question]="'Open, ' + variant"><p>The answer shows.</p></ui-faq-item>
                        <ui-faq-item [question]="'Closed, ' + variant">
                            <p>The answer is hidden, search engines read it anyway.</p>
                        </ui-faq-item>
                    </ui-faq>
                }
            </div>
        `
    })
};

// only one answer at a time: opening a question closes the one that is open.
export const Exclusive: Story = {
    render: () => ({
        template: `<ui-faq class="max-w-2xl" exclusive>${QUESTIONS}</ui-faq>`
    })
};

// on a colored surface, like a section in primary, the questions take its on- colors.
export const OnColoredSurface: Story = {
    render: () => ({
        template: `<div class="surface-primary max-w-2xl p-6"><ui-faq>${QUESTIONS}</ui-faq></div>`
    })
};