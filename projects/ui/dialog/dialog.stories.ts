import { afterNextRender, Component, inject, input, InputSignal, signal, WritableSignal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { ConfirmDialogData } from './confirm-dialog-data.model';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import { DialogComponent } from './dialog.component';
import { DialogService } from './dialog.service';
import { MessageDialogData } from './message-dialog-data.model';
import { MessageDialogComponent } from './message-dialog.component';

const DELETE_ORDER: ConfirmDialogData = {
    title: 'Delete the order?',
    paragraphs: ['The order and its invoice are deleted.', 'This can\'t be undone.'],
    confirmButtonLabel: 'Delete',
    cancelButtonLabel: 'Cancel',
    confirmButtonColor: 'error'
};

// a component with state, which the template of a story doesn't have.
@Component({
    selector: 'ui-delete-order',
    template: `
        <button ui-button type="button" color="error" variant="outlined" (click)="delete()">Delete order</button>
        <p class="mt-4 text-body-sm text-on-surface-variant" role="status">{{ answer() }}</p>
    `,
    imports: [ButtonComponent]
})
class DeleteOrderComponent {
    private readonly dialogService: DialogService = inject(DialogService);

    readonly answer: WritableSignal<string> = signal('');

    // shows the story with the dialog open.
    readonly openOnRender: InputSignal<boolean> = input(false);

    constructor() {
        afterNextRender(() => {
            if (this.openOnRender()) {
                void this.delete();
            }
        });
    }

    async delete(): Promise<void> {
        const confirmed: boolean | undefined = await this.dialogService.open<boolean>(ConfirmDialogComponent, DELETE_ORDER).closed;
        this.answer.set(confirmed === true ? 'Deleted.' : 'Kept.');
    }
}

const ORDER_FAILED: MessageDialogData = {
    title: 'The order couldn\'t be placed',
    paragraphs: ['The payment was declined.', 'Reference: 4f2a9c0e-7b1d-4e8a-9c3f-2d6b8a1e5f07'],
    closeButtonLabel: 'OK'
};

// opens a message right away, like an app that tells its user why something failed.
@Component({
    selector: 'ui-order-failed',
    template: '<button ui-button type="button" (click)="open()">Place order</button>',
    imports: [ButtonComponent]
})
class OrderFailedComponent {
    private readonly dialogService: DialogService = inject(DialogService);

    constructor() {
        afterNextRender(() => this.open());
    }

    open(): void {
        this.dialogService.open(MessageDialogComponent, ORDER_FAILED);
    }
}

const meta: Meta<DialogComponent> = {
    title: 'UI/Dialog',
    component: DialogComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent, DeleteOrderComponent, OrderFailedComponent] })]
};
export default meta;

type Story = StoryObj<DialogComponent>;

// the DialogService opens a component from code, here the ConfirmDialogComponent.
export const OpenedFromCode: Story = {
    render: () => ({ template: '<ui-delete-order />' })
};

export const Open: Story = {
    render: () => ({ template: '<ui-delete-order [openOnRender]="true" />' })
};

// the MessageDialogComponent: something the user has to notice, with one button.
export const Message: Story = {
    render: () => ({ template: '<ui-order-failed />' })
};

// a question without a default answer: escape doesn't close it, one of its buttons has to.
export const WithoutEscape: Story = {
    render: () => ({
        template: `
            <button ui-button type="button" (click)="language.open()">Choose a language</button>
            <ui-dialog #language closeOnEscape="false">
                <h2 class="font-heading text-title">Which language do you prefer?</h2>
                <form class="mt-6 flex justify-end gap-2" method="dialog">
                    <button ui-button type="submit">English</button>
                    <button ui-button type="submit">Deutsch</button>
                </form>
            </ui-dialog>
        `
    })
};

// a dialog written in the template. A button in a form with method="dialog" closes it, like in plain html.
export const InTheTemplate: Story = {
    render: () => ({
        template: `
            <button ui-button type="button" (click)="newsletter.open()">Subscribe</button>
            <ui-dialog #newsletter>
                <h2 class="font-heading text-title">Newsletter</h2>
                <p class="mt-3 text-body">One email a month, no more.</p>
                <form class="mt-6 flex justify-end" method="dialog">
                    <button ui-button type="submit">Got it</button>
                </form>
            </ui-dialog>
        `
    })
};