import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Component, EnvironmentProviders, inject, Provider, Service } from '@angular/core';
import { provideRouter, Router, RouterOutlet, withDisabledInitialNavigation } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { HttpTestingUtilities } from 'testing/http';
import { EmailConfirmation } from 'zibri-contract';

import { ConfirmEmailComponent } from './confirm-email.component';

@Service()
class StoryAuthService extends AuthService {}

// zibri, as far as the page gets: it answers the link of the story.
function answerWith(confirmation: EmailConfirmation): (Provider | EnvironmentProviders)[] {
    return [
        // the page reads the token from its route, which the story opens itself instead of the url of storybook
        provideRouter([{ path: 'verify-email/:token', component: ConfirmEmailComponent }], withDisabledInitialNavigation()),
        provideHttpClient(withInterceptors([
            authInterceptor,
            HttpTestingUtilities.answerWith({ 'POST /api/auth/confirm-email': { status: 200, body: confirmation } })
        ])),
        provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
    ];
}

// opens the link of the email.
@Component({
    selector: 'ngx-email-link',
    template: '<router-outlet />',
    imports: [RouterOutlet]
})
class EmailLinkComponent {
    constructor() {
        void inject(Router).navigateByUrl('/verify-email/story-token', { skipLocationChange: true });
    }
}

const meta: Meta<EmailLinkComponent> = {
    title: 'Auth/Confirm email',
    component: EmailLinkComponent,
    decorators: [applicationConfig({ providers: answerWith({ purpose: 'verification', completed: true }) })]
};
export default meta;

type Story = StoryObj<EmailLinkComponent>;

export const Verified: Story = {};

export const ChangeWaitsForOtherLink: Story = {
    decorators: [applicationConfig({ providers: answerWith({ purpose: 'change', completed: false }) })]
};