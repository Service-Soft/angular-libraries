import { afterNextRender, Component, inject, input, InputSignal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';
import { Meta, StoryObj } from '@storybook/angular';

import { SnackbarColor } from './snackbar-color.type';
import { SnackbarComponent } from './snackbar.component';
import { SnackbarService } from './snackbar.service';

// a component that opens a message, which the template of a story can't.
@Component({
    selector: 'ui-save-order',
    template: '<button ui-button type="button" (click)="save()">Save order</button>',
    imports: [ButtonComponent]
})
class SaveOrderComponent {
    private readonly snackbarService: SnackbarService = inject(SnackbarService);

    // shows the story with the message showing.
    readonly openOnRender: InputSignal<boolean> = input(false);

    readonly color: InputSignal<SnackbarColor> = input<SnackbarColor>('neutral');

    constructor() {
        afterNextRender(() => {
            if (this.openOnRender()) {
                this.save();
            }
        });
    }

    save(): void {
        this.snackbarService.open('Saved the order.', { duration: 60_000, color: this.color() });
    }
}

const meta: Meta<SnackbarComponent> = {
    title: 'UI/Snackbar',
    component: SnackbarComponent
};
export default meta;

type Story = StoryObj<SnackbarComponent>;

export const Default: Story = {
    render: () => ({ template: '<ui-save-order />', moduleMetadata: { imports: [SaveOrderComponent] } })
};

// its control switches the color of the message.
export const Showing: Story = {
    argTypes: {
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary', 'error', 'success'] }
    },
    args: {
        color: 'neutral'
    },
    render: args => ({
        props: args,
        template: '<ui-save-order [openOnRender]="true" [color]="color" />',
        moduleMetadata: { imports: [SaveOrderComponent] }
    })
};