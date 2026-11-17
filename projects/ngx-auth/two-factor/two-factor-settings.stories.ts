import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, Provider, Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { HttpTestingUtilities } from 'testing/http';

import { TwoFactorSettingsComponent } from './two-factor-settings.component';

@Service()
class StoryAuthService extends AuthService {}

// zibri, as far as the settings get: the user of the story enrolled these methods.
function answerEnrolledWith(methods: string[]): (Provider | EnvironmentProviders)[] {
    return [
        provideRouter([]),
        provideHttpClient(withInterceptors([
            authInterceptor,
            HttpTestingUtilities.answerWith({ 'GET /api/auth/2fa/registrations': { status: 200, body: { methods } } })
        ])),
        provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
    ];
}

const meta: Meta<TwoFactorSettingsComponent> = {
    title: 'Auth/Two factor settings',
    component: TwoFactorSettingsComponent,
    decorators: [applicationConfig({ providers: answerEnrolledWith(['otp', 'recovery-code']) })]
};
export default meta;

type Story = StoryObj<TwoFactorSettingsComponent>;

export const Default: Story = {};

export const NothingEnrolled: Story = {
    decorators: [applicationConfig({ providers: answerEnrolledWith([]) })]
};