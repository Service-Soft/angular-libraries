import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpContext, HttpHeaders } from '@angular/common/http';
import { computed, DestroyRef, inject, Injector, PLATFORM_ID, runInInjectionContext, Signal, signal, Type, WritableSignal } from '@angular/core';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';
import { AcceptInvitationInput, CookieAuthData, CsrfToken, CurrentUserProfile, EmailConfirmation, FederatedLinkIdentityStart, InvitationTokenValidity, JwtAuthData, LogoutResult, PasskeyTicketCredentials, PasswordResetTokenValidity, TwoFactorRegistrations, UserLogin } from 'zibri-contract';

import { AnyLevelPermission } from './any-level-permission.model';
import { AuthConfig } from './auth-config.model';
import { AUTH_CONFIG } from './auth-config.provider';
import { AuthData } from './auth-data.model';
import { AuthErrorBody } from './auth-error-body.model';
import { AuthErrorUtilities } from './auth-error.utilities';
import { AuthPaths } from './auth-paths.model';
import { AuthRouteData } from './auth-route-data.model';
import { DpopService } from './dpop.service';
import { LinkedIdentity } from './linked-identity.model';
import { LoginResult } from './login-result.model';
import { PasskeyUtilities } from './passkey.utilities';
import { PendingProviderLogin } from './pending-provider-login.model';
import { PkceUtilities } from './pkce.utilities';
import { SecondFactorPrompt } from './second-factor-prompt.service';
import { SecondFactor } from './second-factor.model';
import { SKIP_AUTH } from './skip-auth.provider';

const STORAGE_KEY: string = 'authData';
// in the sessionStorage: a login at a provider belongs to the tab that started it.
const PROVIDER_LOGIN_KEY: string = 'providerLogin';
const SECOND_FACTOR_REQUIRED: string = 'SecondFactorRequiredError';
const PASSWORD_CHANGE_REQUIRED: string = 'PasswordChangeRequiredError';

/**
 * The options of a request of the service itself.
 */
type OwnRequestOptions = {
    /**
     * Marks it for the authInterceptor to leave alone.
     */
    context: HttpContext,
    /**
     * Whether the browser sends the cookies, which a cookie login needs on another origin.
     */
    withCredentials: boolean,
    /**
     * The headers it sends.
     */
    headers: Record<string, string>
};

/**
 * Logs the user in and out at zibri, keeps the login of this browser and tells what the user may do. Extend it with
 * the roles and permissions of your app, and set it up with provideAuth:
 * `@Service() export class AppAuthService extends AuthService<Role, Permission, PlatformPermission> {}`.
 */
export abstract class AuthService<
    Role extends string = string,
    Permission extends string = string,
    PlatformPermission extends string = string
> {
    /**
     * Where and how the app logs in.
     */
    protected readonly config: AuthConfig = inject(AUTH_CONFIG);

    private readonly http: HttpClient = inject(HttpClient);

    private readonly router: Router = inject(Router);

    private readonly injector: Injector = inject(Injector);

    private readonly document: Document = inject(DOCUMENT);

    private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

    private readonly data: WritableSignal<AuthData<Role, Permission, PlatformPermission> | undefined> = signal(this.findStoredData());

    // only in memory, as zibri recommends: a reload gets it again from the server, which needs the cookies.
    private csrfToken: string | undefined;

    // requests that find the access token running out at the same time share one refresh: a second one would spend
    // the refresh token the first one already spent.
    private refreshing: Promise<void> | undefined;

    /**
     * The login of this browser, or undefined while nobody is logged in.
     */
    readonly authData: Signal<AuthData<Role, Permission, PlatformPermission> | undefined> = this.data.asReadonly();

    /**
     * Whether somebody is logged in.
     */
    readonly loggedIn: Signal<boolean> = computed(() => this.data() != undefined);

    /**
     * The roles of the logged in user. Empty while nobody is logged in.
     */
    readonly roles: Signal<Role[]> = computed(() => this.data()?.roles ?? []);

    /**
     * The logged in user and what they may do in each of their tenants, as `GET /me` answered at the last login or
     * refresh. Undefined while nobody is logged in, or until it answered.
     */
    readonly currentUser: Signal<CurrentUserProfile<Permission, PlatformPermission> | undefined> = computed(() => this.data()?.user);

    /**
     * The tenant the user acts in: requests to the api name it, and hasPermission checks in it. Kept with the login,
     * and the same in every tab. A user with one membership and no platform permission acts in its tenant without
     * choosing it, and a tenant the user is no longer a member of is unset once `GET /me` answers so.
     */
    readonly activeTenantId: Signal<string | undefined> = computed(() => this.data()?.activeTenantId);

    constructor() {
        if (!this.isBrowser) {
            return;
        }
        const listeners: AbortController = new AbortController();
        inject(DestroyRef).onDestroy(() => listeners.abort());
        // another tab logged in, out or refreshed the tokens. A refresh token it spent is spent for this tab as well.
        window.addEventListener(
            'storage',
            event => {
                if (event.key === STORAGE_KEY) {
                    this.data.set(this.findStoredData());
                }
            },
            { signal: listeners.signal }
        );
    }

    /**
     * Logs the user in.
     * @param credentials - What the authenticator takes, like `{ email, password }`.
     * @param authenticator - The name of the authenticator, like 'password'.
     * @returns Whether the user is logged in, or what the login waits for.
     */
    async login(credentials: object, authenticator: string = 'password'): Promise<LoginResult> {
        return await this.resolveLoginStep(this.http.post<JwtAuthData<Role> | CookieAuthData<Role>>(
            this.resolveUrl('login', { authenticator, strategy: this.config.strategy }),
            credentials,
            this.resolveOwnOptions()
        ));
    }

    /**
     * Sends the code of a second factor while a login waits for it, like by email or text message.
     * @param ticket - The ticket of the login.
     * @param method - The name of the two factor method, like 'email'.
     */
    async requestSecondFactorAtLogin(ticket: string, method: string): Promise<void> {
        await firstValueFrom(this.http.post(
            this.resolveUrl('loginSecondFactorRequest', { method }),
            undefined,
            this.resolveOwnOptions({ [this.config.headers.loginTicket]: ticket })
        ));
    }

    /**
     * Continues a login with its second factor.
     * @param ticket - The ticket of the login.
     * @param secondFactor - The second factor the user presented.
     * @returns Whether the user is logged in, or what the login waits for next.
     */
    async confirmSecondFactorAtLogin(ticket: string, secondFactor: SecondFactor): Promise<LoginResult> {
        return await this.resolveLoginStep(this.http.post<JwtAuthData<Role> | CookieAuthData<Role>>(
            this.resolveUrl('loginSecondFactorConfirm', { strategy: this.config.strategy }),
            undefined,
            this.resolveOwnOptions({
                [this.config.headers.loginTicket]: ticket,
                [this.getSecondFactorHeader(secondFactor.method)]: secondFactor.code
            })
        ));
    }

    /**
     * Continues a login that waits for a new password.
     * @param ticket - The ticket of the login.
     * @param newPassword - The new password.
     * @returns Whether the user is logged in.
     */
    async changePasswordAtLogin(ticket: string, newPassword: string): Promise<LoginResult> {
        return await this.resolveLoginStep(this.http.post<JwtAuthData<Role> | CookieAuthData<Role>>(
            this.resolveUrl('loginChangePassword', { strategy: this.config.strategy }),
            { newPassword },
            this.resolveOwnOptions({ [this.config.headers.loginTicket]: ticket })
        ));
    }

    /**
     * Logs out at zibri and on this browser, and sends the user to the afterLogout route, or to the provider the login
     * was started at, which ends its login too. Asks beforeLogout of the config first, which may keep the user logged in.
     */
    async logout(): Promise<void> {
        const data: AuthData<Role, Permission, PlatformPermission> | undefined = this.data();
        if (data != undefined) {
            const consent: boolean | Promise<boolean> = runInInjectionContext(this.injector, this.config.beforeLogout);
            // awaited only when it asks somebody: without that, the login is gone as soon as logout is called
            if (!(typeof consent === 'boolean' ? consent : await consent)) {
                return;
            }
        }
        // the browser forgets the login first: it is gone here, whatever the server answers
        this.writeData(undefined);
        if (data != undefined) {
            await runInInjectionContext(this.injector, this.config.onLogout);
            try {
                const result: LogoutResult = await firstValueFrom(this.http.post<LogoutResult>(
                    this.resolveUrl('logout', { strategy: data.strategy }),
                    data.strategy === 'jwt' ? { refreshToken: data.refreshToken.value } : { clearCookies: true },
                    this.resolveOwnOptions()
                ));
                if (result.providerLogoutUrl != undefined) {
                    this.document.location.assign(result.providerLogoutUrl);
                    return;
                }
            }
            catch {
                // the login ends when its tokens or cookies run out, which nobody holds anymore
            }
            // only now: the request that ended the login proved the key as well
            await this.forgetDpopKey();
        }
        await this.router.navigateByUrl(this.config.routes.afterLogout);
    }

    /**
     * Forgets the login of this browser without asking the server, like when the server refused it, and sends the user
     * to the login route.
     */
    async forgetLogin(): Promise<void> {
        const hadLogin: boolean = this.data() != undefined;
        this.writeData(undefined);
        if (hadLogin) {
            await runInInjectionContext(this.injector, this.config.onLogout);
            await this.forgetDpopKey();
        }
        await this.router.navigateByUrl(this.config.routes.login);
    }

    /**
     * Gets new tokens, or renews the session of a cookie login. Several calls at once share one request. Rejects with
     * the answer of the server when it refused, like for a login that ended elsewhere.
     */
    async refreshLogin(): Promise<void> {
        this.refreshing ??= this.sendSharedRefreshLogin();
        await this.refreshing;
    }

    /**
     * Loads the logged in user and what they may do again, like after the app changed their roles. A login and a
     * refresh load it by themselves.
     * @returns The user, or undefined while nobody is logged in.
     */
    async reloadCurrentUser(): Promise<CurrentUserProfile<Permission, PlatformPermission> | undefined> {
        // an access token that runs out soon is refreshed first
        await this.resolveAccessToken();
        await this.sendCurrentUserRequest();
        return this.currentUser();
    }

    /**
     * Sets the tenant the user acts in. Does nothing while nobody is logged in.
     * @param tenantId - The id of the tenant, or undefined to act in none.
     */
    setActiveTenant(tenantId: string | undefined): void {
        const data: AuthData<Role, Permission, PlatformPermission> | undefined = this.data();
        if (data != undefined) {
            this.writeData({ ...data, activeTenantId: tenantId });
        }
    }

    /**
     * Whether the logged in user may do something in a tenant, like `@Auth.hasPermission` of zibri checks it. Answers
     * from what `GET /me` answered, false until it did.
     * @param permission - The permission.
     * @param tenantId - The tenant, the active one by default.
     * @returns Whether a role of their membership in the tenant carries it.
     */
    hasPermission(permission: Permission, tenantId: string | undefined = this.activeTenantId()): boolean {
        return this.currentUser()?.memberships
            .find(membership => membership.tenantId === tenantId)
            ?.permissions
            .includes(permission) === true;
    }

    /**
     * Whether the logged in user may do something by their own roles, like `@Auth.hasPlatformPermission` of zibri
     * checks it. Answers from what `GET /me` answered, false until it did.
     * @param permission - The permission.
     * @returns Whether one of their roles carries it.
     */
    hasPlatformPermission(permission: PlatformPermission): boolean {
        return this.currentUser()?.platformPermissions.includes(permission) === true;
    }

    /**
     * Whether the logged in user may do something either in a tenant or by their own roles, like
     * `@Auth.hasAnyLevelPermission` of zibri checks it. Without a tenant, only the platform permission counts. Answers
     * from what `GET /me` answered, false until it did.
     * @param anyLevelPermission - The permission in the tenant and the one by their own roles, either of which is enough.
     * @param tenantId - The tenant, the active one by default.
     * @returns Whether a role of their membership in the tenant carries the permission, or one of their own roles the
     * platform permission.
     */
    hasAnyLevelPermission(
        anyLevelPermission: AnyLevelPermission<Permission, PlatformPermission>,
        tenantId: string | undefined = this.activeTenantId()
    ): boolean {
        return this.hasPermission(anyLevelPermission.permission, tenantId)
            || this.hasPlatformPermission(anyLevelPermission.platformPermission);
    }

    /**
     * Whether the logged in user has every permission the AuthRouteData of a route names, as the permissionGuard checks
     * them, like to show a link only to those who may open it. Answers from what `GET /me` answered.
     * @param data - The data of the route.
     * @param route - The route, for a `tenantId` of the data that is a function of it. Without it, such a route is
     * checked in the active tenant.
     * @returns Whether the user has all of them, true for data that names none.
     */
    hasRoutePermissions(data: AuthRouteData<Permission, PlatformPermission>, route?: ActivatedRouteSnapshot): boolean {
        // undefined checks in the active tenant, as the default of each check
        const tenantId: string | undefined = typeof data.tenantId === 'function'
            ? route == undefined ? undefined : data.tenantId(route)
            : data.tenantId;
        return (data.permission == undefined || this.hasPermission(data.permission, tenantId))
            && (data.platformPermission == undefined || this.hasPlatformPermission(data.platformPermission))
            && (data.anyLevelPermission == undefined || this.hasAnyLevelPermission(data.anyLevelPermission, tenantId));
    }

    /**
     * Mails a link to set a new password. Answers the same whether the address has an account or not.
     * @param email - The email of the account.
     */
    async requestPasswordReset(email: string): Promise<void> {
        await firstValueFrom(this.http.post(this.resolveUrl('requestPasswordReset'), { email }, this.resolveOwnOptions()));
    }

    /**
     * Resolves whether the token of a password reset link still works.
     * @param resetToken - The token of the link.
     * @returns Whether it works.
     */
    async verifyPasswordResetToken(resetToken: string): Promise<boolean> {
        const validity: PasswordResetTokenValidity = await firstValueFrom(this.http.post<PasswordResetTokenValidity>(
            this.resolveUrl('verifyPasswordResetToken'),
            { resetToken },
            this.resolveOwnOptions()
        ));
        return validity.isValid;
    }

    /**
     * Sets a new password with the token of a password reset link. Ends every login of the user.
     * @param resetToken - The token of the link.
     * @param newPassword - The new password.
     */
    async confirmPasswordReset(resetToken: string, newPassword: string): Promise<void> {
        await firstValueFrom(this.http.post(
            this.resolveUrl('confirmPasswordReset'),
            { resetToken, newPassword },
            this.resolveOwnOptions()
        ));
    }

    /**
     * Resolves whether the token of the link of an invitation still works, and how the invitation is accepted. Zibri
     * finds the invitation by its token in every tenant, so the request names none.
     * @param token - The token of the link.
     * @returns Whether it works, whether a new link was mailed for an expired one, and for a link that works the invited
     * email, its tenant, whether accepting needs a login and whether it may be declined.
     */
    async verifyInvitationToken(token: string): Promise<InvitationTokenValidity> {
        return await firstValueFrom(this.http.post<InvitationTokenValidity>(
            this.resolveUrl('verifyInvitationToken'),
            { token },
            this.resolveOwnOptions()
        ));
    }

    /**
     * Accepts an invitation with the token of its link: with the password of the account it creates, or, for an email
     * with an account already, with the login of that account, which has to be logged in.
     * @param token - The token of the link.
     * @param password - The password of the account the invitation creates, when its validity doesn't require a login.
     */
    async acceptInvitation(token: string, password?: string): Promise<void> {
        const input: AcceptInvitationInput = { token, password };
        // past the interceptor like every request of an invitation's link: it names no tenant, and a link zibri refuses
        // with a 401 ends no login. Accepting as an account of its own reads the login, which is added here instead.
        const headers: Record<string, string> = password == undefined ? await this.resolveLoginHeaders() : {};
        await firstValueFrom(this.http.post(this.resolveUrl('acceptInvitation'), input, this.resolveOwnOptions(headers)));
    }

    /**
     * Declines an invitation with the token of its link, when its validity says it may be declined.
     * @param token - The token of the link.
     */
    async declineInvitation(token: string): Promise<void> {
        await firstValueFrom(this.http.post(this.resolveUrl('declineInvitation'), { token }, this.resolveOwnOptions()));
    }

    /**
     * Changes the password of the logged in user. Ends every other login of the user.
     * @param currentPassword - The password the user has.
     * @param newPassword - The new password.
     */
    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await firstValueFrom(this.http.post(this.resolveUrl('changePassword'), { currentPassword, newPassword }));
    }

    /**
     * Resolves the two factor methods the logged in user has enrolled.
     * @returns Their names, like 'otp'.
     */
    async resolveTwoFactorMethods(): Promise<string[]> {
        const registrations: TwoFactorRegistrations = await firstValueFrom(
            this.http.get<TwoFactorRegistrations>(this.resolveUrl('twoFactorRegistrations'))
        );
        return registrations.methods;
    }

    /**
     * Starts the enrollment of a two factor method for the logged in user. Zibri asks for their second factor when
     * they have one, which the interceptor asks the user for.
     * @param method - The name of the method, like 'otp'.
     * @param data - What the method starts with, like the SmsRegistrationRequestData of 'sms'.
     * @returns What zibri answers, like the OtpRegistration of 'otp' or the RecoveryCodeRegistration of
     * 'recovery-code', or undefined for a method that sends a code.
     */
    async requestTwoFactorRegistration<Result>(method: string, data?: object): Promise<Result | undefined> {
        // through the interceptor, which adds the login and asks for the second factor zibri wants
        const url: string = this.resolveUrl('twoFactorRegistrationRequest', { method });
        return await this.sendTwoFactorRegistrationRequest<Result>(url, data, undefined);
    }

    /**
     * Completes the enrollment of a two factor method, after which it guards the user's account.
     * @param method - The name of the method, like 'otp'.
     * @param data - What confirms it, like the OtpRegistrationConfirmData of 'otp', or the CodeRegistrationConfirmData
     * of a method that sends a code and of 'recovery-code'.
     */
    async confirmTwoFactorRegistration(method: string, data: object): Promise<void> {
        await firstValueFrom(this.http.post(this.resolveUrl('twoFactorRegistrationConfirm', { method }), data));
    }

    /**
     * Removes an enrolled two factor method. Zibri asks for the second factor, which the interceptor asks the user for.
     * @param method - The name of the method, like 'otp'.
     */
    async removeTwoFactorRegistration(method: string): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.resolveUrl('twoFactorRegistration')}/${encodeURIComponent(method)}`));
    }

    /**
     * Starts the enrollment of the first two factor method of a login that waits for one, when the user has none.
     * @param ticket - The ticket of the login.
     * @param method - The name of the method, like 'otp'.
     * @param data - What the method starts with, like the SmsRegistrationRequestData of 'sms'.
     * @returns What zibri answers, like requestTwoFactorRegistration.
     */
    async requestTwoFactorRegistrationAtLogin<Result>(ticket: string, method: string, data?: object): Promise<Result | undefined> {
        return await this.sendTwoFactorRegistrationRequest<Result>(
            this.resolveUrl('loginTwoFactorRegistrationRequest', { method }),
            data,
            this.resolveOwnOptions({ [this.config.headers.loginTicket]: ticket })
        );
    }

    /**
     * Completes the enrollment of the first two factor method of a login that waits for one, which completes the login
     * as well: the code that turned the method on proves it.
     * @param ticket - The ticket of the login.
     * @param method - The name of the method, like 'otp'.
     * @param data - What confirms it, like confirmTwoFactorRegistration takes.
     * @returns Whether the user is logged in, or what the login waits for next, like a new password. An auth service of
     * the app's own in zibri may only enroll the method, and the login then waits for its next code.
     */
    async confirmTwoFactorRegistrationAtLogin(ticket: string, method: string, data: object): Promise<LoginResult> {
        return await this.resolveLoginStep(
            this.http.post<JwtAuthData<Role> | CookieAuthData<Role> | null>(
                this.resolveUrl('loginTwoFactorRegistrationConfirm', { strategy: this.config.strategy, method }),
                data,
                this.resolveOwnOptions({ [this.config.headers.loginTicket]: ticket })
            ),
            { type: 'secondFactorRequired', ticket, methods: [method] }
        );
    }

    /**
     * Sends the code of a second factor for a request that needs one, like by email or text message.
     * @param method - The name of the two factor method.
     */
    async requestSecondFactor(method: string): Promise<void> {
        await firstValueFrom(this.http.post(this.resolveUrl('secondFactorRequest', { method }), undefined));
    }

    /**
     * Logs the user in with a passkey of their device, which names the account, so the user types nothing.
     * @param authenticator - The name of the passkey authenticator of zibri.
     * @returns Whether the user is logged in, or what the login waits for.
     * @throws {DOMException} A NotAllowedError when the user cancelled, see PasskeyUtilities.isCancelled.
     */
    async loginWithPasskey(authenticator: string = 'passkey'): Promise<LoginResult> {
        const options: PublicKeyCredentialRequestOptionsJSON = await firstValueFrom(this.http.post<PublicKeyCredentialRequestOptionsJSON>(
            this.resolveUrl('loginOptions', { authenticator }),
            undefined,
            this.resolveOwnOptions()
        ));
        return await this.login({ response: await PasskeyUtilities.resolveAssertion(options) }, authenticator);
    }

    /**
     * Logs the user in with a passkey they pick in the autofill of an input with `autocomplete="username webauthn"`,
     * like the email of a login, once they pick one. Start it when the input shows, if
     * PasskeyUtilities.isAutofillAvailable, and abort it before anything else asks for a passkey, which the browser
     * refuses while it waits.
     * @param abortSignal - Aborts the waiting request.
     * @param authenticator - The name of the passkey authenticator of zibri.
     * @returns Whether the user is logged in, or what the login waits for.
     * @throws {DOMException} An AbortError once the signal aborted it, see PasskeyUtilities.isCancelled.
     */
    async loginWithPasskeyAutofill(abortSignal: AbortSignal, authenticator: string = 'passkey'): Promise<LoginResult> {
        const options: PublicKeyCredentialRequestOptionsJSON = await firstValueFrom(this.http.post<PublicKeyCredentialRequestOptionsJSON>(
            this.resolveUrl('loginOptions', { authenticator }),
            undefined,
            this.resolveOwnOptions()
        ));
        abortSignal.throwIfAborted();
        return await this.login({ response: await PasskeyUtilities.resolveAssertion(options, 'conditional', abortSignal) }, authenticator);
    }

    /**
     * Has the user present a passkey as their second factor, for a request that needs one or, with a ticket, for a
     * login that waits for one.
     * @param method - The name of the passkey two factor method.
     * @param ticket - The ticket of a login, or undefined for the logged in user.
     * @returns The second factor, to send with the request or confirmSecondFactorAtLogin.
     * @throws {DOMException} A NotAllowedError when the user cancelled, see PasskeyUtilities.isCancelled.
     */
    async resolvePasskeySecondFactor(method: string = 'passkey', ticket?: string): Promise<SecondFactor> {
        const options: PublicKeyCredentialRequestOptionsJSON = await firstValueFrom(ticket == undefined
            ? this.http.post<PublicKeyCredentialRequestOptionsJSON>(this.resolveUrl('secondFactorRequest', { method }), undefined)
            : this.http.post<PublicKeyCredentialRequestOptionsJSON>(
                this.resolveUrl('loginSecondFactorRequest', { method }),
                undefined,
                this.resolveOwnOptions({ [this.config.headers.loginTicket]: ticket })
            ));
        return { method, code: PasskeyUtilities.encodeSecondFactor(await PasskeyUtilities.resolveAssertion(options)) };
    }

    /**
     * Has the user create a passkey for a new account, which needs no password. Your own registration route of zibri
     * creates the user with the ticket and logs them in.
     * @param name - The name the device lists the account under, like the email the user registers with.
     * @param authenticator - The name of the passkey authenticator of zibri.
     * @returns The ticket of the registration.
     * @throws {DOMException} A NotAllowedError when the user cancelled, see PasskeyUtilities.isCancelled.
     */
    async resolvePasskeyRegistrationTicket(name: string, authenticator: string = 'passkey'): Promise<string> {
        const options: PublicKeyCredentialCreationOptionsJSON = await firstValueFrom(this.http.post<PublicKeyCredentialCreationOptionsJSON>(
            this.resolveUrl('registrationRequest', { authenticator }),
            { name },
            this.resolveOwnOptions()
        ));
        const registration: PasskeyTicketCredentials = await firstValueFrom(this.http.post<PasskeyTicketCredentials>(
            this.resolveUrl('registrationConfirm', { authenticator }),
            { response: await PasskeyUtilities.resolveAttestation(options) },
            this.resolveOwnOptions()
        ));
        return registration.ticket;
    }

    /**
     * Sends the browser to log in at a provider, like Google. The login is handed back by code: the browser lands on
     * redirectTo with a `code`, which completeProviderLogin logs in with, or on zibri's registrationUrl with a `ticket`
     * for a first login, or on its errorUrl with an `error`.
     * @param authenticator - The name of the authenticator of the provider, like 'google'.
     * @param redirectTo - Where the browser lands with the code, an absolute url that zibri allows.
     * @param returnUrl - Where the app goes once the user is logged in, like the page they wanted.
     * @param scopes - The scopes of the provider's apis to ask for as well, whose tokens zibri keeps for the user. Each
     * has to be one of the `apiScopes` of the authenticator.
     */
    async startProviderLogin(authenticator: string, redirectTo: string, returnUrl?: string, scopes: string[] = []): Promise<void> {
        this.document.location.assign(await this.resolveProviderLoginUrl(authenticator, redirectTo, returnUrl, scopes));
    }

    /**
     * Resolves where startProviderLogin sends the browser, and keeps the login in this tab.
     * @param authenticator - The name of the authenticator of the provider, like 'google'.
     * @param redirectTo - Where the browser lands with the code, an absolute url that zibri allows.
     * @param returnUrl - Where the app goes once the user is logged in, like the page they wanted.
     * @param scopes - The scopes of the provider's apis to ask for as well.
     * @returns The url of zibri that starts the login at the provider.
     */
    async resolveProviderLoginUrl(authenticator: string, redirectTo: string, returnUrl?: string, scopes: string[] = []): Promise<string> {
        // a verifier only this tab knows, so a code that lands in another browser logs nobody in
        const codeVerifier: string = PkceUtilities.createVerifier();
        const pending: PendingProviderLogin = { authenticator, codeVerifier, returnUrl };
        sessionStorage.setItem(PROVIDER_LOGIN_KEY, JSON.stringify(pending));
        const codeChallenge: string = await PkceUtilities.resolveChallenge(codeVerifier);
        // zibri takes the scopes separated by spaces, like OAuth does
        const query: Record<string, string> = scopes.length ? { scopes: scopes.join(' ') } : {};
        return this.resolveUrl('federatedLoginRequest', { authenticator, redirectTo, codeChallenge, ...query });
    }

    /**
     * Finds the login at a provider this tab started, like for the `codeVerifier` the registration of a first login
     * sends with its ticket.
     * @returns The login, or undefined when this tab started none.
     */
    findPendingProviderLogin(): PendingProviderLogin | undefined {
        if (!this.isBrowser) {
            return undefined;
        }
        const stored: string | null = sessionStorage.getItem(PROVIDER_LOGIN_KEY);
        if (stored == undefined) {
            return undefined;
        }
        try {
            return JSON.parse(stored) as PendingProviderLogin;
        }
        catch {
            return undefined;
        }
    }

    /**
     * Logs in with the code a provider login handed back, with the verifier of the login this tab started.
     * @param code - The `code` the browser landed with.
     * @returns Whether the user is logged in, or what the login waits for, like a second factor.
     * @throws {Error} When this tab started no login at a provider.
     */
    async completeProviderLogin(code: string): Promise<LoginResult> {
        const pending: PendingProviderLogin | undefined = this.findPendingProviderLogin();
        if (pending == undefined) {
            throw new Error('This tab started no login at a provider.');
        }
        // the code works once, so the login it started is over either way
        sessionStorage.removeItem(PROVIDER_LOGIN_KEY);
        return await this.login({ code, codeVerifier: pending.codeVerifier }, pending.authenticator);
    }

    /**
     * Sends the browser to a provider to connect it to the account of the logged in user. Zibri asks for their second
     * factor or a recent login first, which the interceptor asks the user for.
     * @param authenticator - The name of the authenticator of the provider, like 'google'.
     * @param redirectTo - Where the browser lands once it is connected, an absolute url that zibri allows.
     * @param forLogin - Whether the user logs in with it, or only grants access to the provider's apis.
     * @param scopes - The scopes of the provider's apis to ask for.
     */
    async startProviderLink(authenticator: string, redirectTo: string, forLogin: boolean = true, scopes?: string[]): Promise<void> {
        this.document.location.assign(await this.resolveProviderLinkUrl(authenticator, redirectTo, forLogin, scopes));
    }

    /**
     * Resolves where startProviderLink sends the browser.
     * @param authenticator - The name of the authenticator of the provider, like 'google'.
     * @param redirectTo - Where the browser lands once it is connected, an absolute url that zibri allows.
     * @param forLogin - Whether the user logs in with it, or only grants access to the provider's apis.
     * @param scopes - The scopes of the provider's apis to ask for.
     * @returns The url at the provider, which is good once and for a short time.
     */
    async resolveProviderLinkUrl(authenticator: string, redirectTo: string, forLogin: boolean = true, scopes?: string[]): Promise<string> {
        const start: FederatedLinkIdentityStart = await firstValueFrom(this.http.post<FederatedLinkIdentityStart>(
            this.resolveUrl('linkIdentityRequest', { authenticator }),
            { redirectTo, forLogin, scopes }
        ));
        return start.url;
    }

    /**
     * Has the user create a passkey that logs in to their account. Zibri asks for their second factor or a recent login
     * first, which the interceptor asks the user for.
     * @param name - The name the device lists the account under, like the email of the user.
     * @param authenticator - The name of the passkey authenticator of zibri.
     * @throws {DOMException} A NotAllowedError when the user cancelled, see PasskeyUtilities.isCancelled.
     */
    async addPasskey(name: string, authenticator: string = 'passkey'): Promise<void> {
        const options: PublicKeyCredentialCreationOptionsJSON = await firstValueFrom(this.http.post<PublicKeyCredentialCreationOptionsJSON>(
            this.resolveUrl('linkIdentityRequest', { authenticator }),
            { name }
        ));
        const response: RegistrationResponseJSON = await PasskeyUtilities.resolveAttestation(options);
        await firstValueFrom(this.http.post(this.resolveUrl('linkIdentityConfirm', { authenticator }), { response }));
    }

    /**
     * Resolves the identities linked to the logged in user: their accounts at providers, and their passkeys.
     * @returns The identities.
     */
    async resolveIdentities(): Promise<LinkedIdentity[]> {
        return await firstValueFrom(this.http.get<LinkedIdentity[]>(this.resolveUrl('identities')));
    }

    /**
     * Unlinks an identity from the logged in user, like an account at a provider or a passkey. Zibri asks for their
     * second factor or a recent login first, which the interceptor asks the user for.
     * @param identityId - The id of the identity.
     */
    async unlinkIdentity(identityId: string): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.resolveUrl('identities')}/${encodeURIComponent(identityId)}`));
    }

    /**
     * Resolves where the logged in user is logged in, the most recently used first.
     * @returns The logins, the one of this browser marked current.
     */
    async resolveLogins(): Promise<UserLogin[]> {
        return await firstValueFrom(this.http.get<UserLogin[]>(this.resolveUrl('logins')));
    }

    /**
     * Ends one login of the logged in user, like on a device that went missing. Ending the current one logs this
     * browser out as well.
     * @param login - The login.
     */
    async endLogin(login: UserLogin): Promise<void> {
        await firstValueFrom(this.http.delete(`${this.resolveUrl('logins')}/${encodeURIComponent(login.id)}`));
        if (login.current) {
            await this.forgetLogin();
        }
    }

    /**
     * Mails the logged in user a link to verify their email. While an earlier link still works, zibri mails nothing.
     */
    async requestEmailVerification(): Promise<void> {
        await firstValueFrom(this.http.post(this.resolveUrl('requestEmailVerification'), undefined));
    }

    /**
     * Mails a link to the email the logged in user wants to change to, and to their current one when the
     * previousAddressConfirms of zibri asks it to approve. First, zibri asks for the second factor or a recent login,
     * which the interceptor asks the user for. The email stays until the links were followed.
     * @param newEmail - The email to change to.
     */
    async requestEmailChange(newEmail: string): Promise<void> {
        await firstValueFrom(this.http.post(this.resolveUrl('requestEmailChange'), { newEmail }));
    }

    /**
     * Confirms the link of an email, whatever it is for: verifying the email, or a change of it. Loads the user again
     * when they are logged in in this browser, whose email may have changed.
     * @param token - The token of the link.
     * @returns What the link was for, and whether that is done.
     */
    async confirmEmail(token: string): Promise<EmailConfirmation> {
        const confirmation: EmailConfirmation = await firstValueFrom(this.http.post<EmailConfirmation>(
            this.resolveUrl('confirmEmail'),
            { token },
            this.resolveOwnOptions()
        ));
        if (this.loggedIn()) {
            await this.reloadCurrentUserQuietly();
        }
        return confirmation;
    }

    /**
     * Ends every login of the logged in user, the one of this browser too, and sends the user to afterLogout. Asks
     * beforeLogout of the config first, which may keep the user logged in.
     */
    async logoutEverywhere(): Promise<void> {
        if (!await runInInjectionContext(this.injector, this.config.beforeLogout)) {
            return;
        }
        await firstValueFrom(this.http.post(this.resolveUrl('logoutEverywhere'), undefined));
        this.writeData(undefined);
        await runInInjectionContext(this.injector, this.config.onLogout);
        await this.forgetDpopKey();
        await this.router.navigateByUrl(this.config.routes.afterLogout);
    }

    /**
     * Asks the user for a second factor with the secondFactorPrompt of the config.
     * @returns The second factor, or undefined when the user cancelled or no prompt is configured.
     */
    async resolveSecondFactor(): Promise<SecondFactor | undefined> {
        if (this.config.secondFactorPrompt == undefined) {
            return undefined;
        }
        const promptClass: Type<SecondFactorPrompt> = await this.config.secondFactorPrompt();
        const methods: string[] = await this.resolveTwoFactorMethods();
        return await this.injector.get(promptClass).resolveSecondFactor(methods);
    }

    /**
     * Gets the header a two factor method reads its code from.
     * @param method - The name of the method, like 'otp'.
     * @returns The name of the header.
     * @throws {Error} For a method the config has no header for.
     */
    getSecondFactorHeader(method: string): string {
        const header: string | undefined = this.config.headers.secondFactors[method];
        if (header == undefined) {
            throw new Error(`There is no header for the two factor method "${method}". `
                + 'Add it to headers.secondFactors of provideAuth.');
        }
        return header;
    }

    /**
     * Whether a request goes to one of the origins of the config, which get the login.
     * @param url - The url of the request.
     * @returns Whether it gets the login.
     */
    isApiRequest(url: string): boolean {
        if (!this.isBrowser) {
            return false;
        }
        const origins: string[] = this.config.origins.length
            ? this.config.origins
            : [new URL(this.config.apiUrl, this.document.baseURI).origin];
        return origins.includes(new URL(url, this.document.baseURI).origin);
    }

    /**
     * Resolves the access token of a jwt login, refreshed first when it runs out soon.
     * @returns The token, or undefined while nobody is logged in with a jwt.
     */
    async resolveAccessToken(): Promise<string | undefined> {
        const data: AuthData<Role, Permission, PlatformPermission> | undefined = this.data();
        if (data?.strategy !== 'jwt') {
            return undefined;
        }
        if (Date.parse(data.accessToken.expirationDate) - this.config.refreshBeforeExpiryInMs <= Date.now()) {
            await this.refreshLogin();
        }
        const refreshed: AuthData<Role, Permission, PlatformPermission> | undefined = this.data();
        return refreshed?.strategy === 'jwt' ? refreshed.accessToken.value : undefined;
    }

    /**
     * Resolves the csrf token of a cookie login, from the server when this browser doesn't hold it, like after a
     * reload.
     * @returns The token, or undefined while nobody is logged in with cookies.
     */
    async resolveCsrfToken(): Promise<string | undefined> {
        if (this.data()?.strategy !== 'cookie') {
            return undefined;
        }
        if (this.csrfToken == undefined) {
            const response: CsrfToken = await firstValueFrom(this.http.get<CsrfToken>(
                this.resolveUrl('csrfToken', { strategy: 'cookie' }),
                this.resolveOwnOptions()
            ));
            this.csrfToken = response.csrfToken;
        }
        return this.csrfToken;
    }

    /**
     * Keeps the csrf token a response of zibri renewed, which it does whenever it renews the session.
     * @param headers - The headers of the response.
     */
    readCsrfToken(headers: HttpHeaders): void {
        const token: string | null = headers.get(this.config.headers.csrfToken);
        if (token != undefined && this.data()?.strategy === 'cookie') {
            this.csrfToken = token;
        }
    }

    /**
     * Forgets the csrf token, so the next request gets the current one from the server.
     */
    discardCsrfToken(): void {
        this.csrfToken = undefined;
    }

    private async sendSharedRefreshLogin(): Promise<void> {
        try {
            await this.sendRefreshLogin();
        }
        finally {
            this.refreshing = undefined;
        }
    }

    private async sendRefreshLogin(): Promise<void> {
        const data: AuthData<Role, Permission, PlatformPermission> | undefined = this.data();
        if (data == undefined) {
            return;
        }
        const headers: Record<string, string> = {};
        if (data.strategy === 'cookie') {
            headers[this.config.headers.csrfToken] = await this.resolveCsrfToken() ?? '';
        }
        const refreshed: JwtAuthData<Role> | CookieAuthData<Role> = await firstValueFrom(this.http.post<
            JwtAuthData<Role> | CookieAuthData<Role>
        >(
            this.resolveUrl('refreshLogin', { strategy: data.strategy }),
            // a cookie refresh reads nothing, but needs a body
            data.strategy === 'jwt' ? { refreshToken: data.refreshToken.value } : {},
            this.resolveOwnOptions(headers)
        ));
        this.saveLogin(refreshed);
        // the requests that waited for the refresh go on without waiting for the user as well
        void this.reloadCurrentUserQuietly();
    }

    private async resolveLoginStep(
        request: Observable<JwtAuthData<Role> | CookieAuthData<Role> | null>,
        withoutAnswer?: LoginResult
    ): Promise<LoginResult> {
        try {
            // a route answering no login, which arrives as null, leaves the login waiting
            const data: JwtAuthData<Role> | CookieAuthData<Role> | null = await firstValueFrom(request);
            if (data == undefined) {
                if (withoutAnswer == undefined) {
                    throw new Error('zibri answered the login without its auth data.');
                }
                return withoutAnswer;
            }
            this.saveLogin(data);
        }
        catch (error) {
            const body: AuthErrorBody | undefined = AuthErrorUtilities.findErrorBody(error);
            if (body?.ticket != undefined && body.name === SECOND_FACTOR_REQUIRED) {
                return { type: 'secondFactorRequired', ticket: body.ticket, methods: body.methods ?? [] };
            }
            if (body?.ticket != undefined && body.name === PASSWORD_CHANGE_REQUIRED) {
                return { type: 'passwordChangeRequired', ticket: body.ticket };
            }
            throw error;
        }
        // the routes the app opens next check permissions
        await this.reloadCurrentUserQuietly();
        return { type: 'loggedIn' };
    }

    private saveLogin(data: JwtAuthData<Role> | CookieAuthData<Role>): void {
        const previous: AuthData<Role, Permission, PlatformPermission> | undefined = this.data();
        // a refresh, or the same user again: what they may do stays until GET /me answers anew
        const kept: Pick<AuthData<Role, Permission, PlatformPermission>, 'user' | 'activeTenantId'> = previous?.userId === data.userId
            ? { user: previous.user, activeTenantId: previous.activeTenantId }
            : {};
        if ('accessToken' in data) {
            this.writeData({
                ...kept,
                strategy: 'jwt',
                userId: data.userId,
                roles: data.roles,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
                expiresAt: data.refreshToken.expirationDate
            });
            return;
        }
        this.writeData({
            ...kept,
            strategy: 'cookie',
            userId: data.userId,
            roles: data.roles,
            expiresAt: data.refreshSessionExpirationDate
        });
        this.csrfToken = data.csrfToken;
    }

    private async sendTwoFactorRegistrationRequest<Result>(
        url: string,
        data: object | undefined,
        options: OwnRequestOptions | undefined
    ): Promise<Result | undefined> {
        // a method that sends a code answers with no body, which arrives as null
        const answer: Result | null = await firstValueFrom(this.http.post<Result | null>(url, data ?? {}, options));
        return answer ?? undefined;
    }

    private async sendCurrentUserRequest(): Promise<void> {
        const data: AuthData<Role, Permission, PlatformPermission> | undefined = this.data();
        if (data == undefined) {
            return;
        }
        // past the interceptor, so a refused answer starts no refresh, which would load the user again
        const user: CurrentUserProfile<Permission, PlatformPermission> = await firstValueFrom(this.http.get<
            CurrentUserProfile<Permission, PlatformPermission>
        >(
            this.resolveUrl('currentUser'),
            this.resolveOwnOptions(data.strategy === 'jwt' ? { Authorization: `Bearer ${data.accessToken.value}` } : {})
        ));
        // the login may have ended or changed while the request was on its way
        const current: AuthData<Role, Permission, PlatformPermission> | undefined = this.data();
        if (current?.userId === user.id) {
            this.writeData({ ...current, user, activeTenantId: this.resolveActiveTenantId(current, user) });
        }
    }

    private resolveActiveTenantId(
        data: AuthData<Role, Permission, PlatformPermission>,
        user: CurrentUserProfile<Permission, PlatformPermission>
    ): string | undefined {
        const activeTenantId: string | undefined = data.activeTenantId;
        // the tenant goes only with a membership that is gone: a platform admin may act in one they were never a member of
        const lostMembership: boolean = data.user?.memberships.some(membership => membership.tenantId === activeTenantId) === true
            && !user.memberships.some(membership => membership.tenantId === activeTenantId);
        if (activeTenantId != undefined && !lostMembership) {
            return activeTenantId;
        }
        // GET /me lists only active memberships. With one and nothing to do without a tenant, there is nothing to choose.
        const [onlyMembership] = user.memberships;
        return user.memberships.length === 1 && !user.platformPermissions.length ? onlyMembership?.tenantId : undefined;
    }

    private async reloadCurrentUserQuietly(): Promise<void> {
        try {
            await this.sendCurrentUserRequest();
        }
        catch {
            // the login works without it: what the user may do stays as it was, and the permissionGuard asks again
        }
    }

    // the next login is bound to a new key, once the login of the old one ended.
    private async forgetDpopKey(): Promise<void> {
        if (this.config.dpop && this.isBrowser) {
            await this.injector.get(DpopService).forgetKey();
        }
    }

    private writeData(data: AuthData<Role, Permission, PlatformPermission> | undefined): void {
        this.data.set(data);
        if (data == undefined) {
            this.csrfToken = undefined;
        }
        if (!this.isBrowser) {
            return;
        }
        if (data == undefined) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }

    private findStoredData(): AuthData<Role, Permission, PlatformPermission> | undefined {
        if (!this.isBrowser) {
            return undefined;
        }
        const stored: string | null = localStorage.getItem(STORAGE_KEY);
        if (stored == undefined) {
            return undefined;
        }
        try {
            const data: AuthData<Role, Permission, PlatformPermission> = JSON.parse(stored) as typeof data;
            // a login nobody refreshed in time is over, whatever the browser kept of it
            return Date.parse(data.expiresAt) > Date.now() ? data : undefined;
        }
        catch {
            return undefined;
        }
    }

    private resolveUrl(path: keyof AuthPaths, query: Record<string, string> = {}): string {
        const search: string = new URLSearchParams(query).toString();
        const url: string = `${this.config.apiUrl}${this.config.paths[path]}`;
        return search ? `${url}?${search}` : url;
    }

    // what the interceptor adds of the login, for a request past it: the access token with the scheme of the login, or
    // the csrf token of the cookies, which every request that changes something sends. None while nobody is logged in.
    private async resolveLoginHeaders(): Promise<Record<string, string>> {
        const accessToken: string | undefined = await this.resolveAccessToken();
        if (accessToken != undefined) {
            return { Authorization: `${this.config.dpop ? 'DPoP' : 'Bearer'} ${accessToken}` };
        }
        const csrfToken: string | undefined = await this.resolveCsrfToken();
        return csrfToken == undefined ? {} : { [this.config.headers.csrfToken]: csrfToken };
    }

    private resolveOwnOptions(headers: Record<string, string> = {}): OwnRequestOptions {
        return { context: new HttpContext().set(SKIP_AUTH, true), withCredentials: this.config.strategy === 'cookie', headers };
    }
}