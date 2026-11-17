import { LinkComponent } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { FootnoteComponent } from './footnote.component';
import { FootnotesComponent } from './footnotes.component';

const meta: Meta<FootnotesComponent> = {
    title: 'UI/Footnotes',
    component: FootnotesComponent,
    decorators: [moduleMetadata({ imports: [FootnoteComponent, LinkComponent] })]
};
export default meta;

type Story = StoryObj<FootnotesComponent>;

// the sources of an article, below it with a heading of the page, each linking back to where it is cited.
export const Default: Story = {
    render: () => ({
        template: `
            <article class="flex max-w-prose flex-col gap-4 text-body text-on-surface">
                <p>
                    The club was founded in 1920<ui-footnote [list]="sources">Chronicle of the club, page 4.</ui-footnote>
                    by eleven swimmers, and has more than 2,000 members today<ui-footnote [list]="sources">Annual report
                    <a ui-link href="#report">2025</a>, page 12.</ui-footnote>.
                </p>
                <p>
                    Its pool opened in 1972<ui-footnote [list]="sources">City archive, file 1972/31.</ui-footnote>, and was
                    renovated twice since.
                </p>
                <h2 class="mt-4 font-heading text-title">Sources</h2>
                <ui-footnotes #sources idPrefix="sources" label="Sources" />
            </article>
        `
    })
};

// two lists on one page, each with its own numbers and its own name, like the sources of two articles.
export const SeveralLists: Story = {
    render: () => ({
        template: `
            <div class="grid max-w-4xl gap-8 md:grid-cols-2">
                <article class="flex flex-col gap-4 text-body text-on-surface">
                    <h2 class="font-heading text-title">Swimming</h2>
                    <p>Training starts at 6 am<ui-footnote [list]="swimming">Except during the holidays.</ui-footnote>.</p>
                    <ui-footnotes #swimming label="Footnotes on swimming" />
                </article>
                <article class="flex flex-col gap-4 text-body text-on-surface">
                    <h2 class="font-heading text-title">Running</h2>
                    <p>
                        The night run is 10 km long<ui-footnote [list]="running">Measured in 2025.</ui-footnote> and ends at
                        the club house<ui-footnote [list]="running">With soup for everyone.</ui-footnote>.
                    </p>
                    <ui-footnotes #running label="Footnotes on running" />
                </article>
            </div>
        `
    })
};