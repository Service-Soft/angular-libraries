import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { HttpTestingUtilities } from 'testing/http';

import { SessionsComponent } from './sessions.component';

@Service()
class StoryAuthService extends AuthService {}

const meta: Meta<SessionsComponent> = {
    title: 'Auth/Sessions',
    component: SessionsComponent,
    decorators: [
        applicationConfig({
            providers: [
                provideRouter([]),
                // zibri, as far as the list gets: this browser and a phone
                provideHttpClient(withInterceptors([
                    authInterceptor,
                    HttpTestingUtilities.answerWith({
                        'GET /api/auth/logins': {
                            status: 200,
                            body: [
                                {
                                    id: 'login-1',
                                    strategy: 'cookie',
                                    current: true,
                                    lastUsedAt: '2026-11-11T10:00:00.000Z',
                                    expiresAt: '2026-12-11T10:00:00.000Z',
                                    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0',
                                    ipAddress: '203.0.113.1'
                                },
                                { id: 'login-2', strategy: 'cookie', current: false, expiresAt: '2026-12-01T10:00:00.000Z' }
                            ]
                        }
                    })
                ])),
                provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
            ]
        })
    ]
};
export default meta;

type Story = StoryObj<SessionsComponent>;

export const Default: Story = {};