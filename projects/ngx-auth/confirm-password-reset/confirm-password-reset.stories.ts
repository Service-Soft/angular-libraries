import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { Component, DestroyRef, ElementRef, EnvironmentProviders, inject, input, InputSignal, OnInit, Provider, Service } from '@angular/core';
import { provideRouter, Router, RouterOutlet, withDisabledInitialNavigation } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { FormTestingUtilities } from 'testing/form';
import { HttpTestingUtilities } from 'testing/http';

import { ConfirmPasswordResetComponent } from './confirm-password-reset.component';

@Service()
class StoryAuthService extends AuthService {}

// zibri, as far as the page gets: the link of the story works or doesn't.
function answerWith(isValid: boolean): (Provider | EnvironmentProviders)[] {
    return [
        // the page reads the token from its route, which the story opens itself instead of the url of storybook
        provideRouter([{ path: 'reset-password/:token', component: ConfirmPasswordResetComponent }], withDisabledInitialNavigation()),
        provideHttpClient(withInterceptors([
            authInterceptor,
            HttpTestingUtilities.answerWith({
                'POST /api/auth/verify-password-reset-token': { status: 200, body: { isValid } },
                'POST /api/auth/confirm-password-reset': { status: 204 }
            })
        ])),
        provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
    ];
}

// opens the link of the email, and sets a new password once the page asks for it when the story says so.
@Component({
    selector: 'ngx-password-reset-link',
    template: '<router-outlet />',
    imports: [RouterOutlet]
})
class PasswordResetLinkComponent implements OnInit {
    private readonly router: Router = inject(Router);

    private readonly root: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    private readonly destroyRef: DestroyRef = inject(DestroyRef);

    readonly setPassword: InputSignal<boolean> = input(false);

    ngOnInit(): void {
        if (this.setPassword()) {
            // the form only shows once the page checked the link
            const observer: MutationObserver = new MutationObserver(() => {
                if (FormTestingUtilities.findInput(this.root, 'new-password') != undefined) {
                    observer.disconnect();
                    FormTestingUtilities.type(this.root, 'new-password', 'correct horse battery staple');
                    FormTestingUtilities.click(this.root, 'Save password');
                }
            });
            observer.observe(this.root, { childList: true, subtree: true });
            this.destroyRef.onDestroy(() => observer.disconnect());
        }
        void this.router.navigateByUrl('/reset-password/story-token', { skipLocationChange: true });
    }
}

const meta: Meta<PasswordResetLinkComponent> = {
    title: 'Auth/Confirm password reset',
    component: PasswordResetLinkComponent,
    decorators: [applicationConfig({ providers: answerWith(true) })]
};
export default meta;

type Story = StoryObj<PasswordResetLinkComponent>;

export const Default: Story = {};

export const LinkDoesNotWork: Story = {
    decorators: [applicationConfig({ providers: answerWith(false) })]
};

export const Changed: Story = {
    args: { setPassword: true }
};