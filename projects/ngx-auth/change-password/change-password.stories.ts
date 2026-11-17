import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { afterNextRender, Component, ElementRef, EnvironmentProviders, inject, Provider, Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { FormTestingUtilities } from 'testing/form';
import { FakeAnswer, HttpTestingUtilities } from 'testing/http';

import { ChangePasswordComponent } from './change-password.component';

@Service()
class StoryAuthService extends AuthService {}

// zibri, as far as the form gets: it answers the change with the answer of the story.
function answerChangeWith(change: FakeAnswer): (Provider | EnvironmentProviders)[] {
    return [
        provideRouter([]),
        provideHttpClient(withInterceptors([
            authInterceptor,
            HttpTestingUtilities.answerWith({ 'POST /api/auth/change-password': change })
        ])),
        provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
    ];
}

// changes the password once the form shows, like a user would.
@Component({
    selector: 'ngx-change-password-attempt',
    template: '<ngx-change-password />',
    imports: [ChangePasswordComponent]
})
class ChangePasswordAttemptComponent {
    constructor() {
        const root: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        afterNextRender(() => {
            FormTestingUtilities.type(root, 'current-password', 'correct horse battery staple');
            FormTestingUtilities.type(root, 'new-password', 'another horse battery staple');
            FormTestingUtilities.click(root, 'Change password');
        });
    }
}

const meta: Meta<ChangePasswordComponent> = {
    title: 'Auth/Change password',
    component: ChangePasswordComponent,
    decorators: [applicationConfig({ providers: answerChangeWith({ status: 204 }) })],
    render: () => ({ template: '<ngx-change-password-attempt />', moduleMetadata: { imports: [ChangePasswordAttemptComponent] } })
};
export default meta;

type Story = StoryObj<ChangePasswordComponent>;

export const Default: Story = {
    render: () => ({ template: '<ngx-change-password />' })
};

export const Changed: Story = {};

export const Refused: Story = {
    decorators: [
        applicationConfig({
            providers: answerChangeWith({
                status: 403,
                body: { status: 403, name: 'ForbiddenError', message: 'Wrong password.', paragraphs: ['The current password is wrong.'] }
            })
        })
    ]
};