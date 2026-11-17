import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, Provider, Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, LinkedIdentity, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { HttpTestingUtilities } from 'testing/http';

import { provideIdentitiesConfig } from './identities-config.provider';
import { IdentitiesComponent } from './identities.component';

@Service()
class StoryAuthService extends AuthService {}

// zibri, as far as the page gets: the user of the story has these identities.
function answerIdentitiesWith(identities: LinkedIdentity[]): (Provider | EnvironmentProviders)[] {
    return [
        provideRouter([]),
        provideHttpClient(withInterceptors([
            authInterceptor,
            HttpTestingUtilities.answerWith({ 'GET /api/auth/identities': { status: 200, body: identities } })
        ])),
        provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' }),
        provideIdentitiesConfig({
            providers: [
                { authenticator: 'google', name: 'Google', apiAccess: [{ label: 'Allow access to your calendar', scopes: ['calendar'] }] },
                { authenticator: 'github', name: 'GitHub' }
            ],
            passkeyAuthenticator: 'passkey'
        })
    ];
}

const meta: Meta<IdentitiesComponent> = {
    title: 'Auth/Identities',
    component: IdentitiesComponent,
    decorators: [
        applicationConfig({
            providers: answerIdentitiesWith([
                { authenticator: 'google', identity: { id: 'identity-1', forLogin: true } },
                { authenticator: 'passkey', identity: { id: 'identity-2', createdAt: '2026-11-11T10:00:00.000Z' } }
            ])
        })
    ]
};
export default meta;

type Story = StoryObj<IdentitiesComponent>;

export const Default: Story = {};

export const NoneLinked: Story = {
    decorators: [applicationConfig({ providers: answerIdentitiesWith([]) })]
};