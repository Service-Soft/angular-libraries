import { Component, effect, signal, WritableSignal } from '@angular/core';
import { InputOption } from '@service-soft/ui/input';
import { Meta, StoryObj } from '@storybook/angular';

import { InputAutocompleteComponent } from './input-autocomplete.component';

const CITIES: InputOption<string>[] = [
    { label: 'Berlin', value: 'BER' },
    { label: 'Bern', value: 'BRN' },
    { label: 'Bremen', value: 'BRE' },
    { label: 'Hamburg', value: 'HAM' },
    { label: 'Hannover', value: 'HAJ' },
    { label: 'Munich', value: 'MUC' },
    { label: 'Vienna', value: 'VIE', disabled: true }
];

// searches the cities like a backend, which answers 300ms after the text changed.
@Component({
    selector: 'ui-city-search',
    template: '<ui-input-autocomplete class="max-w-80" label="City" [options]="options()" [(query)]="query" [(value)]="city" />',
    imports: [InputAutocompleteComponent]
})
class CitySearchComponent {
    readonly query: WritableSignal<string> = signal('');
    readonly city: WritableSignal<string | undefined> = signal(undefined);
    readonly options: WritableSignal<InputOption<string>[]> = signal([]);

    constructor() {
        effect(onCleanup => {
            const query: string = this.query().toLowerCase();
            const timeout: ReturnType<typeof setTimeout> = setTimeout(() => {
                this.options.set(query === '' ? [] : CITIES.filter(city => city.label.toLowerCase().includes(query)));
            }, 300);
            onCleanup(() => clearTimeout(timeout));
        });
    }
}

const meta: Meta<InputAutocompleteComponent<string>> = {
    title: 'UI/Input autocomplete',
    component: InputAutocompleteComponent,
    argTypes: {
        size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
        required: { control: 'boolean' },
        disabled: { control: 'boolean' },
        readonly: { control: 'boolean' }
    },
    args: {
        size: 'md',
        required: true,
        disabled: false,
        readonly: false
    },
    render: args => ({
        props: { ...args, options: CITIES, value: undefined },
        template: `
            <div class="grid max-w-80 gap-2">
                <ui-input-autocomplete
                    label="City"
                    hint="Type to find it"
                    placeholder="Berlin"
                    [options]="options"
                    [size]="size"
                    [required]="required"
                    [disabled]="disabled"
                    [readonly]="readonly"
                    [(value)]="value"
                />
                <p class="text-body-sm text-on-surface-variant">Value: {{ value }}</p>
            </div>
        `
    })
};
export default meta;

type Story = StoryObj<InputAutocompleteComponent<string>>;

export const Playground: Story = {};

export const States: Story = {
    render: () => ({
        props: { options: CITIES },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-autocomplete label="Empty" placeholder="Berlin" [required]="false" [options]="options" />
                <ui-input-autocomplete label="Chosen" value="HAM" [options]="options" />
                <ui-input-autocomplete label="Read only" value="HAM" readonly [options]="options" />
                <ui-input-autocomplete label="Disabled" value="HAM" disabled [options]="options" />
            </div>
        `
    })
};

// options found by a backend, which answers a while after the text changed.
export const BackendSearch: Story = {
    render: () => ({ template: '<ui-city-search />', moduleMetadata: { imports: [CitySearchComponent] } })
};

// the checks of the input, with the errors shown right away instead of once the user left it.
export const Validation: Story = {
    render: () => ({
        props: { options: CITIES },
        template: `
            <div class="grid max-w-80 gap-4">
                <ui-input-autocomplete label="City" [options]="options" [showValidationError]="true" />
                <ui-input-autocomplete label="Destination" query="Paris" [options]="options" [showValidationError]="true" />
            </div>
        `
    })
};