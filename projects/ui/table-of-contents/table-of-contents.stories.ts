import { Meta, StoryObj } from '@storybook/angular';

import { TableOfContentsComponent } from './table-of-contents.component';

// a legal text whose headings have no ids, which the table of contents gives them. Long enough to scroll through it.
const PARAGRAPH: string = `
    <p class="mb-4 text-body">
        We process your personal data only as far as it is needed to provide a working website and our services. The
        legal basis is your consent, a contract with you or our legitimate interest in a secure website.
    </p>
`;

const LEGAL_TEXT: string = `
    <h2 class="mt-8 mb-3 font-heading text-title">Who is responsible</h2>${PARAGRAPH}${PARAGRAPH}
    <h2 class="mt-8 mb-3 font-heading text-title">Cookies &amp; tracking</h2>${PARAGRAPH}
    <h3 class="mt-6 mb-2 font-heading text-label-lg font-semibold">Necessary cookies</h3>${PARAGRAPH}${PARAGRAPH}
    <h3 class="mt-6 mb-2 font-heading text-label-lg font-semibold">Analytics</h3>${PARAGRAPH}${PARAGRAPH}
    <h2 class="mt-8 mb-3 font-heading text-title">Your rights</h2>${PARAGRAPH}${PARAGRAPH}${PARAGRAPH}
    <h2 class="mt-8 mb-3 font-heading text-title">Contact</h2>${PARAGRAPH}${PARAGRAPH}${PARAGRAPH}${PARAGRAPH}
`;

const meta: Meta<TableOfContentsComponent> = {
    title: 'UI/Table of contents',
    component: TableOfContentsComponent
};
export default meta;

type Story = StoryObj<TableOfContentsComponent>;

// the headings of the text, next to it on a wide screen, where it stays in view while the page scrolls.
export const Container: Story = {
    render: () => ({
        template: `
            <div class="grid gap-8 md:grid-cols-[14rem_1fr]">
                <aside class="md:sticky md:top-4 md:self-start">
                    <ui-table-of-contents [container]="text" />
                </aside>
                <article #text class="max-w-prose text-on-surface">
                    <h1 class="mb-4 font-heading text-headline">Privacy policy</h1>
                    ${LEGAL_TEXT}
                </article>
            </div>
        `
    })
};

// given as data, with a label of its own and a link that wraps. The sections aren't on the page, so none is current.
export const Items: Story = {
    render: () => ({
        props: {
            items: [
                { name: 'Who is responsible', fragment: 'responsible' },
                {
                    name: 'Cookies & tracking',
                    fragment: 'cookies',
                    children: [
                        { name: 'Necessary cookies', fragment: 'necessary' },
                        { name: 'Analytics', fragment: 'analytics' }
                    ]
                },
                { name: 'Your rights', fragment: 'rights' },
                { name: 'A section whose name is too long for one line of the table of contents', fragment: 'long' }
            ]
        },
        template: `
            <div class="max-w-56">
                <ui-table-of-contents label="Contents" [items]="items" [spy]="false" />
            </div>
        `
    })
};