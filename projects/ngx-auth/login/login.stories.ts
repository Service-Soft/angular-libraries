import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { afterNextRender, Component, ElementRef, EnvironmentProviders, inject, Provider, Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { FormTestingUtilities } from 'testing/form';
import { FakeAnswer, HttpTestingUtilities } from 'testing/http';

import { provideLoginConfig } from './login-config.provider';
import { LoginComponent } from './login.component';

@Service()
class StoryAuthService extends AuthService {}

// zibri, as far as the login of a story gets: it refuses the password with the answer of the story.
function answerLoginWith(login: FakeAnswer): (Provider | EnvironmentProviders)[] {
    return [
        provideRouter([]),
        provideHttpClient(withInterceptors([
            authInterceptor,
            HttpTestingUtilities.answerWith({ 'POST /api/auth/login': login, 'POST /api/auth/login/2fa/request': { status: 204 } })
        ])),
        provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
    ];
}

// what zibri answers a refused request with.
function refuse(name: string, body: object = {}): FakeAnswer {
    return { status: 401, body: { status: 401, name, message: name, paragraphs: [name], ...body } };
}

// logs in once the login shows, like a user would, so the story shows the step the login leads to.
@Component({
    selector: 'ngx-login-attempt',
    template: '<ngx-login />',
    imports: [LoginComponent]
})
class LoginAttemptComponent {
    constructor() {
        const root: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        afterNextRender(() => {
            FormTestingUtilities.type(root, 'email', 'ada@example.com');
            FormTestingUtilities.type(root, 'password', 'correct horse battery staple');
            FormTestingUtilities.click(root, 'Log in');
        });
    }
}

const meta: Meta<LoginComponent> = {
    title: 'Auth/Login',
    component: LoginComponent,
    decorators: [applicationConfig({ providers: answerLoginWith({ status: 204 }) })],
    render: () => ({ template: '<ngx-login-attempt />', moduleMetadata: { imports: [LoginAttemptComponent] } })
};
export default meta;

type Story = StoryObj<LoginComponent>;

// the login as it opens, without logging in.
const renderLogin: Story['render'] = () => ({ template: '<ngx-login />' });

export const Default: Story = {
    render: renderLogin
};

export const WithPasskey: Story = {
    render: renderLogin,
    decorators: [
        applicationConfig({
            providers: [
                provideLoginConfig({
                    passkeyAuthenticator: 'passkey',
                    providers: [
                        { authenticator: 'google', label: 'Log in with Google' },
                        { authenticator: 'github', label: 'Log in with GitHub' }
                    ]
                })
            ]
        })
    ]
};

export const PasskeyAsSecondFactor: Story = {
    decorators: [
        applicationConfig({
            providers: answerLoginWith(refuse('SecondFactorRequiredError', { ticket: 'ticket-1', methods: ['passkey', 'otp'] }))
        })
    ]
};

export const Refused: Story = {
    decorators: [
        applicationConfig({
            providers: answerLoginWith(refuse('UnauthorizedError', { paragraphs: ['Wrong email or password.'] }))
        })
    ]
};

export const SecondFactor: Story = {
    decorators: [
        applicationConfig({
            providers: answerLoginWith(
                refuse('SecondFactorRequiredError', { ticket: 'ticket-1', methods: ['email', 'otp', 'recovery-code'] })
            )
        })
    ]
};

export const NoUsableSecondFactor: Story = {
    decorators: [
        applicationConfig({
            providers: answerLoginWith(refuse('SecondFactorRequiredError', { ticket: 'ticket-1', methods: ['hardware-token'] }))
        })
    ]
};

export const Enrollment: Story = {
    decorators: [
        applicationConfig({
            providers: answerLoginWith(refuse('SecondFactorRequiredError', { ticket: 'ticket-1', methods: [] }))
        })
    ]
};

export const PasswordChange: Story = {
    decorators: [applicationConfig({ providers: answerLoginWith(refuse('PasswordChangeRequiredError', { ticket: 'ticket-1' })) })]
};
// a jwt login bound to the key of the browser, which every request proves. The login succeeds, the key stays in
// IndexedDB for the next visit.
export const WithDpop: Story = {
    decorators: [
        applicationConfig({
            providers: [
                provideRouter([]),
                provideHttpClient(withInterceptors([
                    authInterceptor,
                    HttpTestingUtilities.answerWith({
                        'POST /api/auth/login': {
                            status: 200,
                            body: {
                                userId: 'user-1',
                                roles: [],
                                accessToken: { value: 'access-1', expirationDate: '2099-01-01T00:00:00.000Z' },
                                refreshToken: { value: 'refresh-1', expirationDate: '2099-01-01T00:00:00.000Z' }
                            }
                        },
                        'GET /api/auth/me': {
                            status: 200,
                            body: { id: 'user-1', email: 'ada@example.com', memberships: [], platformPermissions: [] }
                        }
                    })
                ])),
                provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'jwt', dpop: true })
            ]
        })
    ]
};