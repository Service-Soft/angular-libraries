import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, computed, inject, LOCALE_ID, Signal, signal, WritableSignal } from '@angular/core';
import { AuthErrorUtilities, AuthService, LinkedIdentity, PasskeyUtilities } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';
import { ConfirmDialogComponent, ConfirmDialogData, DialogService } from '@service-soft/ui/dialog';

import { ConnectableProvider } from './connectable-provider.model';
import { IdentitiesConfig, IdentitiesLabels } from './identities-config.model';
import { IDENTITIES_CONFIG } from './identities-config.provider';
import { IdentityApiAccess } from './identity-api-access.model';
import { IdentityProvider } from './identity-provider.model';
import { IdentityRow } from './identity-row.model';

/**
 * The ways to log in of the logged in user, for the page of their account, besides their password: the providers they
 * connected and their passkeys. Connects a provider, adds a passkey, and removes one after asking. To change them,
 * zibri wants the second factor or a recent login, which the interceptor asks the user for with the secondFactorPrompt.
 * Its heading is a h2, below the heading of that page. The providers and texts come from provideIdentitiesConfig.
 */
@Component({
    selector: 'ngx-identities',
    templateUrl: './identities.component.html',
    imports: [ButtonComponent],
    host: {
        class: 'block'
    }
})
export class IdentitiesComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    private readonly dialogService: DialogService = inject(DialogService);

    private readonly document: Document = inject(DOCUMENT);

    private readonly dateFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(inject(LOCALE_ID), { dateStyle: 'medium' });

    // the linked identities, undefined until zibri answered.
    private readonly identities: WritableSignal<LinkedIdentity[] | undefined> = signal(undefined);

    // a second click while a request is on its way would send it twice.
    private sending: boolean = false;

    /**
     * How the ways to log in look and work.
     */
    protected readonly config: IdentitiesConfig = inject(IDENTITIES_CONFIG);

    /**
     * The texts.
     */
    protected readonly labels: IdentitiesLabels = this.config.labels;

    /**
     * What zibri answered the last refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last action did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    /**
     * The linked identities, as the user reads them.
     */
    protected readonly rows: Signal<IdentityRow[]> = computed(() => (this.identities() ?? []).map(linked => ({
        id: linked.identity.id,
        authenticator: linked.authenticator,
        forLogin: linked.identity.forLogin !== false,
        nameId: `ngx-identity-${linked.identity.id}`,
        name: this.resolveName(linked.authenticator),
        detail: this.resolveDetail(linked),
        missingAccess: this.findMissingAccess(linked)
    })));

    /**
     * The providers the user hasn't connected yet, once zibri said which ones they have.
     */
    protected readonly connectableProviders: Signal<ConnectableProvider[]> = computed(() => {
        const identities: LinkedIdentity[] | undefined = this.identities();
        return identities == undefined
            ? []
            : this.config.providers
                .filter(provider => !identities.some(linked => linked.authenticator === provider.authenticator))
                .map(provider => ({ authenticator: provider.authenticator, label: this.labels.connect(provider.name) }));
    });

    constructor() {
        afterNextRender(() => void this.run(async () => await this.loadIdentities()));
    }

    /**
     * Sends the browser to a provider to connect it, which comes back to this page.
     * @param provider - The provider.
     */
    protected async connect(provider: ConnectableProvider): Promise<void> {
        const scopes: string[] = this.findProvider(provider.authenticator)?.apiScopes ?? [];
        const redirectTo: string = this.document.location.href;
        await this.run(async () => await this.authService.startProviderLink(provider.authenticator, redirectTo, true, scopes));
    }

    /**
     * Sends the browser to a connected provider to grant access to its apis, which connects it again with the scopes it
     * already granted and those of the access, keeping whether the user logs in with it.
     * @param row - The identity.
     * @param access - The access to grant.
     */
    protected async grant(row: IdentityRow, access: IdentityApiAccess): Promise<void> {
        const granted: string[] = this.identities()?.find(linked => linked.identity.id === row.id)?.identity.grantedScopes ?? [];
        const scopes: string[] = [...new Set([...granted, ...access.scopes])];
        const redirectTo: string = this.document.location.href;
        await this.run(async () => await this.authService.startProviderLink(row.authenticator, redirectTo, row.forLogin, scopes));
    }

    /**
     * Has the device create a passkey that logs in, listed under the email of the user.
     * @param authenticator - The name of the passkey authenticator of zibri.
     */
    protected async addPasskey(authenticator: string): Promise<void> {
        await this.run(async () => {
            await this.authService.addPasskey(this.authService.currentUser()?.email ?? '', authenticator);
            await this.loadIdentities();
            this.status.set(this.labels.passkeyAdded);
        });
    }

    /**
     * Removes a way to log in once the user confirmed it.
     * @param row - The identity.
     */
    protected async remove(row: IdentityRow): Promise<void> {
        const data: ConfirmDialogData = {
            title: this.labels.removeTitle,
            paragraphs: [this.labels.removeMessage],
            confirmButtonLabel: this.labels.remove,
            cancelButtonLabel: this.labels.cancel,
            confirmButtonColor: 'error'
        };
        if (await this.dialogService.open<boolean>(ConfirmDialogComponent, data).closed !== true) {
            return;
        }
        await this.run(async () => {
            await this.authService.unlinkIdentity(row.id);
            await this.loadIdentities();
            this.status.set(this.labels.removed);
        });
    }

    private resolveName(authenticator: string): string {
        return authenticator === this.config.passkeyAuthenticator
            ? this.labels.passkey
            : this.config.providers.find(provider => provider.authenticator === authenticator)?.name ?? authenticator;
    }

    // the access the app asks for of the provider of an identity whose scopes it didn't grant all of.
    private findMissingAccess(linked: LinkedIdentity): IdentityApiAccess[] {
        const granted: Set<string> = new Set(linked.identity.grantedScopes ?? []);
        const access: IdentityApiAccess[] = this.findProvider(linked.authenticator)?.apiAccess ?? [];
        return access.filter(candidate => candidate.scopes.some(scope => !granted.has(scope)));
    }

    private findProvider(authenticator: string): IdentityProvider | undefined {
        return this.config.providers.find(provider => provider.authenticator === authenticator);
    }

    private resolveDetail(linked: LinkedIdentity): string {
        if (linked.identity.forLogin === false) {
            return this.labels.notForLogin;
        }
        const createdAt: string | undefined = linked.identity.createdAt;
        return createdAt == undefined ? '' : this.labels.passkeyAddedOn(this.dateFormat.format(new Date(createdAt)));
    }

    private async loadIdentities(): Promise<void> {
        this.identities.set(await this.authService.resolveIdentities());
    }

    private async run(work: () => Promise<void>): Promise<void> {
        if (this.sending) {
            return;
        }
        this.sending = true;
        this.errorParagraphs.set([]);
        this.status.set('');
        try {
            await work();
        }
        catch (error) {
            // the user cancelled a passkey on purpose
            if (!PasskeyUtilities.isCancelled(error)) {
                this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
            }
        }
        finally {
            this.sending = false;
        }
    }
}