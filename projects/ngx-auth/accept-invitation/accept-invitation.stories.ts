import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Component, EnvironmentProviders, inject, OnInit, Provider, Service } from '@angular/core';
import { provideRouter, Router, RouterOutlet, withDisabledInitialNavigation } from '@angular/router';
import { AuthData, authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { HttpTestingUtilities } from 'testing/http';
import { InvitationTokenValidity } from 'zibri-contract';

import { AcceptInvitationComponent } from './accept-invitation.component';

@Service()
class StoryAuthService extends AuthService {}

// an invitation to a tenant that works, of an email with an account, which may be declined.
const VALID: InvitationTokenValidity = {
    isValid: true,
    renewed: false,
    email: 'ada@example.com',
    tenantId: 'tenant-b',
    requiresLogin: true,
    declinable: true
};

// zibri, as far as the page gets: the link of the story and what it answers about it.
function answerWith(validity: InvitationTokenValidity): (Provider | EnvironmentProviders)[] {
    return [
        // the page reads the token from its route, which the story opens itself instead of the url of storybook
        provideRouter([{ path: 'accept-invitation/:token', component: AcceptInvitationComponent }], withDisabledInitialNavigation()),
        provideHttpClient(withInterceptors([
            authInterceptor,
            HttpTestingUtilities.answerWith({
                'POST /api/auth/verify-invitation-token': { status: 200, body: validity },
                'POST /api/auth/accept-invitation': { status: 204 },
                'POST /api/auth/decline-invitation': { status: 204 }
            })
        ])),
        provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
    ];
}

// a login of another visit, which the AuthService finds in the browser when the app starts, or none.
function startLoggedInAs(email: string | undefined): () => Promise<object> {
    return async () => {
        localStorage.removeItem('authData');
        if (email != undefined) {
            const login: AuthData<string> = {
                strategy: 'cookie',
                userId: 'user-1',
                roles: ['user'],
                expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
                user: { id: 'user-1', email, memberships: [], platformPermissions: [] }
            };
            localStorage.setItem('authData', JSON.stringify(login));
        }
        return await Promise.resolve({});
    };
}

// opens the link of the email.
@Component({
    selector: 'ngx-invitation-link',
    template: '<router-outlet />',
    imports: [RouterOutlet]
})
class InvitationLinkComponent implements OnInit {
    private readonly router: Router = inject(Router);

    ngOnInit(): void {
        void this.router.navigateByUrl('/accept-invitation/story-token', { skipLocationChange: true });
    }
}

const meta: Meta<InvitationLinkComponent> = {
    title: 'Auth/Accept invitation',
    component: InvitationLinkComponent,
    loaders: [startLoggedInAs(undefined)],
    decorators: [applicationConfig({ providers: answerWith(VALID) })]
};
export default meta;

type Story = StoryObj<InvitationLinkComponent>;

// an invitation that creates its account, which asks for its password.
export const NewAccount: Story = {
    decorators: [applicationConfig({ providers: answerWith({ ...VALID, requiresLogin: false }) })]
};

export const LoginRequired: Story = {};

export const LoggedInAsInvited: Story = {
    loaders: [startLoggedInAs('ada@example.com')]
};

export const LoggedInAsSomebodyElse: Story = {
    loaders: [startLoggedInAs('grace@example.com')]
};

export const LinkDoesNotWork: Story = {
    decorators: [applicationConfig({ providers: answerWith({ isValid: false, renewed: false, requiresLogin: false, declinable: false }) })]
};

export const LinkRenewed: Story = {
    decorators: [applicationConfig({ providers: answerWith({ isValid: false, renewed: true, requiresLogin: false, declinable: false }) })]
};