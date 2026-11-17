import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { HttpTestingUtilities } from 'testing/http';

import { EmailSettingsComponent } from './email-settings.component';

@Service()
class StoryAuthService extends AuthService {}

// what the AuthService finds in the browser when the app starts: a login with the user of the story.
function startWith(emailVerifiedAt: string | undefined): () => Promise<object> {
    return async () => {
        localStorage.setItem('authData', JSON.stringify({
            strategy: 'cookie',
            userId: 'user-1',
            roles: [],
            expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
            user: { id: 'user-1', email: 'ada@example.com', emailVerifiedAt, memberships: [], platformPermissions: [] }
        }));
        return await Promise.resolve({});
    };
}

const meta: Meta<EmailSettingsComponent> = {
    title: 'Auth/Email settings',
    component: EmailSettingsComponent,
    decorators: [
        applicationConfig({
            providers: [
                provideRouter([]),
                provideHttpClient(withInterceptors([authInterceptor, HttpTestingUtilities.answerWith({})])),
                provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
            ]
        })
    ]
};
export default meta;

type Story = StoryObj<EmailSettingsComponent>;

export const NotVerified: Story = {
    loaders: [startWith(undefined)]
};

export const Verified: Story = {
    loaders: [startWith('2026-11-11T10:00:00.000Z')]
};