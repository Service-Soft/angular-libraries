import { Meta, StoryObj } from '@storybook/angular';

import { RichTextComponent } from './rich-text.component';

// what a cms gives for a post, with every element the prose styles. The image is a file of the storybook.
const ARTICLE: string = `
    <p>Our club house is open again after the renovation. Here is everything you need to know for your first visit.</p>
    <h2>Opening hours</h2>
    <p>
        We are open <strong>every day</strong> from 8 am, and on <em>Sundays</em> from 10 am. <a href="#contact">Call us</a>
        for bookings.
    </p>
    <ul>
        <li>Monday to Friday: 8 am to 10 pm</li>
        <li>Saturday: 8 am to 8 pm
            <ul><li>Swimming pool until 6 pm</li></ul>
        </li>
        <li>Sunday: 10 am to 6 pm</li>
    </ul>
    <h3>Membership fees</h3>
    <table>
        <thead><tr><th>Membership</th><th>Per month</th></tr></thead>
        <tbody>
            <tr><td>Adults</td><td>€15.00</td></tr>
            <tr><td>Children and students</td><td>€8.00</td></tr>
        </tbody>
    </table>
    <blockquote><p>The best club house we ever had.</p></blockquote>
    <ol>
        <li>Fill in the form</li>
        <li>Bring it to the office</li>
    </ol>
    <figure>
        <img src="/photo-4.svg" alt="The new club house with its red roof" width="1200" height="800" />
        <figcaption>The club house after the renovation.</figcaption>
    </figure>
    <h4>For developers</h4>
    <p>The calendar has an api, call <code>GET /api/events</code> with your key:</p>
    <pre><code>curl https://example.com/api/events?from=2026-11-01 -H "Authorization: Bearer your-key-that-is-long-enough-to-wrap-on-a-phone"</code></pre>
    <hr />
    <p>Questions? Write to <a href="#mail">board@example.com</a>.</p>
`;

const meta: Meta<RichTextComponent> = {
    title: 'UI/Rich text',
    component: RichTextComponent,
    args: {
        html: ARTICLE
    },
    render: args => ({
        props: args,
        template: '<ui-rich-text class="max-w-prose" [html]="html" />'
    })
};
export default meta;

type Story = StoryObj<RichTextComponent>;

export const Playground: Story = {};

// on a colored surface, whose content takes the on- colors of it.
export const OnColor: Story = {
    render: () => ({
        props: { html: ARTICLE },
        template: `
            <div class="surface-primary max-w-prose rounded-card p-6">
                <ui-rich-text [html]="html" />
            </div>
        `
    })
};

// the sanitizer of Angular removes what could run code, and what it doesn't know, like the style and the iframe.
export const Sanitized: Story = {
    render: () => ({
        props: {
            html: `
                <p style="color: red" onclick="alert('clicked')">A paragraph whose style and handler are removed.</p>
                <script>alert('never runs')</script>
                <iframe src="https://example.com"></iframe>
                <p>The script and the iframe above are gone.</p>
            `
        },
        template: '<ui-rich-text class="max-w-prose" [html]="html" />'
    })
};