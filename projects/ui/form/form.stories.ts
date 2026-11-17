import { Component, effect, ElementRef, inject, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormDraftDirective } from '@service-soft/ui/form-draft';
import { InputOption, InputSize } from '@service-soft/ui/input';
import { InputAutocompleteComponent } from '@service-soft/ui/input-autocomplete';
import { InputBooleanComponent } from '@service-soft/ui/input-boolean';
import { InputChipsComponent } from '@service-soft/ui/input-chips';
import { InputDateComponent } from '@service-soft/ui/input-date';
import { InputFileComponent, InputFileValue } from '@service-soft/ui/input-file';
import { InputNumberComponent } from '@service-soft/ui/input-number';
import { InputSelectComponent } from '@service-soft/ui/input-select';
import { InputSliderComponent } from '@service-soft/ui/input-slider';
import { InputStringComponent } from '@service-soft/ui/input-string';
import { InputTextareaComponent } from '@service-soft/ui/input-textarea';
import { LinkComponent } from '@service-soft/ui/link';
import { SpamProtectionComponent } from '@service-soft/ui/spam-protection';
import { Meta, StoryObj } from '@storybook/angular';

import { FormComponent } from './form.component';

// a component with state, which the template of a story doesn't have.
@Component({
    selector: 'ui-sign-up-form',
    template: `
        <ui-form class="grid max-w-96 gap-4" (submit)="submitted.set(name())">
            <ui-input-string label="Name" autocomplete="name" [(value)]="name" />
            <ui-input-string
                label="Email"
                type="email"
                autocomplete="email"
                hint="We only use it to send you the receipt."
                [(value)]="email"
            />
            <ui-input-string
                label="Password"
                type="password"
                autocomplete="new-password"
                hint="At least 10 characters."
                [minLength]="10"
                [(value)]="password"
            />
            <ui-input-string label="Company" autocomplete="organization" [required]="false" [(value)]="company" />
            <div><button ui-button type="submit">Sign up</button></div>
            @if (submitted(); as name) {
                <p class="text-body-sm text-on-surface-variant" role="status">Signed up {{ name }}.</p>
            }
        </ui-form>
    `,
    imports: [FormComponent, InputStringComponent, ButtonComponent]
})
class SignUpFormComponent {
    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly name: WritableSignal<string> = signal('');
    readonly email: WritableSignal<string> = signal('no email');
    readonly password: WritableSignal<string> = signal('short');
    readonly company: WritableSignal<string> = signal('');
    readonly submitted: WritableSignal<string | undefined> = signal(undefined);

    // shows the form as it looks after submitting it without filling it in correctly.
    readonly submitInvalid: InputSignal<boolean> = input(false);

    constructor() {
        effect(() => {
            if (this.submitInvalid()) {
                this.element.querySelector('button')?.click();
            }
        });
    }
}

const OPTIONS: InputOption<string>[] = [{ label: 'Berlin', value: 'berlin' }, { label: 'Hamburg', value: 'hamburg' }];

// every control next to a text, whose boxes line up in a row of a form.
@Component({
    selector: 'ui-aligned-form',
    template: `
        <ui-form class="grid max-w-3xl grid-cols-2 gap-x-4 gap-y-2">
            <ui-input-string label="Text" [size]="size()" />
            <ui-input-number label="Number" [size]="size()" [value]="12" />
            <ui-input-string label="Text" [size]="size()" />
            <ui-input-select label="Select" [size]="size()" [options]="options" [value]="'berlin'" />
            <ui-input-string label="Text" [size]="size()" />
            <ui-input-autocomplete label="Autocomplete" [size]="size()" [options]="options" />
            <ui-input-string label="Text" [size]="size()" />
            <ui-input-date label="Date" [size]="size()" />
            <ui-input-string label="Text" [size]="size()" />
            <ui-input-slider label="Slider" [size]="size()" [value]="40" />
            <ui-input-string label="Text" [size]="size()" />
            <ui-input-chips label="Chips" [size]="size()" [options]="options" [value]="['berlin']" />
            <ui-input-string label="Text" [size]="size()" />
            <ui-input-file label="File" [size]="size()" [value]="files" />
            <ui-input-string label="Text" [size]="size()" />
            <!-- spans the rows of two texts, so the rows after it line up again -->
            <ui-input-textarea class="row-span-2" label="Textarea" [size]="size()" />
            <ui-input-string label="Text" [size]="size()" />
            <ui-input-string label="Text" [size]="size()" />
            <ui-input-boolean label="Checkbox" alignWithInputs [size]="size()" />
            <ui-input-string label="Text" [size]="size()" />
            <ui-input-boolean label="Switch" appearance="switch" alignWithInputs [size]="size()" />
        </ui-form>
    `,
    imports: [
        FormComponent,
        InputStringComponent,
        InputNumberComponent,
        InputSelectComponent,
        InputAutocompleteComponent,
        InputDateComponent,
        InputSliderComponent,
        InputChipsComponent,
        InputFileComponent,
        InputTextareaComponent,
        InputBooleanComponent
    ]
})
class AlignedFormComponent {
    readonly size: InputSignal<InputSize> = input<InputSize>('md');

    readonly options: InputOption<string>[] = OPTIONS;

    // a file shows in a box as high as an input, and chips below their input, so neither moves the row they are in
    readonly files: InputFileValue[] = [{ name: 'invoice-2026-11.pdf', url: '/files/1', mimeType: 'application/pdf', size: 240_000 }];
}

// a contact form whose values are kept while the user is away, with a checkbox that links the privacy policy and a
// spam protection that drops what bots send.
@Component({
    selector: 'ui-contact-form',
    template: `
        <ui-form class="grid max-w-96 gap-4" uiFormDraft="story-contact" (submit)="send(spam.isSpam())">
            <ui-input-string label="Name" name="name" autocomplete="name" [(value)]="name" />
            <ui-input-string label="Email" name="email" type="email" autocomplete="email" [(value)]="email" />
            <ui-input-textarea label="Message" name="message" [(value)]="message" />
            <ui-input-boolean name="privacy" required [(value)]="privacy">
                I accept the <a ui-link href="#privacy">privacy policy</a>.
            </ui-input-boolean>
            <ui-spam-protection #spam [minimumFillTime]="2000" />
            <div><button ui-button type="submit">Send</button></div>
            @if (result(); as result) {
                <p class="text-body-sm text-on-surface-variant" role="status">{{ result }}</p>
            }
        </ui-form>
    `,
    imports: [
        FormComponent,
        FormDraftDirective,
        InputStringComponent,
        InputTextareaComponent,
        InputBooleanComponent,
        LinkComponent,
        SpamProtectionComponent,
        ButtonComponent
    ]
})
class ContactFormComponent {
    readonly name: WritableSignal<string> = signal('');
    readonly email: WritableSignal<string> = signal('');
    readonly message: WritableSignal<string> = signal('');
    readonly privacy: WritableSignal<boolean> = signal(false);
    readonly result: WritableSignal<string | undefined> = signal(undefined);

    send(spam: boolean): void {
        this.result.set(spam ? 'Dropped as spam.' : `Sent the message of ${this.name()}.`);
    }
}

const meta: Meta<FormComponent> = {
    title: 'UI/Form',
    component: FormComponent
};
export default meta;

type Story = StoryObj<FormComponent>;

export const Default: Story = {
    render: () => ({
        moduleMetadata: { imports: [SignUpFormComponent] },
        template: '<ui-sign-up-form />'
    })
};

export const SubmittedInvalid: Story = {
    render: () => ({
        moduleMetadata: { imports: [SignUpFormComponent] },
        template: '<ui-sign-up-form [submitInvalid]="true" />'
    })
};
// what the user typed is still there after a reload of the page, until the form is sent. The privacy policy is a link
// inside the label of the checkbox.
export const ContactForm: Story = {
    render: () => ({
        moduleMetadata: { imports: [ContactFormComponent] },
        template: '<ui-contact-form />'
    })
};

// one field and its submit button in a row, below each other on a narrow screen. With a visible label, the button lines
// up with the box of the field; with a hidden one, like a search, with the field itself.
export const Inline: Story = {
    render: () => ({
        moduleMetadata: { imports: [InputStringComponent, ButtonComponent] },
        template: `
            <div class="flex max-w-xl flex-col gap-8">
                <ui-form layout="inline">
                    <ui-input-string label="Email" type="email" autocomplete="email" hint="One email a month, no more." />
                    <button ui-button type="submit">Subscribe</button>
                </ui-form>
                <ui-form layout="inline">
                    <ui-input-string label="Search" type="search" hideLabel [required]="false" placeholder="Courses, news, teams…" />
                    <button ui-button type="submit">Search</button>
                </ui-form>
            </div>
        `
    })
};

// the error shows below the field, the button stays next to its box.
export const InlineInvalid: Story = {
    render: () => ({
        moduleMetadata: { imports: [InputStringComponent, ButtonComponent] },
        props: { email: 'no email' },
        template: `
            <ui-form class="max-w-xl" layout="inline">
                <ui-input-string label="Email" type="email" [showValidationError]="true" [(value)]="email" />
                <button ui-button type="submit">Subscribe</button>
            </ui-form>
        `
    })
};

// the box of every control lines up with the one of a text next to it, in each size.
export const Aligned: Story = {
    render: () => ({
        moduleMetadata: { imports: [AlignedFormComponent] },
        template: `
            <div class="flex flex-col gap-8">
                <ui-aligned-form size="sm" />
                <ui-aligned-form size="md" />
                <ui-aligned-form size="lg" />
            </div>
        `
    })
};