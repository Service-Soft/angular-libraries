import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { afterNextRender, Component, ElementRef, inject, Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { FormTestingUtilities } from 'testing/form';
import { HttpTestingUtilities } from 'testing/http';

import { RequestPasswordResetComponent } from './request-password-reset.component';

@Service()
class StoryAuthService extends AuthService {}

// asks for the link once the page shows, like a user would.
@Component({
    selector: 'ngx-request-password-reset-attempt',
    template: '<ngx-request-password-reset />',
    imports: [RequestPasswordResetComponent]
})
class RequestPasswordResetAttemptComponent {
    constructor() {
        const root: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        afterNextRender(() => {
            FormTestingUtilities.type(root, 'email', 'ada@example.com');
            FormTestingUtilities.click(root, 'Send link');
        });
    }
}

const meta: Meta<RequestPasswordResetComponent> = {
    title: 'Auth/Request password reset',
    component: RequestPasswordResetComponent,
    decorators: [
        applicationConfig({
            providers: [
                provideRouter([]),
                provideHttpClient(withInterceptors([
                    authInterceptor,
                    HttpTestingUtilities.answerWith({ 'POST /api/auth/request-password-reset': { status: 204 } })
                ])),
                provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
            ]
        })
    ]
};
export default meta;

type Story = StoryObj<RequestPasswordResetComponent>;

export const Default: Story = {};

export const Sent: Story = {
    render: () => ({
        template: '<ngx-request-password-reset-attempt />',
        moduleMetadata: { imports: [RequestPasswordResetAttemptComponent] }
    })
};