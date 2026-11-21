# ngx-auth
Logging in for Angular apps against the auth routes of [zibri](https://www.npmjs.com/package/zibri): passwords, a second factor, password resets, and staying logged in with tokens or with cookies. Guards protect routes by login and permission, and an interceptor sends the login with every request to your api and to nothing else.

Everything works with server-side rendering: on the server nobody is logged in, and nothing is stored or sent.

# Table of Contents
- [ngx-auth](#ngx-auth)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
- [Setup](#setup)
- [Logging in](#logging-in)
- [Staying logged in](#staying-logged-in)
  - [DPoP](#dpop)
- [Permissions and tenants](#permissions-and-tenants)
- [Protecting routes](#protecting-routes)
- [A second factor for a request](#a-second-factor-for-a-request)
- [Second factors](#second-factors)
- [Passkeys](#passkeys)
- [Providers](#providers)
- [Sessions and email](#sessions-and-email)
- [Passwords](#passwords)
- [Invitations](#invitations)
- [The pages](#the-pages)
  - [Translating](#translating)
- [Moving from ngx-material-auth](#moving-from-ngx-material-auth)
- [License](#license)

# Requirements
Angular 22 with the router and `@angular/localize`, which [translates the texts](#translating), and a backend with the `AuthController` of zibri 3.1 or later, 3.2 with `invitationRoutes: true` for [invitations](#invitations). What the routes answer and take, like `CurrentUserProfile`, `UserLogin` and `OtpRegistration`, comes from [zibri-contract](https://www.npmjs.com/package/zibri-contract), the package zibri declares it in.

```sh
npm install @service-soft/ngx-auth zibri-contract
ng add @angular/localize
```

[The pages](#the-pages) and [second factors](#second-factors) are built on [@service-soft/ui](https://www.npmjs.com/package/@service-soft/ui). The login and `@service-soft/ngx-auth/two-factor` draw the qr code of an authenticator app with [uqr](https://www.npmjs.com/package/uqr):

```sh
npm install @service-soft/ui uqr
```

# Setup
Extend `AuthService` with the roles and permissions of your app, which types everything that reads them. Like zibri, it tells the permissions of a tenant from the platform permissions of the user's own roles:

```ts
@Service()
export class AppAuthService extends AuthService<Role, Permission, PlatformPermission> {}
```

Set it up with where your `AuthController` is and how the browser stays logged in, and register the interceptor:

```ts
// app.config.ts
providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAuth(AppAuthService, { apiUrl: 'https://api.example.com/auth', strategy: 'cookie' })
]
```

| Option of `provideAuth` | Default |
|---|---|
| `apiUrl` | required — the url of the `AuthController` |
| `strategy` | required — `'cookie'` or `'jwt'`, see [staying logged in](#staying-logged-in) |
| `origins` | the origin of the `apiUrl` — the origins requests get the login for. Every other request goes without it, so no token reaches a third party |
| `routes` | `login: '/login'`, `afterLogin: '/'`, `afterLogout: '/login'`, `forbidden: '/'` — where the user is sent |
| `logoutStatuses` | `[401]` — statuses of a refused request that end the login of this browser, once a refresh didn't help |
| `refreshBeforeExpiryInMs` | 30 seconds — how long before the access token runs out it is refreshed |
| `secondFactorPrompt` | — what asks the user for a second factor, see [a second factor for a request](#a-second-factor-for-a-request) |
| `beforeLogout` | logs out — runs before `logout()` and `logoutEverywhere()`, see [logging out](#logging-in) |
| `onLogout` | nothing — runs whenever the login of this browser ends, see [logging out](#logging-in) |
| `paths`, `headers` | what zibri serves by default — change them when your app renamed routes or the headers of `ZIBRI_DI_TOKENS` |

# Logging in
`login` sends the credentials of an authenticator, the password by default. A login can wait for a step before it is done:

```ts
const result: LoginResult = await this.authService.login({ email, password });
switch (result.type) {
    case 'loggedIn':
        await this.router.navigateByUrl('/');
        break;
    case 'secondFactorRequired':
        // ask for a code of one of result.methods, then
        await this.authService.confirmSecondFactorAtLogin(result.ticket, { method: 'otp', code });
        break;
    case 'passwordChangeRequired':
        await this.authService.changePasswordAtLogin(result.ticket, newPassword);
        break;
}
```

Each step answers a `LoginResult` again, as a second factor can be followed by a new password. A ticket works for 5 minutes. For a code by email or text message, `requestSecondFactorAtLogin(ticket, method)` sends it first. Any other refusal, like a wrong password, rejects with the error of the request.

`logout()` ends the login at zibri and on this browser, and sends the user to `afterLogout`, or to the provider the login was started at, which ends its login too. `authData()`, `loggedIn()` and `roles()` are signals, and other tabs of the app follow a login or logout.

Two hooks of `provideAuth` run around it, in an injection context, so they can use `inject()`. `beforeLogout` runs before `logout()` and `logoutEverywhere()` while the user is still logged in, like to sync what they changed offline, and keeps them logged in when it answers `false`. `onLogout` runs once the login is gone, whenever it ends: at a logout, and when the server ended it. Like to delete what the app kept of the user:

```ts
provideAuth(AppAuthService, {
    apiUrl,
    strategy: 'jwt',
    beforeLogout: syncBeforeLogout,
    onLogout: () => inject(OfflineCacheService).clearCache()
})
```

`syncBeforeLogout` and `OfflineCacheService` are from [@service-soft/ngx-pwa](https://www.npmjs.com/package/@service-soft/ngx-pwa).

# Staying logged in
| Strategy | How |
|---|---|
| `'cookie'` | zibri keeps the login in httpOnly cookies, which scripts can't read. Every request that changes something sends the csrf token, which the interceptor keeps up to date from every response and fetches again after a reload. The safer choice for a website. On another origin, the api has to allow it in its CORS options with `credentials: true` |
| `'jwt'` | the browser keeps an access token and a refresh token in the `localStorage`, and sends the access token with every request. Refreshed before it runs out, once for all requests at the same time. For an app whose api can't share cookies with it |

A request zibri refuses with a `401` gets a refresh and is sent once more; when the refresh fails too, the login of this browser ends and the user goes to the login route. A refusal about a second factor or a code keeps the login. So does a refresh that doesn't reach the server, like offline, which fails without an answer or with the `504` of the service worker of Angular: the request goes on without the token that ran out and fails by itself, or is answered by an interceptor after `authInterceptor`, like the offline cache of [@service-soft/ngx-pwa](https://www.npmjs.com/package/@service-soft/ngx-pwa).

## DPoP
Tokens in the `localStorage` can be read by any script on the page. `provideAuth(MyAuthService, { apiUrl, strategy: 'jwt', dpop: true })` binds them to a key of the browser instead (DPoP, RFC 9449), so stolen tokens are of no use anywhere else:
- The key is a WebCrypto ECDSA P-256 key that can't be exported, kept in IndexedDB, so a reload and the other tabs keep the login. Scripts can sign with it while they run on the page, but can't read it or take it elsewhere. Without IndexedDB, it lasts as long as the page. A new login gets a new key.
- Every request to zibri, the login and refresh included, carries a `DPoP` proof of its method and url, signed with the key, and the access token goes with the `DPoP` scheme instead of `Bearer`.
- When zibri wants a nonce (`ZIBRI_DI_TOKENS.DPOP_NONCES`), it refuses the proof with `use_dpop_nonce` and a new nonce, and the request is sent once more with it; later proofs carry the last nonce zibri answered.

zibri binds a login to the key its request proves, and with `requireDpop` of its jwt strategy refuses one without. DPoP needs the `jwt` strategy, as cookies are bound to the browser already, and a secure context (https or localhost), the only place browsers offer WebCrypto.

# Permissions and tenants
A login loads what the user may do from `GET /me` of zibri: the platform permissions of their own roles, and each tenant they are a member of with its permissions. It is kept with the login, so a reload asks nothing, and loaded again with every refresh. `reloadCurrentUser()` loads it right away, like after your app changed the user's roles. `currentUser()` is a signal of it.

```ts
this.authService.setActiveTenant(tenant.id);
this.authService.hasPermission('invoices.export');              // in the active tenant
this.authService.hasPermission('invoices.export', otherTenantId); // in another one
this.authService.hasPlatformPermission('tenants.create');        // by the user's own roles
this.authService.hasAnyLevelPermission({ permission: 'members.read', platformPermission: 'users.read' }); // either
```

`hasPermission`, `hasPlatformPermission` and `hasAnyLevelPermission` check like `@Auth.hasPermission`, `@Auth.hasPlatformPermission` and `@Auth.hasAnyLevelPermission` of zibri, and answer at once. `hasAnyLevelPermission` passes with the permission in the active tenant (or the one given) or with the platform permission, like a page a tenant admin sees for their members and a platform admin for every user; without a tenant, only the platform permission counts. The active tenant is kept with the login, the same in every tab, and every request to your api sends it as `x-tenant-id`, which zibri reads the tenant of a request from. A request that sets the header itself keeps its own.

A user with exactly one membership and no platform permission has nothing to choose: once `GET /me` answered, they act in that tenant. When it answers that the membership of the active tenant is gone, the tenant is unset. A tenant the user was never a member of, like one a platform admin picked, stays.

# Protecting routes
```ts
type AppRoute = Route & { data?: AuthRouteData<Permission, PlatformPermission> };

const routes: AppRoute[] = [
    { path: 'login', component: LoginComponent, canActivate: [notLoggedInGuard] },
    { path: 'account', component: AccountComponent, canActivate: [loggedInGuard] },
    { path: 'export', component: ExportComponent, canActivate: [permissionGuard], data: { permission: 'invoices.export' } },
    {
        path: 'tenants/:tenantId/export',
        component: ExportComponent,
        canActivate: [permissionGuard],
        data: { permission: 'invoices.export', tenantId: route => route.paramMap.get('tenantId') ?? undefined }
    },
    { path: 'tenants/new', component: NewTenantComponent, canActivate: [permissionGuard], data: { platformPermission: 'tenants.create' } },
    {
        path: 'users',
        component: UsersComponent,
        canActivate: [permissionGuard],
        data: { anyLevelPermission: { permission: 'members.read', platformPermission: 'users.read' } }
    }
];
```

A user who isn't logged in goes to the login route, with the page they wanted as `returnUrl`. A logged in user without the permission goes to `forbidden` and stays logged in. `AuthRouteData` types what the `permissionGuard` reads: a `permission` in the active tenant or the `tenantId` of the route, a `platformPermission`, and an `anyLevelPermission`, which passes with either of its two. With several of them, the user needs all; with none, nobody opens the route. Combine it with the data of other libraries, like `NavRoute<NavRouteData & AuthRouteData<Permission, PlatformPermission>>` of [@service-soft/ngx-navigation](https://www.npmjs.com/package/@service-soft/ngx-navigation), which types the data of the children of a route as well. zibri checks every request again, so the guards only keep users from pages they can't use. On the server, which knows no login, the guards let every route render: render protected routes on the client.

`hasRoutePermissions(data)` checks the same as the guard, and is true for data that names no permission, so the navigation can show a link only to those who may open it. With [@service-soft/ngx-navigation](https://www.npmjs.com/package/@service-soft/ngx-navigation), every link to a route of the app then follows the data of its route:

```ts
provideNavigationConfig({ routeCondition: route => inject(AuthService).hasRoutePermissions(route.data ?? {}) })
```

A link knows no parameters of the url, so a `tenantId` that is a function of the route is checked in the active tenant.

# A second factor for a request
zibri asks for a second factor on routes guarded by `@Auth.require2fa`. The interceptor asks the user for one with the `secondFactorPrompt` and sends the request once more with it:

```ts
provideAuth(AppAuthService, {
    apiUrl: 'https://api.example.com/auth',
    strategy: 'cookie',
    secondFactorPrompt: () => import('@service-soft/ngx-auth/two-factor').then(m => m.TwoFactorDialogPrompt)
})
```

`TwoFactorDialogPrompt` asks in a dialog, and sends the code of a method like email when the user picks it. For a ui of your own, extend `SecondFactorPrompt`. It is told the methods the user has enrolled.

# Second factors
`@service-soft/ngx-auth/two-factor` enrolls the methods of zibri: an authenticator app with its qr code, codes by email or text message, and recovery codes to save.

| Export | Does |
|---|---|
| `TwoFactorSettingsComponent` | The methods of the logged in user, for the page of their account: which ones are on, setting one up, new recovery codes, and turning one off after asking. zibri wants the second factor or a recent login to change them, which the `secondFactorPrompt` asks for. Its heading is a `h2` |
| `TwoFactorEnrollmentComponent` | Enrolls one method, `<ngx-two-factor-enrollment method="otp" (enrolled)="...">`, for a page of your own |
| `TwoFactorDialogPrompt` | Asks for a second factor in a dialog, see [a second factor for a request](#a-second-factor-for-a-request) |
| `SecondFactorFormComponent` | The form of a code, in `@service-soft/ngx-auth/second-factor`, which the dialog and the login use |

When `twoFactorAtLogin` of zibri is `'required'`, the `LoginComponent` has a user without a second factor enroll one, and the code that turns it on completes the login. Recovery codes aren't offered as the first one. With an auth service of your own in zibri that lacks `completeLoginAfterTwoFactorEnrollment`, the login asks for the next code instead.

The methods are configured once for all of these, with `provideSecondFactorConfig`: their texts, whether they confirm with a code or a passkey, whether zibri sends their code, and how they are enrolled. `provideTwoFactorConfig` changes the texts of the dialog, the enrollment and the settings. In code, `requestTwoFactorRegistration`, `confirmTwoFactorRegistration` and `removeTwoFactorRegistration` of the `AuthService` do the same, and their `AtLogin` versions take the ticket of a login.

# Passkeys
The passkeys of zibri work with the WebAuthn api of the browser, without a library:

| Where | How |
|---|---|
| Logging in | `provideLoginConfig({ passkeyAuthenticator: 'passkey' })` shows a button that logs in with a passkey of the device, for zibri's `PasskeyAuthenticator`, and offers the passkeys in the autofill of the email as well, where the browser supports it. In code, `loginWithPasskey()` and `loginWithPasskeyAutofill(signal)` |
| As a second factor | zibri's `PasskeyTwoFactorMethod` is a method like the others: the login, the dialog and the settings offer it, enroll it and present it. In code, `resolvePasskeySecondFactor(method, ticket?)` |
| A new account | `resolvePasskeyRegistrationTicket(name)` creates the passkey and answers the ticket your own registration route of zibri creates the user with |

The device only creates or uses a passkey right after the user pressed something, so every one of these starts from a button, except the autofill: there the email input has `autocomplete="username webauthn"`, and the login waits for the passkey the user picks in the list of the browser below it (`PasskeyUtilities.isAutofillAvailable()` says whether the browser has one). It stops waiting before the button or a password asks, since the browser refuses a second request while one waits. A user who cancels sees no message: `PasskeyUtilities.isCancelled(error)` tells that apart in your own code. A passkey enrolled as a second factor is listed under the email of the logged in user, or the `passkeyName` of the `TwoFactorEnrollmentComponent`.

# Providers
A login at a provider of zibri, like Google, is always handed back by code with PKCE, which works with both strategies: the browser keeps a verifier in the `sessionStorage` of its tab, and the code is only good with it.

```ts
provideLoginConfig({ providers: [{ authenticator: 'google', label: 'Log in with Google' }] })
```

The `LoginComponent` shows a button for each, sends the browser to the provider, and completes the login when the browser comes back to it with the code, through the steps of a second factor or a new password like any login, and on to the page the user wanted. In the `FEDERATION_OPTIONS` of zibri:

| Option | Set it to |
|---|---|
| `allowedRedirects` | the url of the login route, and of the page of the `IdentitiesComponent` |
| `errorUrl` | the route of the `ProviderErrorComponent` of `@service-soft/ngx-auth/provider-error`, which says what went wrong by the `error` zibri adds |
| `registrationUrl` | your own registration page for a first login, which sends the `ticket` and `findPendingProviderLogin()?.codeVerifier` to your registration route |

`IdentitiesComponent` of `@service-soft/ngx-auth/identities` lists the ways to log in of the logged in user besides their password: the providers they connected and their passkeys. It connects a provider, adds a passkey, and removes one after asking, configured with `provideIdentitiesConfig({ providers, passkeyAuthenticator })`. Its heading is a `h2`.

The apis of a provider, like the calendar of the user, need scopes the user grants, among the `apiScopes` of the authenticator in zibri, which keeps the tokens for the identity. `apiScopes` of a provider of the login or of the identities asks for them on every login or connection. `apiAccess` of a provider of the identities asks for them later: `{ authenticator: 'google', name: 'Google', apiAccess: [{ label: 'Allow access to your calendar', scopes: [calendarScope] }] }` shows a button in the row of a connected Google that hasn't granted all of them, which connects it again with the scopes it has and those, keeping whether the user logs in with it. In code, `startProviderLogin`, `completeProviderLogin`, `startProviderLink`, `addPasskey`, `resolveIdentities` and `unlinkIdentity` of the `AuthService` do the same, and `resolveProviderLoginUrl` and `resolveProviderLinkUrl` answer the urls without sending the browser there.

# Sessions and email
For the page of the account, each with a `h2` heading:

| Component | Does |
|---|---|
| `SessionsComponent` of `@service-soft/ngx-auth/sessions` | Where the user is logged in, the most recently used first: their browser, when and from where. Logs out one, like a device that went missing, or every one after asking, this browser too |
| `EmailSettingsComponent` of `@service-soft/ngx-auth/email` | The email of the user, whether it is verified and a link to verify it, and changing it, which zibri mails a link for. zibri asks for the second factor or a recent login first |

The links of these emails open `ConfirmEmailComponent` of `@service-soft/ngx-auth/confirm-email`, at the `confirmEmailUrl` of zibri's `EMAIL_VERIFICATION_OPTIONS`, which adds the token as the last segment: `{ path: 'verify-email/:token', component: ConfirmEmailComponent }`. With `previousAddressConfirms`, a change waits for the link to the previous email as well, which the page says. In code, `resolveLogins`, `endLogin`, `logoutEverywhere`, `requestEmailVerification`, `requestEmailChange` and `confirmEmail` of the `AuthService` do the same.

# Passwords
`requestPasswordReset(email)` mails a link, `verifyPasswordResetToken(token)` says whether its token still works, and `confirmPasswordReset(token, newPassword)` sets the new password. `changePassword(currentPassword, newPassword)` changes the password of the logged in user.

# Invitations
With `invitationRoutes: true` of the `AuthController` of zibri 3.2, zibri mails invitations to an app or to a tenant, whose link is answered here:

| Method | Does |
|---|---|
| `verifyInvitationToken(token)` | Answers an `InvitationTokenValidity`: whether the link works, whether a new one was mailed for one that ran out, and for a link that works the invited email, its tenant, whether accepting needs a login (`requiresLogin`) and whether it may be declined (`declinable`) |
| `acceptInvitation(token, password?)` | Accepts with the password of the account the invitation creates, or, without one, as the logged in account of the invited email |
| `declineInvitation(token)` | Declines it, which needs no login |

zibri finds an invitation by its token in every tenant, so the requests name none, and a link zibri refuses ends no login. The [`AcceptInvitationComponent`](#the-pages) does all of it.

# The pages
Ready pages for these, built on [@service-soft/ui](https://www.npmjs.com/package/@service-soft/ui), each in its own entry point, so an app only loads the ones it uses:

```ts
const routes: Routes = [
    { path: 'login', loadComponent: () => import('@service-soft/ngx-auth/login').then(m => m.LoginComponent), canActivate: [notLoggedInGuard] },
    {
        path: 'request-password-reset',
        loadComponent: () => import('@service-soft/ngx-auth/request-password-reset').then(m => m.RequestPasswordResetComponent)
    },
    {
        path: 'reset-password/:token',
        loadComponent: () => import('@service-soft/ngx-auth/confirm-password-reset').then(m => m.ConfirmPasswordResetComponent)
    },
    // no guard: accepting works logged out and logged in
    {
        path: 'accept-invitation/:token',
        loadComponent: () => import('@service-soft/ngx-auth/accept-invitation').then(m => m.AcceptInvitationComponent)
    }
];
```

| Component | Does |
|---|---|
| `LoginComponent` | The email and password, then the code of a second factor, the first second factor of a user who has none, or a new password, when the login waits for one. Codes by email or text message are sent when the user picks the method, and once more on request. Opens the `returnUrl` the `loggedInGuard` adds, or `afterLogin` |
| `RequestPasswordResetComponent` | Has zibri mail a link to reset the password |
| `ConfirmPasswordResetComponent` | The page of that link: zibri adds the token to its `CONFIRM_PASSWORD_RESET_URL` as the last segment, so set that to the url of this route, like `https://app.example.com/reset-password`. Checks the link in the browser, and offers a new one when it doesn't work anymore |
| `ChangePasswordComponent` | The current and a new password, for the page of the user's account, with a `h2` heading |
| `AcceptInvitationComponent` | The page of the link of an [invitation](#invitations): zibri adds the token to the `acceptInvitationUrl` of its `INVITATION_OPTIONS` as the last segment, so set that to the url of this route, like `https://app.example.com/accept-invitation`. Checks the link in the browser, and says when it doesn't work, and when a new one was mailed. An invitation that creates its account asks for its password, then links to the login. One to an email with an account links to the login while nobody is logged in, and back here once they are; offers logging out to another account; and accepts with one button as that account, which then acts in the tenant of the invitation. A decline button shows next to accepting when the invitation may be declined |

A refused attempt shows the message of zibri, in the language of the request, and keeps what the user typed. Each page has a `provideXConfig`, like `provideLoginConfig`, for its texts and options. Values you leave out keep their defaults, so a translation can change single labels:

| Option | Default |
|---|---|
| `labels` | English texts, see [translating](#translating). The texts of the second factor are those of `provideSecondFactorConfig`, see [second factors](#second-factors) |
| `requestPasswordResetRoute` of the login and the confirm page | `'/request-password-reset'`. Undefined hides the link of the login, for an app without passwords to reset |
| `newPasswordMinLength` | — the `minLength` of zibri's password policy, so the browser checks it before sending |

## Translating
The default texts are `$localize` with an id of their own, like `@@ngx-auth.login.title`, so `ng extract-i18n` puts them into the messages of your app, and you translate them like its own texts. The library needs `@angular/localize` for that, `ng add @angular/localize`, also in an app of one language. A build with `localize` fills the texts in, so no part of `@angular/localize` reaches the browser. The defaults are made once a config is injected, so translations an app loads at runtime with `loadTranslations` apply as well. A text of `provideXConfig` replaces the default in every language. So translate a default in your messages, and change it in the config only to say something else: a default the config replaces stays in your messages, though nothing shows it. The messages zibri refuses a request with come in the language of the request, from zibri.

# Moving from ngx-material-auth
- The package is `@service-soft/ngx-auth`, and it works with zibri instead of lbx-jwt: the routes, bodies and errors are zibri's.
- `JwtAuthService` with its generics and abstract urls is `AuthService<Role, Permission>`, which you extend only for the types. The urls are the `apiUrl` and `paths` of `provideAuth`, which also replaces `NGX_AUTH_SERVICE`.
- The `HttpErrorInterceptor`, `JwtInterceptor` and `TwoFactorInterceptor` are one `authInterceptor`. It shows no error dialog; that is up to your app. It logs out on `logoutStatuses`, `[401]` by default; the old one also logged out on `403`, which means a logged in user isn't allowed something.
- `NGX_JWT_INTERCEPTOR_ALLOWED_DOMAINS` is `origins`, which defaults to the origin of the `apiUrl`: the old interceptor sent the token to every domain unless they were set.
- `NGX_JWT_INTERCEPTOR_RESTRICTED_URLS` is gone: zibri says which requests need a second factor.
- `login` answers a `LoginResult` instead of opening a dialog for the second factor or the password change. `LoginComponent` shows both as steps of the page.
- `NgxMatAuthLoginComponent`, `NgxMatAuthRequestResetPasswordComponent` and `NgxMatAuthConfirmResetPasswordComponent` are `LoginComponent`, `RequestPasswordResetComponent` and `ConfirmPasswordResetComponent`, configured with their `provideXConfig` instead of inputs. They keep what the user typed after a refused attempt. `ChangePasswordComponent` is new.
- `authData` is a signal, the tokens' `expirationDate` is the ISO string zibri sends, and roles are their names. The cookie strategy is new.
- `JwtLoggedInGuard` and `JwtNotLoggedInGuard` are `loggedInGuard` and `notLoggedInGuard`; `NGX_GUARD_CONFIG` is the `routes` of `provideAuth`. They redirect instead of navigating. `JwtRoleGuard` and `JwtBelongsToGuard` are gone: `permissionGuard` checks what the roles allow, which zibri's routes check as well, and a user without it is no longer logged out. Tenants are new.
- `isResetTokenValid` is `verifyPasswordResetToken`, `requestResetPassword` is `requestPasswordReset`, and `confirmResetPassword(password, token)` is `confirmPasswordReset(token, password)`.

# License
MIT.