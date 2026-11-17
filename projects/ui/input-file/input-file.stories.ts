import { Meta, StoryObj } from '@storybook/angular';

import { InputExistingFile } from './input-existing-file.model';
import { InputFileValue } from './input-file-value.type';
import { InputFileComponent } from './input-file.component';

// a picture without a request, like one the backend serves
const LANDSCAPE: string = `data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#9cc6e8"/>'
    + '<path d="M0 36 16 20l12 12 8-8 12 12v12H0z" fill="#3d7a4d"/><circle cx="36" cy="12" r="5" fill="#f5c542"/></svg>'
)}`;

const PDF: string = 'application/pdf';

const STORED_PHOTO: InputExistingFile = { name: 'landscape.svg', url: LANDSCAPE, mimeType: 'image/svg+xml', size: 48_200 };
const STORED_CONTRACT: InputExistingFile = {
    name: 'contract.pdf',
    url: '/files/contract.pdf',
    mimeType: PDF,
    size: 1_480_000
};

const CHOSEN_PHOTO: File = new File(
    ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" fill="#e8b49c"/></svg>'],
    'portrait.svg',
    { type: 'image/svg+xml' }
);

const meta: Meta<InputFileComponent> = {
    title: 'UI/Input file',
    component: InputFileComponent,
    argTypes: {
        multiple: { control: 'boolean' },
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        multiple: true,
        size: 'md',
        required: false,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, value: [STORED_PHOTO, STORED_CONTRACT] satisfies InputFileValue[] },
        template: `
            <div class="grid max-w-96 gap-2">
                <ui-input-file
                    label="Attachments"
                    hint="Pictures and PDFs up to 5 MB"
                    accept="image/*,.pdf"
                    [maxSize]="5000000"
                    [multiple]="multiple"
                    [size]="size"
                    [required]="required"
                    [disabled]="disabled"
                    [readonly]="readonly"
                    [(value)]="value"
                />
                <p class="text-body-sm text-on-surface-variant">Files: {{ value.length }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputFileComponent>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        props: {
            stored: [STORED_PHOTO, STORED_CONTRACT],
            chosen: [CHOSEN_PHOTO]
        },
        template: `
            <div class="grid max-w-96 gap-4">
                <ui-input-file label="Invoice" [required]="false" />
                <ui-input-file label="Stored and chosen" multiple [value]="[...stored, ...chosen]" />
                <ui-input-file label="Read only" multiple readonly [value]="stored" />
                <ui-input-file label="Disabled" multiple disabled [value]="stored" />
            </div>
        `
    })
};

// the checks of the input, with the errors shown right away instead of once the user left it.
export const Validation: Story = {
    render: () => ({
        props: {
            // of many files, each that can't be uploaded says why
            attachments: [
                new File(['x'], 'invoice.pdf', { type: PDF }),
                new File(['x'.repeat(2000)], 'scan.pdf', { type: PDF }),
                new File(['x'], 'notes.txt', { type: 'text/plain' }),
                new File(['x'], 'receipt.pdf', { type: PDF })
            ]
        },
        template: `
            <div class="grid max-w-96 gap-4">
                <ui-input-file label="Invoice" [showValidationError]="true" />
                <ui-input-file
                    label="Attachments"
                    hint="PDFs up to 1 kB"
                    multiple
                    accept=".pdf"
                    [maxSize]="1000"
                    [value]="attachments"
                    [showValidationError]="true"
                />
            </div>
        `
    })
};