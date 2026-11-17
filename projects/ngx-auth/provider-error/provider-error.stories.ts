import { provideHttpClient } from '@angular/common/http';
import { Component, inject, Service } from '@angular/core';
import { provideRouter, Router, RouterOutlet, withDisabledInitialNavigation } from '@angular/router';
import { AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { ProviderErrorComponent } from './provider-error.component';

@Service()
class StoryAuthService extends AuthService {}

// lands on the page with the error of the story, as zibri sends the browser there.
@Component({
    selector: 'ngx-provider-error-landing',
    template: '<router-outlet />',
    imports: [RouterOutlet]
})
class ProviderErrorLandingComponent {
    constructor() {
        void inject(Router).navigateByUrl('/login-failed?error=cancelled', { skipLocationChange: true });
    }
}

const meta: Meta<ProviderErrorLandingComponent> = {
    title: 'Auth/Provider error',
    component: ProviderErrorLandingComponent,
    decorators: [
        applicationConfig({
            providers: [
                provideRouter([{ path: 'login-failed', component: ProviderErrorComponent }], withDisabledInitialNavigation()),
                provideHttpClient(),
                provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
            ]
        })
    ]
};
export default meta;

type Story = StoryObj<ProviderErrorLandingComponent>;

export const Default: Story = {};