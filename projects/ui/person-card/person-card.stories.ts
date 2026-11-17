import { ButtonComponent } from '@service-soft/ui/button';
import { LinkUtilities } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { PersonCardActionsComponent } from './person-card-actions.component';
import { PersonCardComponent } from './person-card.component';

// a photo in 4:5 without a request, like one the backend serves
const PORTRAIT: string = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50"><rect width="40" height="50" fill="#9cc6e8"/>'
    + '<circle cx="20" cy="19" r="9" fill="#3d5a7a"/><path d="M3 50c0-11 7-18 17-18s17 7 17 18z" fill="#3d5a7a"/></svg>'
)}`;

// the logo an app puts into its links, like the one of WhatsApp from @fortawesome/free-brands-svg-icons. A stand-in,
// drawn in the text color like any icon in a button.
const LOGO: string = '<svg aria-hidden="true" viewBox="0 0 16 16">'
    + '<circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2"/></svg>';

// a chat on WhatsApp is a link of the app like any other, its href from LinkUtilities.resolveWhatsAppHref.
const WHATS_APP_LINK: string = `
    <a ui-button variant="outlined" size="sm" target="_blank" href="${LinkUtilities.resolveWhatsAppHref('+49 171 1234567')}">
        ${LOGO} WhatsApp <span class="sr-only">(opens in a new tab)</span>
    </a>
`;

const meta: Meta<PersonCardComponent> = {
    title: 'UI/Person card',
    component: PersonCardComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent, PersonCardActionsComponent] })],
    render: args => ({
        props: { ...args, portrait: PORTRAIT },
        template: `
            <ui-person-card
                class="max-w-xs"
                name="Ada Lovelace"
                position="Head coach"
                phone="+49 171 1234567"
                email="ada@example.com"
                [photo]="portrait"
                [layout]="layout"
            >
                <p>Trains the youth teams since 2019.</p>
            </ui-person-card>
        `
    }),
    argTypes: {
        layout: { control: 'inline-radio', options: ['portrait', 'contact'] }
    },
    args: {
        layout: 'portrait'
    }
};
export default meta;

type Story = StoryObj<PersonCardComponent>;

export const Playground: Story = {};

// the grid is the app's: every card is as high as its row, and the buttons line up at the bottom.
export const TeamGrid: Story = {
    render: () => ({
        props: { portrait: PORTRAIT },
        template: `
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <ui-person-card name="Ada Lovelace" position="Head coach" email="ada@example.com" [photo]="portrait">
                    <p>Trains the youth teams since 2019.</p>
                </ui-person-card>
                <ui-person-card name="Grace Hopper" position="Chairwoman" phone="+49 221 98 76 54" />
                <ui-person-card name="Alan Turing" position="Treasurer" [photo]="portrait">
                    <p>Keeps the books, and the club out of debt since 2010.</p>
                    <p>Ask him about the membership fees.</p>
                </ui-person-card>
                <ui-person-card name="Katherine Johnson" position="Swimming department">
                    <ui-person-card-actions>${WHATS_APP_LINK}</ui-person-card-actions>
                </ui-person-card>
            </div>
        `
    })
};

// a compact card with a small photo, like the contact person at the end of a page, with actions of the app: a chat on
// WhatsApp and a profile on Instagram with the logos it chooses, and a link to book a trial.
export const Contact: Story = {
    render: () => ({
        props: { portrait: PORTRAIT },
        template: `
            <ui-person-card
                class="max-w-lg"
                layout="contact"
                name="Ada Lovelace"
                position="Your contact for memberships"
                phone="+49 (0) 2234 12 34-5"
                email="memberships@example.com"
                [photo]="portrait"
            >
                <ui-person-card-actions>
                    ${WHATS_APP_LINK}
                    <a ui-button variant="outlined" size="sm" href="https://www.instagram.com/" target="_blank">
                        ${LOGO} Instagram <span class="sr-only">(opens in a new tab)</span>
                    </a>
                    <a ui-button size="sm" href="#booking">Book a trial</a>
                </ui-person-card-actions>
            </ui-person-card>
        `
    })
};

// without a photo, the initials show in the frame of the photo.
export const ContactWithoutPhoto: Story = {
    render: () => ({
        template: `
            <ui-person-card class="max-w-lg" layout="contact" name="Grace Hopper" position="Office" email="club-office@example.com" />
        `
    })
};