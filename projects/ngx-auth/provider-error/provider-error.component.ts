import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AUTH_CONFIG, AuthConfig, AuthService } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';

import { ProviderErrorLabels } from './provider-error-config.model';
import { PROVIDER_ERROR_CONFIG } from './provider-error-config.provider';

/**
 * Where the user goes on from the page.
 */
type BackLink = {
    /**
     * The route.
     */
    route: string,
    /**
     * The text of the link.
     */
    label: string
};

/**
 * The page a login at a provider lands on when it failed, for the errorUrl of zibri: it says what went wrong by the
 * `error` zibri adds, and leads back to the login, or into the app for a logged in user whose provider couldn't be
 * connected. Its texts come from provideProviderErrorConfig.
 */
@Component({
    selector: 'ngx-provider-error',
    templateUrl: './provider-error.component.html',
    imports: [ButtonComponent, RouterLink],
    host: {
        class: 'block'
    }
})
export class ProviderErrorComponent {
    private readonly authConfig: AuthConfig = inject(AUTH_CONFIG);

    /**
     * The texts of the page.
     */
    protected readonly labels: ProviderErrorLabels = inject(PROVIDER_ERROR_CONFIG).labels;

    /**
     * What went wrong.
     */
    protected readonly message: string;

    /**
     * Where the user goes on: the login, or into the app.
     */
    protected readonly back: BackLink;

    constructor() {
        const error: string | null = inject(ActivatedRoute).snapshot.queryParamMap.get('error');
        this.message = (error == undefined ? undefined : this.labels.errors[error]) ?? this.labels.errors.failed;
        this.back = inject<AuthService>(AuthService).loggedIn()
            ? { route: this.authConfig.routes.afterLogin, label: this.labels.backToApp }
            : { route: this.authConfig.routes.login, label: this.labels.backToLogin };
    }
}