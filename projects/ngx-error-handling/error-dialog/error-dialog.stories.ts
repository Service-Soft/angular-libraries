import { HttpErrorResponse } from '@angular/common/http';
import { afterNextRender, Component, ErrorHandler, inject, input, InputSignal } from '@angular/core';
import { provideErrorHandler } from '@service-soft/ngx-error-handling/error-handler';
import { ButtonComponent } from '@service-soft/ui/button';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { showDialogErrorHandler } from './show-dialog-error-handler.function';

// the errors of the stories, as a request fails with them.
const ERRORS: Record<string, unknown> = {
    refused: new HttpErrorResponse({
        status: 400,
        error: {
            status: 400,
            name: 'BadRequestError',
            message: 'The data of the request is invalid.',
            paragraphs: ['The data of the request is invalid.'],
            problems: [{ key: 'email', code: 'format', message: 'is no email address' }],
            traceId: '4bf92f3577b34da6a3ce929d0e0e4736'
        }
    }),
    failed: new TypeError('Cannot read properties of undefined'),
    offline: new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') })
};

// fails right away with the error of the story, like a request nothing caught, and offers to fail again.
@Component({
    selector: 'ngx-failing-request',
    template: '<button ui-button type="button" variant="outlined" (click)="fail()">Send the request</button>',
    imports: [ButtonComponent]
})
class FailingRequestComponent {
    private readonly errorHandler: ErrorHandler = inject(ErrorHandler);

    readonly error: InputSignal<string> = input('refused');

    constructor() {
        afterNextRender(() => this.fail());
    }

    fail(): void {
        this.errorHandler.handleError(ERRORS[this.error()]);
    }
}

const meta: Meta<FailingRequestComponent> = {
    title: 'Error handling/Error dialog',
    component: FailingRequestComponent,
    decorators: [applicationConfig({ providers: [provideErrorHandler(showDialogErrorHandler())] })]
};
export default meta;

type Story = StoryObj<FailingRequestComponent>;

export const Refused: Story = {};

export const Failed: Story = {
    args: { error: 'failed' }
};

export const Offline: Story = {
    args: { error: 'offline' }
};