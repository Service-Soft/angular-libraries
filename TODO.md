# TODO

The plan for this repository, written so that a new session can pick up the work from here. Read it top to bottom,
then [CODE_STYLE.md](./CODE_STYLE.md) and [CONTRIBUTING.md](./CONTRIBUTING.md), before changing anything.

# Table of Contents
- [TODO](#todo)
- [Table of Contents](#table-of-contents)
- [The goal](#the-goal)
- [Decisions that are made](#decisions-that-are-made)
- [Where things stand](#where-things-stand)
- [Open decisions](#open-decisions)
- [Next: migrating the packages](#next-migrating-the-packages)
  - [Order](#order)
  - [Done: ngx-change-sets](#done-ngx-change-sets)
  - [Done: ngx-persistence-logger](#done-ngx-persistence-logger)
  - [Done: ngx-tracking](#done-ngx-tracking)
  - [Done: ngx-pwa](#done-ngx-pwa)
  - [In progress: ngx-auth](#in-progress-ngx-auth)
  - [How to migrate a package](#how-to-migrate-a-package)
  - [Publishing and moving a package to its new name](#publishing-and-moving-a-package-to-its-new-name)
- [Follow-ups for ui](#follow-ups-for-ui)
- [How to work here](#how-to-work-here)

# The goal
All Angular libraries of the author move into this one workspace and get rewritten on the way. They used to be
built on `@angular/material`; they will be built on a shared, Tailwind based design system instead:
`@service-soft/ui`, which lives in [projects/ui](./projects/ui).

The libraries are used on websites that depend on SEO, so **bundle size is the deciding requirement**: a consumer
only ships the code and the css of the components they actually use.

The old sources are next to this repository, in `../ngx-*` (see [Order](#order)). They show what each package has
to be able to do. Their code is not the reference for how to do it — this repository's conventions are.

# Decisions that are made
These were discussed at length. Don't reopen them without a new reason.

- **Every package is published under the `@service-soft` npm organisation.** The design system is
  `@service-soft/ui` (Angular project `ui`, selector prefix `ui-`). `testing` stays unscoped and
  `"private": true`: it is only used inside this repository and never published.
  Migrated packages drop `material-` and always keep `ngx-`, so every Angular package is named the same way:
  `@service-soft/ngx-change-sets`, `@service-soft/ngx-persistence-logger`. Their selector prefix is `ngx`. Every
  `package.json` sets
  `"publishConfig": { "access": "public" }`, because scoped packages are private by default.
- **Every component has its own secondary entry point**, like `@service-soft/ui/button`. Providers are
  tree-shakeable and nothing runs at import time.
- **Tailwind instead of `@angular/material`.** Libraries ship no prebuilt css. The consumer's Tailwind generates it:
  every library ships a `tailwind.css` with `@source "./fesm2022";`, exported under the `style` condition, and the
  consumer writes `@import "tailwindcss"; @import "@service-soft/ui"; @import "<library>";`. Scanning the whole
  package instead of only the imported entry points was a conscious trade-off; stripping unused css in a separate
  build step can come later.
- **One shared set of design tokens, defined only in ui's [theme.css](./projects/ui/theme.css).** No other library
  defines tokens with `@theme`, and the linter only allows classes that use ui's tokens, so two libraries can't drift
  apart (`primaryColor` against `colorPrimary`). Tokens are unprefixed and public api.
- **Dark mode lives in the tokens**: every color is `light-dark()`, following the operating system, with `.light` and
  `.dark` classes to override it. Components never use `dark:`.
- **Accessibility is a test, not a review**: every story passes AXE in Chromium in light and dark mode, the default
  colors pass WCAG AA (`testing/theme`), focus is visible, targets are at least 24px, text never gets
  clipped.
- **Behaviour comes from the browser first.** Native elements and apis — `<details>`, `<dialog>` with
  `showModal()`, popovers with CSS anchor positioning — before anything else. `@angular/aria` and `@angular/cdk` may
  be used where the browser has nothing, but they are allowed, not preferred. Neither is installed yet.
- **Forms stay native.** No `@angular/forms`, no Signal Forms. A control is a component with a `[(value)]` model
  around a native element, validated by the browser through native attributes, with `customValidation` for the
  rest. `ui-form` is a native form that only prevents the navigation and focuses the first invalid control. See the
  Angular section of [CODE_STYLE.md](./CODE_STYLE.md) for the rules.
- **One control per kind of value**, each in its own entry point (`@service-soft/ui/input-string`,
  `@service-soft/ui/input-number`, later `@service-soft/ui/input-date`, …), so a datepicker is only loaded where it
  is used.
- **Icons**: where the consumer decides the icon, like in a button, it is projected content. Where a component decides
  it, the component imports single icons from `@fortawesome/free-solid-svg-icons` and draws them with
  `<ui-icon>` — no Font Awesome components or svg core, whose runtime would load on every page.
- **Components are elements** (`<ui-dialog>`, `<ui-details>`, `<ui-icon>`, `<ui-menu-item>`) that render their native
  element inside. Only buttons and links (`button[ui-button]`, `a[ui-button]`) and directives that add behaviour to an
  element of the consumer (`button[uiMenuTrigger]`) keep attribute selectors. See the Angular section of
  [CODE_STYLE.md](./CODE_STYLE.md).
- **Every input with a default is configurable app-wide** through `provideXConfig`, merged with the parent injector.
- **Packages a library imports are peer dependencies**, like `@fortawesome/free-solid-svg-icons`: the app installs
  them once (npm does it by itself) and every library shares that copy. Optional where only the parts that need ui use
  them. Only `tslib` is a dependency.
- **What needs a backend matches [zibri](../zibri).** Endpoints, request and response bodies, headers, error bodies
  and the ways to authenticate follow what zibri provides, not the older backends (lbx-jwt, lbx-change-sets, the old
  logger api). Breaking the old contract is fine, the packages are renamed anyway; the migration note says what changed.
  This applies to packages that are already migrated as well: ngx-persistence-logger and ngx-change-sets have to be
  checked against zibri. Where zibri has no route, like for logs and change sets, which an app has to guard itself,
  the libraries match zibri's models and leave the urls to the app. Urls and features are configurable either way:
  a library can't know what an app uses.
- **Contract checks are type tests.** zibri is a dev dependency, used only with type imports in spec files, never in
  library code (its types would end up in the published declarations). The specs compare the json on the wire
  (`Date` becomes a string) in both directions, and assert first that the zibri type isn't `any`.

# Where things stand
- **Workspace**: linting with `@service-soft/eslint-config`, cspell, Storybook for ui, vitest. `npm run lint` and
  `npm test` both pass.
- **ui** ([README](./projects/ui/README.md)): theme tokens (colors with hover, pressed and tint states, scrim, type
  scale, fonts, elevation `shadow-1` to `shadow-5`, radii), `button` (with a `pressed` state for toggle buttons),
  `input-string` (a button that shows a password, `inputMode`), `input-number`, `form`, `icon`, `details`, `dialog`
  (with `DialogService`, `ConfirmDialogComponent`, `MessageDialogComponent` and `closeOnEscape`), `link` (`a[ui-link]`
  and `button[ui-link]`, appearances `inline`, `nav`, `plain`, and `block`), `component-map`, `drawer`,
  `breadcrumbs`, `menu` (with links and submenus), `pagination`, `popover` and `snackbar`.
- **ngx-change-sets** ([README](./projects/ngx-change-sets/README.md)): migrated from ngx-material-change-sets, with
  a migration note in its README, which is also its npm page. Not published yet.
- **ngx-persistence-logger** ([README](./projects/ngx-persistence-logger/README.md)): migrated from the old
  ngx-persistence-logger, the same way. Not published yet.
- **ngx-tracking** ([README](./projects/ngx-tracking/README.md)): migrated from ngx-material-tracking, the same way.
  Not published yet.
- **ngx-pwa** ([README](./projects/ngx-pwa/README.md)): migrated from the old ngx-pwa, the same way. Not published yet.
- **ngx-navigation** ([README](./projects/ngx-navigation/README.md)): migrated from ngx-material-navigation, the same
  way. Not published yet.
- **testing**: `ThemeUtilities.validateContrast`, which checks the contrast of a theme, and
  `DialogTestingUtilities.addModalDialogs`, which lets dialogs open in jsdom. Local only, never published.
- **showcase**: an app that consumes the built libraries from `node_modules`, exactly like an external project. It
  shows a read only `ngx-change-sets`, and `tests/styling.spec.ts` checks its css: the classes of a library built on
  ui, token overrides, and the css size per scan strategy. Its build prerenders `/website` (`outputMode: 'static'`,
  `@angular/ssr`), a page of the ui components whose content search engines read, and `tests/prerender.spec.ts` checks
  the html the server rendered; the other routes render in the browser from `index.csr.html`.
- **tests/**: workspace tests that build everything for real: styling and css size per scan strategy, tokens,
  contrast, the entry points of every build, AXE on every story, and browser tests of the form, the inputs, the
  dialog, the drawer, the breadcrumbs, the menu, the popover, the navbar, the change sets, the log history, the
  consent dialog and the offline status bar with the sync dialog.
- **One Storybook for every library**, in `projects/ui/.storybook`. Libraries built on ui compile against the built
  ui (their `tsconfig.lib.json` clears the `paths`), see [Adding a library](./CONTRIBUTING.md#adding-a-library).
- **Nothing is published yet.** The `@service-soft` organisation exists on npm.

# Open decisions
Ask the author before deciding these.

1. **Breaking changes.** Whether a migrated package keeps its public api where it is still good, and whether it gets a
   migration guide.
2. ~~Where shared input code lives~~: decided and done, see "ui/input" under "Next: ngx-entity".

# Next: migrating the packages

## Order
| Old package | New name | Components | Lines | Depends on |
|---|---|---|---|---|
| ngx-material-change-sets | `@service-soft/ngx-change-sets` — **done** | 2 | 0.9k | material |
| ngx-persistence-logger | `@service-soft/ngx-persistence-logger` — **done** | 1 | 0.7k | material, cdk, forms |
| ngx-material-tracking, with its started rewrite ngx-tracking | `@service-soft/ngx-tracking` — **done** | 4 | 2.1k | material, cdk |
| ngx-pwa | `@service-soft/ngx-pwa` — **done** | 4 | 1.0k | material, forms, service-worker |
| ngx-material-auth | `@service-soft/ngx-auth` — **done**, against zibri | 7 | 2.5k | material, cdk, forms |
| ngx-material-navigation | `@service-soft/ngx-navigation` — **done** | 18 | 1.8k | material, cdk, router |
| ngx-material-entity | `@service-soft/ngx-entity` — **done**, but files (zibri v4) and many-to-many | 38 | 18k | material, cdk, forms |

**ngx-material-entity** comes last, because it needs most of what the others add to ui (dialogs, tables, more
inputs).

## Done: ngx-change-sets
What the author decided, as an example of the questions the next packages raise:
- The backend calls stay in an abstract `ChangeSetService` with `HttpClient` and default urls, like before. Labels,
  formats and dialog texts moved to `provideChangeSetsConfig`.
- Expansion panels became `ui/details` (native `<details>`), the confirm dialog `ui/dialog` (native `<dialog>`,
  opened from code with `DialogService` or in the template), the menu `ui/menu` (native popover), the paginator a
  "show more" button that moves focus to the first new change set.
- Icons stayed: single Font Awesome icons through `ui/icon`.
- Fixed bugs of the old package: every string `new Date()` parses was shown as a date (`'1'`), `createdAt` was typed
  as `Date` though the api sends a string, and the author link was an interactive element inside the panel header.

Left for this package:
- The old showcase in `../ngx-material-change-sets` isn't migrated; the stories cover the same.
- The first release, with the [steps below](#publishing-and-moving-a-package-to-its-new-name).

## Done: ngx-persistence-logger
What the author decided:
- The logger is a concrete `LoggerService` configured with `provideLoggerConfig`, not an abstract class to extend.
  Its config is app-wide only, because the service lives in the root injector.
- Single calls (`logger.info('x')`) instead of the old `logger.info('x')()`. The double call existed so the console
  links to the caller; angular's source maps ignore-list `node_modules`, which does the same for the devtools.
- The `logger` entry point has no dependency on ui, since every page loads it; ui and Tailwind are optional peers.
- Levels are toggle buttons (`pressed` on `ui-button`), applications a custom dropdown on `ui/popover` with native
  checkboxes, configured with the `applications` input like before. The paginator is `ui/pagination` (pages from
  the backend, see step 6 of ngx-auth below).
- Fixed bugs of the old package: objects were logged as `[object Object]`, errors were sent as `{}` among the data,
  the search never matched upper case, the date format `'YYYY'` showed the week-based year, and the level filters
  were clickable divs that keyboards couldn't reach.

Left for this package:
- The old showcase in `../ngx-persistence-logger` isn't migrated; the stories cover the same.
- The first release, with the [steps below](#publishing-and-moving-a-package-to-its-new-name). The old package keeps
  its unscoped name `ngx-persistence-logger`, so step 2 and 3 apply to it as well.

## Done: ngx-tracking
`../ngx-tracking` (never published) was a started rewrite of `../ngx-material-tracking`, not a package of its own:
a copy without the Material dialog and snackbar. Both became `@service-soft/ngx-tracking`. What the author decided:
- The consent is a native modal `<dialog>` that escape doesn't close (`closeOnEscape` of `ui/dialog`), opened after
  the page rendered and loaded lazily through the `ui` option of `provideTrackingConsent`. The `consent` entry point
  has no dependency on ui.
- No close button: the old "X" allowed every tracking, and closing can't count as consent. Refusing looks as
  prominent as allowing.
- Choices apply when the user presses a button, not when a checkbox changes.
- A browser that sends Do Not Track or Global Privacy Control gets only what is required and a `ui/snackbar` notice.
- Choices are kept in the `localStorage` only, the cookie storage is gone. `gtag` and `fbq` are set up in TypeScript
  instead of inline scripts, so a content security policy needs no inline scripts for them.
- Fixed bugs of the old package: the Meta Pixel loaded its script on `trackEvent` without consent, Google Analytics
  sent the whole url as the path, `anonymize_ip` does nothing in Google Analytics 4, and every switch of the dialog had
  `aria-disabled="true"`.

- `GdprCategory.ENABLED_BY_DEFAULT` stays checked in the dialog before the user chose: it is meant for trackings
  that are close to technically necessary. The README says to use it only for those.

Left for this package:
- Revoking Google Tag Manager only takes effect on the next page load, its tags have no opt-out switch.
- The old showcase isn't migrated; the stories cover the same.
- The first release. Only ngx-material-tracking is on npm, so it is the one to deprecate.

## Done: ngx-pwa
What the author decided:
- Only requests marked with `OFFLINE_REQUEST_METADATA` are kept offline, which made the hard-coded list of auth urls
  unnecessary. A kept request is answered with a success (202) right away, so the app goes on as if the server had
  taken it.
- Config instead of subclasses: `OfflineService` is concrete, `providePushNotifications({ vapidPublicKey, enableUrl,
  disableUrl })`, and `provideUpdates()` starts listening by itself.
- A new version is offered in a modal dialog, like before: the `ConfirmDialogComponent` of `ui/dialog`, loaded with a
  dynamic import once a version is ready. The sync dialog is loaded the same way when the user opens it.

How it works now:
- Requests are plain json objects in the `localStorage` under `offlineRequests`, synced oldest first. A POST gets an id
  `offline-<uuid>`, which is replaced by the id of the server in the url and the body of every later request.
- The `offline` and `push-notifications` entry points have no dependency on ui.
- `displayValue` is plain text, which removed dompurify. lodash and uuid aren't needed: requests are copied as json,
  and ids come from `crypto.randomUUID()`.
- Fixed bugs of the old package: sync all sent the same request again and again (a DELETE forever), and a POST that got
  an id threw (`` `${this.cachedRequests}` `` is `[object Object]`), so it was restored and sent again. Dependencies in
  bodies were never found, `applyOfflineData` matched ids with `url.includes`, `hasNotificationsEnabled` returned
  `swPush.isEnabled`, and the icon buttons had no names.

- Changes the old version kept under `requests` in the `localStorage` are converted when the app starts
  (`LegacyCachedRequestUtilities`), only when the value has the old shape, since the key is a common word.
- The update dialog also asks to reload on `SwUpdate.unrecoverable`, with texts of its own.
- "Discard all" asks with ui's `ConfirmDialogComponent` on top of the sync dialog.

Left for this package:
- The reload after "Reload" in the update dialog isn't tested: jsdom can't reload, and the stories have no service
  worker.
- The old showcase and its api in `../ngx-pwa` aren't migrated; the stories cover the components.
- The first release. The old package keeps its unscoped name `ngx-pwa`, so step 2 and 3 apply to it as well.

## Done: ngx-auth
Left for later, decided with the author: passkeys in the email autofill (conditional mediation) — done:
`PasskeyUtilities.isAutofillAvailable` and `resolveAssertion(options, mediation, signal)`,
`AuthService.loginWithPasskeyAutofill(signal)`, the login waits with `autocomplete="username webauthn"` while the email
shows and aborts before the button, a password login or another step (a refused attempt waits again; `run` answers
whether the work ran through); `testing/passkey` has `autofill`, `isWaitingInAutofill` and `pickFromAutofill`.
Scopes for provider apis in the UI — done: `apiScopes` on the providers of the login (`scopes` query of
`resolveProviderLoginUrl`) and the identities component, and in the identities list a button for a connected provider
that lacks the scopes of an `apiAccess: [{ label, scopes }]`, which links again with its `grantedScopes` and those,
keeping `forLogin` (`LinkedIdentityDetails.grantedScopes`). The default `notForLogin` label was 'for its apps only',
now 'for its apis only' (confirmed with the author). DPoP for the jwt strategy — done, decided with the author: opt-in
`dpop: true` (`provideAuth` refuses it for cookies), `DpopService` with a non-extractable ECDSA P-256 key in
IndexedDB (localStorage can't hold a CryptoKey without exporting it; in memory without IndexedDB), forgotten when the
login ends. The `authInterceptor` signs every api request, its own included (`sendWithProof`: `htm`, `htu` without
query, `ath`, the last `DPoP-Nonce`), sends `Authorization: DPoP`, and resends once on `use_dpop_nonce`. Specs verify
the signature with the jwk of the proof; `tests/dpop.spec.ts` checks the stored key isn't exportable and survives a
reload, on the story `Auth/Login: With Dpop`. Found on the way: the key is forgotten only once a login ended
(`forgetLogin` with a login, after the request of `logout`, `logoutEverywhere`), not in `writeData`, which ran at the
start too and signed the logout with a new key; a database without the store is opened one version higher; WebCrypto
needs a secure context, so `StorybookUtilities` serves the stories at `https://storybook.test` (Playwright fulfils the
requests, no certificate) and `DpopService` says so outside one. The contract tests of `CurrentUserProfile`, `TwoFactorRegistrations`, `EmailConfirmation` and
`ErrorResponseBody` exist in zibri's `zibri-contract.test.ts` since the models moved to zibri-contract.

From `../ngx-material-auth`. A bigger rework than the others, because it has to work with the authenticators of zibri
(jwt and cookie auth, sso like login with Google, two factor, passkeys) instead of lbx-jwt. What the author decided:
- An `AuthService` the app extends only to fix its own types (auth data, roles), set up with `provideAuth(MyAuthService,
  { ... })`. The urls default to what zibri serves.
- The two factor code is one native input (`inputmode="numeric"`, `autocomplete="one-time-code"`), not six boxes.
- Passkeys use the browser's WebAuthn json apis (`PublicKeyCredential.parseCreationOptionsFromJSON`, `toJSON()`)
  instead of `@simplewebauthn/browser`.
- Which statuses log the user out is configurable, 401 by default (the old one also logged out on 403).
- Everything zibri offers, each configurable, because an app may use any of it: password login, reset and change,
  two factor (login continuation with the ticket, enrolling otp, email, sms and recovery codes, codes for protected
  requests), passkeys, login with providers (redirect with PKCE, callback, the error codes), the list of logins,
  logging out everywhere, email verification and changing the email.
- Both strategies, chosen in `provideAuth`: cookie (with the csrf token, read off every response) and jwt. DPoP later.
- The error dialog is not part of ngx-auth: a `MessageDialogComponent` in `ui/dialog`, and a new package
  `@service-soft/ngx-error-handling` with an http error interceptor and an `ErrorHandler` that read zibri's error body
  (`{ status, name, message, paragraphs, problems?, traceId? }`, already translated) and show it.

What zibri got for it, asked for by the author (in its working tree, not committed; typecheck and lint pass, the jest
tests weren't run, the sandbox can't write to zibri):
- `ErrorResponseBody` is exported.
- `GET /me` in the `AuthController` answers a `CurrentUserProfile`: id, email, `emailVerifiedAt`,
  `platformPermissions` and every active membership as `CurrentUserMembership` (`tenantId`, `permissions`), without
  roles and without the app's own fields of the user. Narrowed to the credential; a credential bound to a tenant
  answers only that membership. Resolved by `resolveCurrentMemberships` of `AuthServiceInterface` (optional until
  4.0). Every membership rather than the active tenant's, so the frontend stores it and switches tenants without a
  request (decided with the user).
- `GET /2fa/registrations` answers `TwoFactorRegistrations` (`{ methods: string[] }`).
- Checked whether the vague errors hide something on purpose. They don't, unlike `CredentialReusedError`, the password
  reset and the password lock, which explain why they hide. So:
  - `CsrfTokenRefusedError` answers under its own name, as `docs/auth/auth.md` already promised.
  - A request without its second factor answers `401` with the name `SecondFactorMissingError` (a subclass of
    `UnauthorizedError`), thrown by every method whose header is missing. A client asks for a code instead of
    refreshing.
- Docs fixed: `DELETE /auth/2fa/registration/{method}`, the list of rate limited routes, and the JSDoc of
  `ChangeSetRepository.rollbackToChangeSet` (the given change set is kept). New docs section "Checking permissions in a
  frontend" in `roles-and-permissions.md`; CHANGELOG 3.1.0 has the entries.
- ngx-auth types against these once a zibri release has them; until then its urls are configurable anyway.

Progress, in the order of the plan:
1. ui: a button that shows a password, `inputMode`, `MessageDialogComponent` — done.
2. The core in `@service-soft/ngx-auth/auth`, without ui — done: `AuthService` (login steps with tickets, logout,
   refresh shared between requests, roles, password reset and change, the login of other tabs), `authInterceptor`
   (the login only for `origins`, csrf token kept from every response and fetched again when refused, refresh and
   retry on a 401, a second factor through `SecondFactorPrompt`, the active tenant as `x-tenant-id`), and the guards
   `loggedInGuard`, `notLoggedInGuard`, `permissionGuard`. Permissions, decided with the user: no role guard and no
   `hasRole` (permissions decide, as in zibri); `hasPermission(permission, tenantId = active)` and
   `hasPlatformPermission` mirror zibri and answer synchronously from the `GET /me` profile, stored with the login
   with `activeTenantId`, loaded after a login (awaited) and a refresh (not awaited), and by `reloadCurrentUser()`;
   `permissionGuard` reads the exported `AuthRouteData` (`permission`, `platformPermission`, `tenantId` as a string
   or a function of the route). Type tests against zibri 3.0.1 in
   `zibri-contract.spec.ts`, with `Json` from `testing/contract`; `CurrentUserProfile` and `TwoFactorRegistrations`
   get theirs once a zibri release has them.
3. The forms — done, each in its own entry point with a `provideXConfig` (labels, options) and stories driven
   through a fake zibri (`HttpTestingUtilities.answerWith` of `testing/http`, filled in with `FormTestingUtilities`
   of `testing/form`): `login` (`LoginComponent`, h1; steps credentials → second factor / first enrollment → new
   password), `request-password-reset`,
   `confirm-password-reset` (token from the route param `token`, as zibri appends it to `CONFIRM_PASSWORD_RESET_URL`;
   verified after the first render, so only in the browser), `change-password` (h2, for an account page). Errors
   show zibri's translated `paragraphs` (`AuthErrorUtilities.findErrorParagraphs`, now public) in an
   always-rendered `role="alert"` with `empty:hidden`; a failed attempt keeps what the user typed.
4. In parts:
   a. Two factor — done. `AuthService` enrolls, confirms and removes methods, also `AtLogin` with a ticket (typed
      `OtpRegistration`, `RecoveryCodeRegistration`, `SmsRegistrationRequestData`, confirm data; contract tests).
      `second-factor`: `SecondFactorFormComponent` (code, method switch, emits `confirmed` and `codeRequested`; sends
      nothing itself) and `provideSecondFactorConfig` (method texts, `sendsCode`, `numeric`, `enrollment` kind) for
      every place. `two-factor`: `TwoFactorDialogPrompt` + dialog, `TwoFactorEnrollmentComponent` (qr code drawn from
      the `uqr` matrix as an svg with `scheme-light`, so it stays dark on light; optional peer of ngx-auth),
      `TwoFactorSettingsComponent` (h2). The login enrolls the first factor when zibri answers `methods: []`
      (`twoFactorAtLogin: 'required'`), without recovery codes; confirming it completes the login (zibri change:
      `/login/2fa/registration/confirm?strategy=` answers the auth data through the optional
      `completeLoginAfterTwoFactorEnrollment` of `AuthServiceInterface`; a 204 of an app's own auth service still
      leads to asking for the next code).
   b. Passkeys — done. Native WebAuthn JSON (`PublicKeyCredential.parse*FromJSON`, `toJSON()`, typed by TS 6's
      lib.dom) in `PasskeyUtilities` (assertion, attestation, base64url header, `isCancelled`). `AuthService`:
      `loginWithPasskey`, `resolvePasskeySecondFactor(method, ticket?)`, `resolvePasskeyRegistrationTicket(name)`.
      The second factor config has `confirmation: 'code' | 'passkey'` and the `passkey` method; the form shows a
      button and emits `passkeyRequested`; enrollment kind `passkey` fetches the options first, so the click calls
      the device right away (user activation). Login: `passkeyAuthenticator` (off by default). Cancelling shows
      nothing. `testing/passkey` fakes the device in jsdom. Not done: conditional mediation (passkeys offered in the
      email autofill), and adding a login passkey through link-identity, which belongs to identities (c).
   c. Login with providers, identities — done. Always PKCE (verifier in the sessionStorage of the tab, as
      `PendingProviderLogin` with the returnUrl), for both strategies, so the frontend gets the auth data from
      `POST /login`. The login route is the redirectTo and completes `?code=` itself (removes it from the url), so
      second factor and new password run through the same steps. `ProviderErrorComponent` (entry
      `provider-error`) is zibri's errorUrl, also for link errors of a logged in user. `IdentitiesComponent`
      (entry `identities`, h2): lists providers and passkeys, connects, adds a passkey (link-identity), removes after
      a confirm. `resolve…Url` versions exist because jsdom can't navigate away, and for links of an app's own.
      Not done: SAML/back-channel logout specifics (all server side), and scopes for provider apis in the UI.
   d. Sessions and email — done. `SessionsComponent` (entry `sessions`, h2; `UserLogin` with a contract test),
      `EmailSettingsComponent` (entry `email`, h2), `ConfirmEmailComponent` (entry `confirm-email`, the page of
      `confirmEmailUrl/:token`, confirmed after the first render). zibri change (decided with the user): every email
      link looked the same, so `POST /confirm-email` (optional `confirmEmail` of the service until 4.0) answers an
      `EmailConfirmation` `{ purpose, completed }`; and `previousAddressConfirms` (opt-in) has the previous address
      approve a change: a second link with purpose `change-approval`, followed links kept as `change-confirmed` /
      `change-approval-confirmed` in the existing purpose column, the change applies once both are confirmed and
      unexpired. `EmailConfirmation` gets a contract test once a zibri release has it.
5. `@service-soft/ngx-error-handling` — done. New library, wired like the others (angular.json, tsconfig paths and
   references, eslint ngx prefix, global setup build and link, entry points test, storybook). `error-response`
   (no ui): `ErrorResponseBody`, `ValidationProblem` (contract test; `ErrorResponseBody` gets one once a zibri
   release exports it), `ErrorResponseUtilities.findErrorResponseBody`. `error-handler` (no ui, decided with the
   user): Angular has one `ErrorHandler`, so `provideErrorHandler(...handlers)` replaces it with a pure wrapper (the
   user: no console output of its own) that runs every `ErrorHandlerFn` in an injection context, in order (a throwing
   handler is logged, the rest still run), and brings `provideBrowserGlobalErrorListeners`. `error-dialog`:
   `showDialogErrorHandler(config)` shows uncaught errors in ui's `MessageDialogComponent` (zibri's paragraphs,
   problems, trace id as a reference; offline for status 0; a generic text otherwise), one at a time, never on the
   server, 401 ignored by default, `isIgnored` for more. No interceptor: caught errors (like the forms' own) show
   nothing.
6. ngx-persistence-logger and ngx-change-sets against zibri's models — done. zibri has no routes for logs and change
   sets on purpose (an app decides who may see them), so nothing was added to zibri (the user: "that's the job of the
   zibri app"); the READMEs show the endpoints an app writes. Contract tests against zibri 3.0.1 for both
   (`Json` of `testing/contract` now maps `bigint` to string).
   - Logger, decided with the user: mirrors zibri's logger, `debug/info/warn(message, metadata?)`,
     `error/critical(error, metadata?)` (message from the error), numeric `LogLevel` 0–4 with `CRITICAL`. Sends a
     `NewLog`: `{ application, level, message, context: { origin, metadata, error: LoggedError } }`. `application` is
     a field of its own (zibri's `Log` has none, the app's log entity adds it); `origin` is the page path, as a bundle
     has no files. `LoggedErrorUtilities` mirrors `errorToLoggedError` (own or zibri `paragraphs`, causes; the stacks
     of the error and its causes only in `stackTrace`). zibri put the stack into the paragraphs too; fixed in zibri
     (unreleased, 3.1.0 changelog), its console transport prints `stackTrace` after the paragraphs.
     `logErrorHandler()` for `provideErrorHandler` replaces `provideLoggerErrorHandler`; it logs with `logger.error`
     (console and backend), and skips failed requests like before.
   - Log history: pages from the backend with the filters as query (`page`, `limit`, `levels`, `applications`,
     `search`; arrays as repeated params, as zibri reads them), `PaginationResult<Log>` newest first, `ui/pagination`
     instead of "show more" (the user asked for a real pagination). No selected level means every level, like the
     applications. Each entry shows its application (if any), origin, message or error paragraphs, metadata, stack.
     The search sends a request per keystroke (httpResource cancels the previous one); debounce it if that's too much.
   - Change sets: `createdAt` as nanoseconds in a string (sorted by `BigInt`, shown as its millisecond), `null`able
     `createdBy` and values, reset reads `entity` of zibri's `{ entity, changedValues }`, rollback keeps the change
     set it rolls back to (texts fixed, and no rollback to the newest one). `SoftDeleteEntity` with `deletedWith`
     replaces `ChangeSetSoftDeleteEntity`.

Bugs of the old package to fix: the token went to every domain unless allowed domains were set, the six-box code input
crashed once all boxes were filled, guards logged out users who only lacked a role, and the forms cleared or navigated
away after a failed attempt.

## Done: ngx-navigation
From `../ngx-material-navigation`. What the author decided:
- Config driven like before, but 7 element types instead of 13 (`title`, `image`, `link`, `button`, `menu`, `text`,
  `custom`; a link is `{ route }` or `{ url }`). Routes can still be defined in the elements:
  `NavigationUtilities.resolveRoutes({ navbarRows, footerRows, routes })`, fixed to drop duplicate paths.
- The sidenav is a modal drawer, the new `ui/drawer` (native `<dialog>`).
- ui gets only generic, router-free pieces: `ui/drawer`, links (`a[ui-menu-link]`) and submenus
  (`<ui-menu-item [submenu]>`, a `ui-menu` inside a `ui-menu`) in `ui/menu`, and `ui/breadcrumbs`. The rows with
  start/center/end, collapsing by breakpoint and the burger/drawer wiring are ngx-navigation's (the author: start/center/
  end is too restrictive for ui).

- **Bundle size, a general pattern (decided with the author, also for ngx-entity):** a component that renders data by
  type takes the components as a map input instead of importing them: `<ngx-navbar [rows]
  [components]="{ link: NavLinkComponent }">`, `Partial<NavElementComponents>`. Each type's component is its own entry
  point (`nav-title`, `nav-image`, `nav-link`, `nav-button`, `nav-menu`, `nav-text`), any component with the inputs of
  `NavElementRenderer` (`element`, `layout`) can replace one. Development builds throw for a used type without a
  component and for a component nothing uses (`ComponentMapUtilities.validate` of the new `ui/component-map`, guarded
  by `ngDevMode`). `tests/bundle.spec.ts` checks the production build of the showcase (a navbar with titles and links
  only): no image, menu, button or text component, and no messages of the check.

What it is now, one entry point each: `navigation` (models, `NavigationUtilities`, `NavigationService` with signals
`path`, `anchors`, `breadcrumbs`, `provideNavigationConfig`), `nav-element` (`NavElementComponent`, which takes the
component of the map and renders it with `NgComponentOutlet`; `NavRowComponent` for navbar and footer; `NavLabel` and
`NavAnchor`, shared by the type components), the six type components, `navbar`, `footer`, `anchors` (no longer a row
of the navbar, as it needs the link component whatever the rows have), `breadcrumbs`, `not-found`. Collapsing is pure css
(`hidden md:flex` / `md:hidden`, following the consumer's breakpoints); a `ResizeObserver` on the burger closes the
drawer once the burger is hidden. The drawer closes on every `NavigationEnd`. Breadcrumbs read each route's own
`routeConfig.data`, because the router hands the data of a componentless parent on to its children. Browser tests in
`tests/navbar.spec.ts`, `tests/drawer.spec.ts`, `tests/breadcrumbs.spec.ts`, `tests/menu.spec.ts`.

Found on the way: Chromium gives the focus back only when a popover that is in no other popover closes, so a submenu
closed with escape dropped the focus on the body. `MenuComponent` gives it back to the item that opened it.

Left for later: `../monux-cli` generates `navbarRows` with the old types and calls `getAngularRoutes`; it needs the new
api before it can use this package. A `custom` element inside a menu: done (it injects `MenuComponent` optionally to
show `ui-menu-item`s in the menu and plain controls in the drawer).

What the old package did:
- `NgxMatNavigationNavbarComponent` builds a toolbar from `NavbarRow[]`, each a list of `NavElement`s placed `left`,
  `center` or `right`, and a sidenav with a burger button. `collapse` (`sm`/`md`/`lg`/`always`/`never`, default `sm`)
  says below which width an element moves into the sidenav, through `BreakpointObserver` (768/992/1200 px). The app's
  content has to be projected into the navbar, which sizes it with `minHeight` inputs and `calc(100vh - …)`.
- 13 element types (`NavElementTypes`): title, image, each also with an internal or external link, internal link
  (route as a string or a whole `Route`, `fragment`), external link, button, flat button, menu (nested, cdk menu),
  text, custom (a component extending `NgxMatNavigationBaseNavElementComponent`). Each may have a `condition`, run
  in an injection context, evaluated on every change detection.
- `NavUtilities.getAngularRoutes(navbarRows, footerRows, additionalRoutes)` collects the routes defined inside the
  elements; `NavRoute` makes `title` and `path` required and types `data` (`anchors`, `breadcrumbConfig`,
  `pageNotFoundConfig`).
- `NgxMatNavigationService` (on every `NavigationEnd`): an extra toolbar row of the anchors of the current route, and
  breadcrumbs from `pathFromRoot` (name from `breadcrumbConfig.name`, a string or a function, else the title; a
  `parentRoute` inserted before).
- `NgxMatNavigationFooterComponent` (`FooterRow[]`, same positions, no collapse), `NgxMatNavigationBreadcrumbsComponent`,
  `NgxMatNavigationNotFoundComponent` (404 page, texts from an input or the route data).
- Bugs: `getAngularRoutes` never removes duplicate paths (the list it checks stays empty), and its README passes the
  extra routes as the footer rows; the sidenav is a positioned div without focus handling, so keyboard users tab
  through it while it is closed and behind it while it is open; menus need `DisableHoverDirective` against the cdk.
- Used by `../monux-cli`, which generates `navbarRows` and calls `getAngularRoutes`, so a changed api needs a change
  there too.

## Next: ngx-entity
From `../ngx-material-entity` (18k lines; read, nothing built yet, decisions pending). What the old package is:
- **Metadata:** property decorators (`@string`, `@number`, `@boolean`, `@date`, `@object`, `@array`, `@file`,
  `@referencesOne`, `@referencesMany`, `@hasMany`, `@custom`) with a `displayStyle` each, about 30 kinds in all
  (password with strength and confirmation, slider, chips, autocomplete, datetime, daterange, images…), stored with
  `reflect-metadata`. Base options: `displayName`, `display`, `required`, `isReadOnly`, `omitForCreate/Update`,
  `defaultWidths` (12 columns), `position { tab, tabName, row, order }`, `default`, `change`. Entities must be built
  with `new`; UI state is kept in metadata on the instance.
- **Components:** `ngx-mat-entity-input` (1600 lines) switches over the type in its template and imports all 24 input
  components statically, plus object, references, entity arrays and a whole has-many CRUD table inline. A form with
  tabs and rows, `ngx-mat-entity-table` (all client side: search, sort, paginator), create/edit dialogs and pages,
  JSON/CSV/XML export and JSON import, an `UnsavedChangesGuard`. Validation twice: `ngModel` attributes and
  `ValidationUtilities` (English texts).
- **EntityService:** POST (multipart with a `body` field when there are files), GET all with a 15 minute cache, GET
  `/:id`, PATCH with only the changed values, DELETE, POST `/import`.
- **Bugs:** has-many shares one cache across parents (wrong children for 15 minutes), `entities:id` route without
  slash, `findIndex` -1 unchecked (deletes the last cached entity), `entity.id` hard coded, size error dialogs read the
  mime type config, CSV export broken, number input blocks arrow keys and minus, hidden fields are never sent.
- **zibri:** `CrudController` = POST, GET `?page&limit` (`{ items, totalAmount }`, no filter/sort/search), GET/PATCH/
  DELETE `/:id` (uuid). The repository can filter, sort and search, an app has to expose it in its own route.
  Relations: writes can't carry relation properties (the FK column like `teamId` is sent instead), reads only fill
  `defaultRelations`, no nested routes. Files: multipart `FormData` DTO, the app stores the file. Problems have dot
  path keys (`tasks.3.title`). Decorators can't run in a browser (Node imports); OpenAPI inlines schemas but lacks
  relations and the dynamic rules.
- Used by `../monux-cli`, which generates an admin app with it (entities, a service, a table page, a change sets input).

Decided with the author:
- **Decorators in zibri's style**: `@Property.string({ … })` etc. with zibri's option names (minLength, regex, enum…)
  plus the UI ones; metadata kept per class, so plain JSON from the server works without `new`.
- **The 12-column grid stays** (`defaultWidths: [lg, md, sm]`, `position { tab, tabName, row, order }`).
- **Everything in the first version**: files and images, has-many and references-many, every field kind, import and
  export. Component map per field kind like ngx-navigation.
- **zibri `CrudController.findAll`** gets `order` and `filter`, typed config objects (see below).
  **No search**: left out on purpose, the author keeps it as a GitHub issue (a stored search string property was the
  idea; the open questions were recomputing it when its function changes and relations in it).

Order: zibri filter/order (done) → ui controls (extract `ui/input` first) → ngx-entity core (decorators, field map,
form, validation with zibri's problems, service, table using `FilterValue`/`OrderValue` from `zibri-contract`,
dialogs, pages, guard) → relations, files, the other kinds, import/export.

**zibri filter/order: done** (uncommitted in ../zibri, decided with the author). A config object typed against the
entity, like Mobene-Lib's `SearchableParamsConfig` but with the match checked against each property's type:
`{ title: 'iLike', priority: 'range', address: { city: 'equals' }, owner: { name: 'equals' }, tags: 'includes' } as
const satisfies FilterConfig<Task>`. Nested objects, not `'address.city'` paths. Matches: string equals/iLike/fuzzy/
oneOf, number and date equals/oneOf/range, boolean equals, array of values includes (all)/oneOf (any); objects, arrays
of objects (some item) and relations of any kind by a nested config. `FilterValue<Task, typeof config>` and
`OrderValue<Task, typeof config>` type what a client sends.
- `CrudControllerOptions.filter?: FilterConfig<T>`, `.order?: false | OrderConfig<T>`. Order by default: own plain
  properties and those inside objects; an `OrderConfig` names them, and reaches into to-one relations; arrays and
  to-many never. The key order of `?order=` is the sort priority (tested).
- `FilterUtilities.resolveFilterClass(config, entity)` builds and checks the validation class (each value keeps the
  format and enum of its property), `.resolveWhere(config, entity, filter)` the repository where. iLike is `%value%`
  with `%`/`_` escaped. `CrudControllerOrderUtilities.resolveOrderClass(entity, config)`.
- Repository: `EntityOrder` and `EntityOrderUtilities.resolveKeys` reach into object properties (new
  `findMetadataAt`, also used by fuzzy search); Postgres orders by a cast JSON path
  (`PostgresWhereFilterConverter.jsonValueExpression`), in memory and Valkey by the hydrated value. Keyset reads still
  take only own properties.
- Package `packages/contract` = `zibri-contract`, types only, exported from `zibri` as well (except `OrderDirection`,
  zibri has its own). It later also takes the shared request/response types (PaginationResult, ErrorResponseBody,
  CurrentUserProfile…). Registered in the release script, ci.yml, cd.yml, README, CONTRIBUTING, releases.md,
  CHANGELOG.
- Tests: `crud-controller.model.filter.test.ts`, `filter.utilities.test.ts`, `packages/contract/src/list.types.test.ts`,
  `data-source/tests/object-order.cases.ts` (+ `.test.ts` in memory, `.postgres-valkey.test.ts`), one more case in
  `text-order.cases.ts`. Docs: "Filtering and ordering a list" in `docs/endpoints/creating-endpoints.md`, a paragraph
  in `docs/data/data-source.md` "Filtering inside an object property", CHANGELOG 3.1.0. `Task` in the docs reader
  project got optional `priority`, `dueAt` and `labels`.
- **The author still has to:** run the Postgres/Valkey suites (`object-order.postgres-valkey.test.ts`,
  `text-order.postgres-valkey.test.ts`) and `docs-examples.test.ts`, which the sandbox can't; publish `zibri-contract`
  once by hand and set up trusted publishing for it (cd.yml refuses a package the registry has never seen). The
  emptied filter files are deleted and zibri is installed.

**Shared models moved to zibri-contract: done** (uncommitted in both repos, decided with the author: json shape in the
contract, checks in zibri, enums moved, everything at once).
- The contract holds the models as they arrive as json: `PaginationResult`, `ErrorResponseBody`/`ValidationProblem`,
  the auth answers and bodies (zibri's names: `Jwt`, `CsrfToken`, `FederatedLinkIdentityStart`,
  `PasskeyTicketCredentials`, plus `SecondFactorRequiredErrorBody`/`PasswordChangeRequiredErrorBody`), logs (full
  `LogContext` with request/cache/collapsed; http method, status and cache operation as plain string/number) and
  change sets. Enums `LogLevel` and `ChangeSetType` live there; zibri's `log-level.enum.ts` and
  `change-set-type.enum.ts` re-export them. The contract now builds commonjs (`dist`, for node) and es modules
  (`dist/esm`, `tsconfig.esm.json`, for bundlers) through the `node`/`default` export conditions.
- zibri: `src/zibri-contract.test.ts` compares `Json<ZibriModel>` with `Json<ContractModel>` through `Equals`
  (`src/__testing__/json.type.ts`, `equals.type.ts`; checked to fail on a missing, optional, wider or extra property),
  and checks the enums are the same objects. The two auth error bodies are typed by the contract where zibri builds
  them.
- angular-libraries: the copies and the four `zibri-contract.spec.ts` and `testing/contract` are deleted; every
  library, story, spec and the showcase imports from `zibri-contract`, nothing is re-exported. Kept as library types:
  `LinkedIdentity` (`ZibriLinkedIdentity<LinkedIdentityDetails>`), `NewLog` (`Pick` of the contract `Log` with a
  required `application`), `ChangeSetRequestBody`, `AuthData`, `AuthErrorBody`, `LoginResult`, `SecondFactor`,
  `PendingProviderLogin`. `Log` is the contract one: zibri's `Log` has `application?: string | null`, filled by the
  logger from `GlobalRegistry.getAppData('name')` (null only while no application runs, like the test harness logging
  before it creates one; that's why it isn't required). Takes a migration with `schemaManagement: 'migrations'`. The
  passkey ceremony types stay with the browser's WebAuthn types. `zibri-contract: ^3.1.0` is a peer of ngx-auth,
  ngx-change-sets, ngx-error-handling and ngx-persistence-logger; the root devDependency is
  `file:../zibri/packages/contract` until it is published (then `^3.1.0`), and `zibri` is no dev dependency any more
  (an eslint rule refuses importing it). READMEs name the package in their install line.
- Installed: `node_modules/zibri-contract` links to `../zibri/packages/contract` (build it there after a change; it
  needs a rebuild for `Log.application`).
  **After publishing**, switch the devDependency to `^3.1.0`.

**ui/input: done** (decided with the author: a base directive and a field component). `@service-soft/ui/input` holds
`BaseInputDirective<T>` (the shared inputs, ids, validation state, `setCustomValidity`, the error that keeps its
space, one id counter `ui-input-N` for every control; a control declares `value`, `validityErrors` and its own inputs,
and may override `resolveCustomError` and `resolveExtraClasses`), `InputFieldComponent` (`ui-input-field`, host
`contents`: label, a `relative` box around the projected native input, the message row; it takes an
`InputFieldState`, because a `ModelSignal<number | undefined>` isn't assignable to the directive of `unknown`),
`InputValidation<T>`, and the config, size and validity error types moved from input-string. input-string and
input-number extend it; `InputStringValidation`/`InputNumberValidation` stay as public aliases. README section "An
input of your own".

**ui controls, first batch: done.** Each its own entry point on `ui/input`, with spec, stories (AXE light and dark)
and a README section; screenshots of the stories checked by eye.
- `ui/input` grew: `BaseInputDirective<T, E extends NativeInputElement = HTMLInputElement>` (input, textarea or
  select); the background comes from the `readonly` input (`BACKGROUND_CLASSES`), not `read-only:`, which a select
  always matches; `InputUtilities.resolveLengthError` (shared by string and textarea); `ui-input-field` has
  `layout: 'stacked' | 'inline'` and `size` (inline: a grid `auto 1fr`, the label after the control with the height
  of an input of that size, hint and error in the column of the label; the control is projected once into an
  `ng-template`, a second `ng-content` would stay empty); config `textareaRows` (3) and `booleanAppearance`
  ('checkbox').
- `ui/input-textarea`: `rows`, `minLength`/`maxLength` (also checked for a text set from code), resizable in height.
- `ui/input-select`: `InputSelectComponent<T>` with `SelectOption<T>[]` (label, value, disabled), values of any type
  compared by identity (an option's value is its index), `placeholder` as the empty option, which a required select
  disables; read only disables every other option, since a native select ignores readonly.
- `ui/input-boolean`: a native checkbox, `appearance` `checkbox` or `switch` (`role="switch"`, an `appearance-none`
  track with a thumb span; thumb moves only `motion-safe`, borders for forced colors, rtl mirrored); `required` false
  by default (has to be checked); read only prevents the click and sets `aria-readonly`.
- Not done: the popover story, the log history filter and the consent dialog still style their own checkboxes. The
  log history filter and the popover story could use `ui-input-boolean`; the consent dialog needs `indeterminate`,
  which the control doesn't have yet. Values compared by identity in the select: add a `compareWith` once objects
  from the api need it.

**ui controls, second batch: done** (spec, stories, README; workspace tests and screenshots checked).
- `ui/input-date`: the native date input, `type` `date` or `datetime-local`, value `Date | undefined` in the time zone
  of the browser, `min`/`max` as dates; `InputDateUtilities.getNativeValue`/`findDate` convert by local parts
  (toISOString would shift the day). Writes the native value only when it is another date than typed, like number.
  Changed, decided with the author (an exception to "behaviour from the browser first" and "forms stay native"): the
  native picker looks different in every browser, and Firefox draws its button in a closed shadow root with its own
  tab stop, which no css hides. So it is a `type="text"` input in the format of `LOCALE_ID`
  (`InputDateUtilities.resolveFormat`, 2-digit day/month, latn digits) read by `findDateInText` (the numbers in the
  order of the format, AM/PM of the language, every part must survive the Date), with `badInput`/`rangeUnderflow`/
  `rangeOverflow` as custom errors; `required` stays native. `findDate` (native value → Date) went with it.
  Calendar: internal `ui-input-date-calendar` in a `popover="auto"` anchored to the input, opened by a button with
  `popovertarget`, rendered only while open; days in an `ngGrid` of `@angular/aria` (6 weeks, explicit selection, a
  day counts as chosen when the active cell changes its selection; `colWrap` is the axis of left/right).
  `datePickerLabel`, `previousMonthLabel`, `nextMonthLabel` and `firstDayOfWeek` (default Monday, as Intl.Locale's
  week info isn't in every browser) in `provideInputConfig`. Lost: the native pickers of phones and the segmented
  typing of the browser. Open: the arrow keys stop at the edges of the 6 weeks, PageUp/PageDown for months would need
  keyboard handling the grid doesn't have; a 2-digit year is no date.
- `ui/input-slider`: the native range input, value `number` (default 50), `min`/`max`/`step` bound before `value` (the
  browser clamps to the range it has), the number in an `aria-hidden` `<output>` next to the track; `required` false
  by default (it is never missing), no native validity errors, only `customValidation`.

**ui controls, third batch: done** (decided with the author: `@angular/aria`; a `StoredFile` in zibri-contract, the
app stores files).
- `SelectOption` moved to `ui/input` as `InputOption<T>` (select and autocomplete share it). `InputFileError` is
  `InputControlError` (`fileTooLarge`, `fileTypeMismatch`, `invalidFiles`, `optionNotChosen`), its messages are part of
  `errorMessages`. Config `chooseFileLabel`, `chooseFilesLabel`, `removeLabel` (file and chips).
- zibri-contract `StoredFile` (id, name, mimeType, size, url), no zibri model to check it against: zibri hands the app
  the upload, the app's routes answer with this.
- `ui/input-file`: a ui button opens a hidden native input (the native button is in the browser's language), value
  `(File | InputExistingFile)[]` (`InputExistingFile`: name, url, mimeType?, size?; ui doesn't depend on the
  contract, `StoredFile` fits it); `multiple` appends, otherwise replaces; required, `maxSize` and `accept`
  (`InputFileUtilities.isAccepted`) checked as the custom error, only for chosen files. Each file that is too large
  or of a wrong type is marked in the list (error border, its message below its name, wording for one file: "This
  file is too large."), the field says `invalidFiles` ("Remove the marked files, …"); asked for by the author, of
  twenty files the user has to see which. A list with sizes (`getReadableSize`, Intl units), image previews (object
  urls cached per file, revoked when removed or destroyed; a plain img, NgOptimizedImage refuses blob and data urls),
  remove buttons named "Remove" + the file name (+ its error) via `aria-describedby`. The entry is the internal
  `li[ui-input-file-entry]` (template complexity). No drag and drop yet.
- `@angular/aria@^22.2.5` is a dev dependency and an optional peer of ui; only `ui/input-autocomplete` imports it.
- `ui/input-autocomplete<T>`: `ngCombobox` on the input, `ngComboboxPopup` > `ngComboboxWidget ngListbox`
  (`focusMode="activedescendant"`, `selectionMode="explicit"`, `tabindex="-1"`, or Tab moves into the list and it
  never closes) > `ngOption`; filters options by label (contains, ignoring case; the label of the chosen option shows
  all), `query` model for backend search, choosing writes the label and closes, typing clears the value, a text that
  is no option is `optionNotChosen`. The combobox owns the `value` input of the element and never writes the text, so
  the component writes it (`afterRenderEffect`). Whether the list is open is the combobox's own `expanded` model
  (`viewChild(Combobox)`): it opens itself on every keystroke, and a binding only reaches it when the bound value
  changes, so an effect closes it on the directive while no option contains the text (else an empty box, and
  `aria-expanded` true). Browser test `tests/input-autocomplete.spec.ts` (keyboard, Escape, Tab, no empty list).
- `INPUT_POPUP_CLASSES` and `INPUT_OPTION_CLASSES` in `ui/input`, shared by autocomplete and chips (`group` on the
  option, for the check mark of chips).
- `ui/input-chips<T>`: value `T[]`, chips (internal `li[ui-input-chip]`, removable unless read only or disabled) above
  the combobox input, so the list opens right below it; `ngListbox multi`, selecting and deselecting keeps the list
  open and empties the text; a check mark (`group-aria-selected:visible`) and the weight show a chosen option.
  `customValue(text)` turns a text into a value on Enter while the list shows nothing (and prevents the form submit),
  values only once. The listbox only knows the values of the options it renders and drops the others, which would
  deselect every chosen value the text hides: it gets `shownValues`, and `choose` merges its answer (keeps hidden
  values, removes deselected, appends added; its echo on opening is ignored). Required means at least one value.
  Browser test `tests/input-chips.spec.ts`.

**ui/tabs: done.** `ui-tabs [(selected)]` with `ui-tab value label disabled` children (each hands its content to
ui-tabs as a template, host `hidden`); `ngTabs` > `ngTabList` (`button ngTab`) > `ngTabPanel` with `preserveContent`
and `[hidden]="!panel.visible()"` (aria only sets `inert`), so a hidden form keeps its values. While `selected` is
undefined the first enabled tab shows (`linkedSignal`). Selected: primary bar + weight, text stays on the checked
on-surface pairs; the list scrolls sideways. A disabled tab gets focus but no selection (aria's soft disabled, as the
APG allows), checked in `tests/tabs.spec.ts`. Not yet: vertical tabs; a form submitted with an invalid field in a
hidden tab doesn't switch to it (the browser can't focus it), ngx-entity has to do that.

**ui/table: done.** Decided: a native `<table>` (explicit roles, so it stays a table on a phone, where its parts are
blocks), columns from a config (`TableColumn<T>`: key, label, `value(row)` text, sortable, `filter` text/select, `cell`
template, align) plus cell templates, row selection, row actions (a template), rows that open, stacked cards on
phones. It is controlled: `[(page)] [(order)] [(filters)] [(selected)]`, `rows` and `totalAmount` come from outside
(server side); a changed order or filter goes back to page 1; order cycles ASC → DESC → none. `rowKey` keeps a reloaded
row selected; select-all acts on the page only (indeterminate while some are selected, disabled while empty). A row
opens by its first value (a button, for keyboards) or a click outside anything interactive. Internal parts are
attribute components on the native elements (`tr[ui-table-header-row]`, `tr[ui-table-filter-row]`,
`tr[ui-table-row]`, `th[ui-table-header-cell]`, `td[ui-table-filter-cell]`, `td[ui-table-body-cell]`); filters are
`td`, as AXE rejects empty headers. Phone: only sortable headers show, every value has its label. Browser test
`tests/table.spec.ts`.

**ui/local-table: done.** Decided with the user: ui-table doesn't care where rows come from, ngx-entity feeds it from
its service with server side order/filter; the client side table is a general utility, so it is in ui, wrapping
ui-table. `ui-local-table` takes all rows; `LocalTableColumn<T>` adds optional `compare` (default: texts, numeric
collation) and `matches` (default: text contains ignoring case; select = cell text equals the chosen option's label).
`LocalTableUtilities.findMatchingRows`/`resolveOrderedRows`. A page past the last shows the last one (`shownPage`).
Not yet: a search over all columns at once (the old table had one).

Next: ngx-entity core (decorators in zibri's style, component map, grid form, validation with zibri problems, service
with the filter/order contract feeding ui-table, dialogs, pages, guard), then relations, files, import and export.
No search over all columns: the author keeps it as a zibri GitHub issue.

Decided with the author for the core:
- The decorators are called `Property` like zibri's (`@Property.string({ displayName, minLength })`), with zibri's
  option names, so an entity class reads like its zibri twin.
- The entity service takes a `FilterConfig<T>` and an `OrderConfig<T>` shaped exactly like the controller's
  (zibri-contract types); the table derives its filter inputs from the matches (iLike/equals → text, oneOf with an
  enum → select, boolean → yes/no).
- A table lists its columns by property key in its config; label from `displayName`, text from the property's type,
  both overridable per column.
- Create and edit happen in dialogs by default, or on routed pages when the table config says so.

**ngx-entity scaffold: done** (by hand, like ngx-change-sets: angular.json, tsconfig paths and references, eslint
prefix `ngx`, global-setup build + link, entry-points spec, storybook main/tsconfig/styles). Root README row and the
library README are still missing.

**ngx-entity/entity: done.** `Property.string/number/boolean/date<T>(input)` (abstract class with static factories),
zibri's option names (minLength, maxLength, regex, enum, format, password, min, max, after, before, default, required
default true) plus displayName (required), description (hint), display, readonly, omitForCreate/Update,
defaultWidths `[6, 6, 12]`, position `{ tab, tabName, row, order }`, displayStyle per kind (string line/textarea,
number line/slider (slider throws without min and max), boolean checkbox/switch/undefined = ui config, date
date/datetime). A boolean's `required` only matters to the server (its field always has a value); `mustBeChecked`
(a condition, false by default; asked for by the author) makes the user check it. Conditions are
`(entity: T) => boolean`; TypeScript infers `T` from the class the decorator is in (`EntityPropertyDecorator<T> =
(prototype: T, key) => void`), so `@Property.boolean({ readonly: task => task.archived })` is typed without `<Task>`. Metadata lives in
`PropertyRegistryUtilities` (internal): a WeakMap by prototype, no reflect-metadata; values stored as
`PropertyMetadata<never>` and read back with the one commented cast (a heterogeneous map can't be typed per key; the
bivariant method-signature trick was tried and is refused by `typescript/method-signature-style`, rightly).
`EntityUtilities`: resolveProperties (parents first, a redeclared property keeps its place), findProperty,
resolveCondition, resolveDefaults, resolveChanges (dates by time), resolveFromJson (date strings → Date). Values are
read and written with `Reflect.get/set`, since a class or interface isn't a `Record<string, unknown>`. A subclass
redeclaring a decorated field needs an initializer (ES2022 class fields).

**ngx-entity/service: done.** Abstract `EntityService<T, F extends FilterConfig<T>, O extends OrderConfig<T>>`, extended
once per entity (`entity`, `baseUrl`, optional `filter`, `order` = undefined for zibri's default or false), like
ngx-change-sets' service, instead of the `provideEntityService` sketched in the question: typed by its configs and
overridable per method. `resolvePage({ page, limit, filter, order })` (filter/order as json params, left out when
empty), `resolveById`, `create`, `update(original, current)` (PATCH with only the changes), `delete`, `getId` (`id`,
throws otherwise; override for another name). Answers go through `resolveFromJson`. No cache (the old 15 minute cache
was wrong for has-many; paging is server side now). Spec with HttpTestingController.

Next: the fields and the 12-column grid form with tabs, then the entity table on ui-table, dialogs, pages, guard.

Decided with the author for the fields: **built-in lazy loaders**, not an eager component map (an app-root provider of
classes would put every field into the main bundle, the author's objection). ngx-entity ships a default map of
`() => import('@service-soft/ngx-entity/field-<kind>')` loaders; a form loads only the kinds its entity uses, each its
own chunk, the first time it shows one. `provideEntityFields({ kind: loader })` replaces single kinds. The field
entry points must not import the entry point holding the loaders (a cycle); they only know `entity` and ui.

**ngx-entity fields: done.**
- `field-base`: `BaseEntityFieldDirective<T, V>` (inputs `property`, `entity` (Partial<T>), `required`, `readonly`,
  `problem`; model `value`; `label`, `hint`, `problemValidation` (the server problem as the input's customValidation),
  `showError` (linkedSignal: true when a problem arrives, keeps true afterwards), `resolveKindError`). A field of the
  app's own extends it.
- One entry point per kind wrapping its ui input: `field-string` (type from password/format: email, tel; pattern from
  regex), `field-textarea`, `field-select` (string enum: its values; number enum: its member names), `field-number`
  (integer → step 1), `field-slider` (integer → step 1, else a hundredth of the range), `field-boolean`
  (`mustBeChecked` → the input's required; appearance from displayStyle or ui's INPUT_CONFIG), `field-date` (datetime →
  datetime-local; after/before → min/max). Strings: an empty text is undefined.
- `field`: `EntityFieldKind`, `EntityFieldUtilities.resolveKind` (enum → select, else by type and display style),
  `ENTITY_FIELDS`/`provideEntityFields` (default `async () => (await import(...)).X` loaders), `ngx-entity-field`
  (a `resource` loads the component, created in a ViewContainerRef with `inputBinding`/`twoWayBinding`, inside
  `untracked`). ng-packagr builds `field` after the kinds, so the dynamic imports are no cycle.
- Changed on the way: conditions and date bounds get `Partial<T>` (a form's values may be missing; the compiler found
  it); booleans default to `false` and a slider without a default to its `min`, since both always show a value.
  The ui inputs check native rules before the custom one, so a server problem shows only on a value that passes them
  (which it always does: the server only sees valid values).
- Not yet checked: that a production build really splits each field into its own chunk (add the form to the showcase
  and to `tests/bundle.spec.ts`).

**ngx-entity/form: done.** `ngx-entity-form [entity] [mode] [problems] [(value)]` lays out the fields; whoever saves
wraps it in `ui-form` with the buttons (it only submits while every field is valid). `EntityFormUtilities.resolveTabs`:
tab from `position.tab` (default 1), its label from the first `tabName` or `provideEntityFormConfig({ tabLabel })`
('Tab N'); rows by `position.row`, the ones without a row share one after them; `order` inside a row, the rest after,
otherwise the order of the class; `display`/`omitForCreate`/`omitForUpdate` leave fields out; widths `[lg, md, sm]` as
literal `col-span` classes (`entity-form-classes.ts`) in a 12 column grid; a read only field is never required.
zibri's `ValidationProblem`s show at the field of their key until the user changes it. An invalid field on a hidden tab
opens its tab and gets focus (capture listener on `invalid`, first one of a submit only, like ui-form). One tab shows
no tab list. Internal `ngx-entity-form-rows`. Stories (create, update, with problems) and `tests/entity-form.spec.ts`.

Found on the way and fixed in ui: **ui-tabs rendered a tab's content only once it was first opened** (`ngTabContent`),
so a form never validated the fields of a tab the user didn't open and saved without them. The content now renders
right away, hidden and inert (TabContent and preserveContent removed), with a spec for it; README and JSDoc say so.

Flaky, not caused by this: `tests/accessibility.spec.ts` once failed with "Axe is already running" on an unrelated
story (Input string: Password And Code) and passed on three reruns. Look into it if it comes back (two runs on one
frame).

**Checked: each field is its own chunk.** The showcase has a lazy `projects` route with a form of `Project` (a string
and a number, `projects/showcase/src/app/project*.ts`) and a navbar link to it. `tests/bundle.spec.ts`: no field
selector in the main bundle, each in exactly one chunk with no other field; and in a browser serving the build
(`page.route` on `http://showcase.test`, unknown paths answer index.html), `/projects` loads only the chunks of the
string and number fields. **README** of ngx-entity written (what exists; says tables, dialogs and pages are to come,
and a "Moving from ngx-material-entity" so far), and the row in the root README. Update both as the rest lands.

**ngx-entity/table: done.** `ngx-entity-table [service] [label] [columns] [pageSize] [selectable] [opens] [actions]`,
models page/order/filters/selected, output opened, method `reload()`. Columns by key or `{ key, label?, value?, cell? }`
(throws for a key without a decorator). `EntityTableUtilities`: resolveColumns (label from displayName; text by type:
enum member name, number and date via Intl in LOCALE_ID (date medium, datetime + short time), boolean
yesLabel/noLabel from `provideEntityTableConfig`; numbers align end; sortable when the service's order is undefined
(zibri's default) or names the key; filter input: string iLike/fuzzy/equals → text, enum oneOf/equals → select,
boolean equals → yes/no select, range and number filters get none, since ui-table only has text and select),
resolveOrder (TableOrder → `{ key: direction }`), resolveFilter (oneOf wraps the chosen value in a list). The page
comes from a `resource`; the last answered page stays while the next loads (`aria-busy` on the host); text filters
wait 300ms before a request; a failed page goes to the ErrorHandler. The row key is `service.getId`.
`EntityUtilities.resolveEnumMembers` (+ `EnumMember`) is shared with the select field. Stories with a fake zibri
backend (interceptor), AXE passes.

**ngx-entity/dialog: done.** `EntityDialogService.create(service, { title })`, `.edit(service, entity, { title })`
(both resolve the saved entity or undefined), `.delete(service, entity, { title })` (asks with ConfirmDialog, resolves
whether it deleted). Internal `ngx-entity-dialog`: heading, `ngx-entity-form` (mode create/update) in a `ui-form`,
Cancel + Save (disabled while saving). A 400 with problems shows them at the fields (parsed with
`ErrorResponseUtilities.findErrorResponseBody` of ngx-error-handling, now a peer of ngx-entity); any other error is
rethrown to the ErrorHandler. A refused value can't be saved again until the user changes it (its problem keeps the
input invalid). Cancel with changes asks (`discardTitle`, Keep editing / Discard); opened with
`closeOnEscape: false` and `size: 'lg'`. Texts via `provideEntityDialogConfig`. Spec with the DialogTestingUtilities.

**Table actions: done.** `ngx-entity-table` inputs `edit: 'dialog' | 'page'` (opening a row edits; page navigates to
`:id` relative to the table's route), `canCreate` (a Create button above it; page → `new`), `canDelete` (a Delete
button in each row's actions, next to your own `actions`, `aria-label` "Delete <first value>"). It reloads after a
save or delete. The dialog entry point is loaded with `import()` on first use (only `import type` at the top), so a
read only table ships no form. `@angular/router` is now a peer of ngx-entity (Router/ActivatedRoute injected
optional). Story "Editable" with a fake backend that keeps changes; `tests/entity-table.spec.ts` (create, edit with
escape doing nothing and Keep editing, delete).

Fixed in ui on the way: **dialogs sat in the top left corner** (tailwind's preflight sets the margin of every element to
0, which removed the browser's `margin: auto` that centers a modal dialog): `m-auto`, and `tests/dialog.spec.ts`
checks it's centered. ui-dialog got `size: 'md' | 'lg'` (max-w-lg / max-w-4xl), also in `DialogOptions`.

`tests/styling.spec.ts` used `invisible` as the class of a component the showcase doesn't use; the showcase's entity
form now ships ui's inputs (which use it), so the marker is `object-cover` (only the file input). Note: a lazy chunk's
classes are in the css as well, as css is global; every field kind is a lazy chunk of the showcase.

**Pages, routes, unsaved changes: done.**
- `ngx-entity/editor`: `ngx-entity-editor [service] [entity] [title] (saved) (cancelled)`, public method
  `hasUnsavedChanges()` (compares with the values it started with, or last saved). Holds what the dialog did before:
  heading, form in ui-form, Cancel/Save, save with problems from zibri, other errors rethrown. The dialog component and
  the page are thin wrappers around it.
- `ngx-entity/unsaved-changes`: `UnsavedChanges` (`hasUnsavedChanges: () => boolean`), `unsavedChangesGuard`
  (CanDeactivateFn, any component), `UnsavedChangesService.askToDiscard()` (imports ui/dialog on first use, so routes
  with the guard keep the dialogs out of the main bundle), `provideUnsavedChangesConfig({ title, paragraphs,
  discardLabel, keepEditingLabel })`. The dialog's Cancel asks through it too.
- `ngx-entity/page`: `EntityPageComponent` (`ngx-entity-page`): service from `ENTITY_SERVICE` (new token in the
  `service` entry point, so `routes` and `page` share it without a cycle), id from the route (`new` has none), loads with
  `resource` (errors to the ErrorHandler), heading = the route's `title` (also the document title), goes `..` after save
  or cancel, `beforeunload` while there are changes.
- `ngx-entity/routes`: `EntityRouteUtilities.resolveRoutes(ServiceClass, { createTitle, editTitle })` → `new` and `:id`,
  with `providers: [{ provide: ENTITY_SERVICE, useExisting }]`, `loadComponent` (dynamic import of the page) and
  `canDeactivate: [unsavedChangesGuard]`. Put next to the table's route.
- Texts moved: createTitle/editTitle/saveLabel/cancelLabel into `provideEntityFormConfig` (editor, dialogs, pages);
  `provideEntityDialogConfig` only has the delete question (`deleteTitle`, `deleteParagraphs`, `deleteLabel`,
  `keepLabel`).
- Showcase: `/projects/new` from the routes helper (`ProjectService`, no backend: only create opens without errors);
  `tests/bundle.spec.ts` checks the page and editor aren't in the main bundle and the page has the route's title.
- The editor's heading: `headingLevel` input (`EntityEditorHeadingLevel`, 2 by default for dialogs); the page passes 1
  (decided with the author: h1 on pages).

Decided with the author for relations:
- **Mirror zibri**: `@Property.manyToOne({ target, joinColumn: 'teamId', service, label })` on the relation property
  (`team`); the form edits the joinColumn with a picker, the table shows the label of the relation when the read
  includes it (zibri's `defaultRelations`).
- **Picking**: ui-input-autocomplete asking the target's service for a page filtered by the typed text (an iLike of the
  target's filter config, named in the decorator).
- **Has-many** (oneToMany): an inline ngx-entity-table of the children in the parent's form, filtered by their
  joinColumn, created and edited in dialogs with the joinColumn set; only while editing (the parent needs an id).
- **Many-to-many: left out for now** (zibri can't take relations in a body; the app would need its own DTO/route).

**Relations: done** (many-to-many left out, as decided).
- `entity`: `Property.manyToOne` / `belongsToOne` (`ToOnePropertyMetadata`: target, joinColumn, service, label — a key
  of the target, not a function, so the store needs no cast; the user searches by it), `Property.oneToMany`
  (`OneToManyPropertyMetadata`: target, inverseSide, service, columns; required false, widths 12). TypeScript infers
  the entity and the target, and checks joinColumn/label/inverseSide/columns against them. `service` is
  `() => Type<unknown>`: the entity entry point can't import `service` (a cycle), so the fields check
  `instanceof EntityService` at runtime. `EntityUtilities`: `isToOneRelation` (type guard), `getValueKey` (the
  joinColumn for a to-one), `resolveWritableValues` (no relations: zibri 400s them), `resolveChanges` skips relations,
  `resolveFromJson` converts the entities the read included, `resolveRelationLabel`.
- `service`: `create` sends `resolveWritableValues`; new `findId` (no throw; `getId` uses it; override findId for
  another id name).
- `form`: the joinColumns get no field; `EntityFormField.valueKey`, which the rows read, write and take problems by.
- `field-reference`: ui-input-autocomplete, `found` resource (300ms, page of 20, `{ [label]: query }` filter),
  the chosen entity from the read (`entity[key]`) or `resolveById`. `field-has-many`: ngx-entity-table edit="dialog"
  canCreate canDelete, `fixedFilter` and `createValues` = `{ [joinColumn of inverseSide]: parentId }`; parent id via
  `ENTITY_SERVICE` (the editor now provides its service) and `findId`; without an id it shows `createFirstLabel`.
- **The hasMany field is the one kind the app provides** (`provideEntityFields({ hasMany: async () => (await
  import('@service-soft/ngx-entity/field-has-many')).EntityHasManyFieldComponent })`): field → field-has-many → table
  → (dynamic) dialog → editor → form → field is a cycle of entry points, which ng-packagr refuses also for dynamic
  imports. The default loader rejects with that line. (A deviation from "built-in loaders", forced.)
- `table`: inputs `fixedFilter`, `createValues`; `EntityTableColumnKey<T>` (any string for an unknown type); a relation
  column shows the label; with no order config a relation isn't sortable (zibri's default doesn't order relations).
- `editor`: input `createValues`; provides `ENTITY_SERVICE`. `dialog`: `create(service, { title, values })`.
- Fixed in ui: **the autocomplete never showed options a backend sent after the last keystroke** (its list had closed
  for the empty result); an effect on `options` opens it while the user is in the input with a search text. Story
  `BackendSearch`, test in `tests/input-autocomplete.spec.ts`. That spec's keyboard test raced the list (read before
  it settled, ArrowDown before the first option was active) and failed under load; it polls for both now.
- Stories `Entity relations` (HasMany, ManyToOne) with a fake backend that includes relations like defaultRelations;
  `tests/entity-relations.spec.ts` checks what the backend saved through the UI (an interceptor makes no network
  requests, so `waitForRequest` sees nothing).
- Fixed in ui afterwards: the list of the autocomplete and the chips was cut off by a dialog's `overflow-auto`. New
  `InputPopupDirective` (`[uiInputPopup]="anchorName()"`, `popover="manual"`, `showPopover()` after its first render,
  `position-anchor`) in `ui/input`; `BaseInputDirective.anchorName` (`--<inputId>`) on the native input as
  `anchor-name`; `INPUT_POPUP_CLASSES` are the menu's popover classes with `[width:anchor-size(width)]` and
  `flip-block`. `tests/entity-relations.spec.ts` checks the last option of a list in a dialog is hit by
  `elementFromPoint`. The active option now updates a frame after a key, so the keyboard test polls for it.
- Flaky under load, fixed: `tests/change-sets.spec.ts` "shows more change sets and moves focus to the first new one"
  checked the focus before the render that moves it (now polls), and "Axe is already running" (see Follow-ups for ui).

Decided with the author for files:
- **Upload with the entity**: the entity is sent as multipart FormData with its files when it is saved; nothing is
  uploaded before. The author asked to check whether zibri's `CrudController` can choose FormData bodies for create and
  update by itself when its entity has file properties (research running; zibri decides how a file is stored).
- **The entity keeps the StoredFile object** (`{ id, name, mimeType, size, url }` of zibri-contract), so form and table
  show its name and preview without another request. Replaced by the decisions below.
- **Found in zibri:** a `@Property.file` of an entity stores only the bytes (`bytea`, base64 in Valkey) and a response
  passes the `Buffer` on unchanged (`DeclaredResponseUtilities`), so `JSON.stringify` writes
  `{"type":"Buffer","data":[…every byte…]}` against the OpenAPI `string`/`binary`, for every entity of a list. A
  `CrudController` takes json only, so a client can't write a file at all. The old sandbox answered
  `{ name, type, size, url }` and served the bytes from a separate route (`GET /file/`).
- **Bytes stay in the entity's table**, together with the file's name and mime type (a migration for existing file
  columns). The cost of big files in the database is accepted; clients only ever see the reference and the url, so a
  storage (disk, S3) can replace the column later without changing the http side.
- **`StoredFile` becomes `FileReference`** (`{ name, mimeType, size, url }`, no id) in zibri-contract: what a response
  writes for a file property, computed, never stored, never the bytes.
- **The download route is on the `CrudController`** (`GET /<base>/:id/files/<property>`), with the controller's access
  rules; the `url` of a `FileReference` points there.
- **Multipart only**: with file properties, create and update take multipart (the entity as fields, a file part replaces
  the file, an empty field removes it, a PATCH without it keeps it).
- **ngx-entity loads the bytes through `HttpClient`** as a Blob (works with token and cookie auth), not `<img src>`.
  A file field holds a `FileReference`, a browser `File` (new) or `null` (removed).
- **Top level and arrays**: `@Property.file` and `@Property.array({ items: { type: 'file' } })` directly on the entity
  (route path `attachments.2` for an item). A file inside an object property is refused at startup with a clear error.
- **Breaking, so zibri v4.** Written down, not built. Nothing of it is in ngx-entity yet; its file field waits for v4.

### zibri v4: files of entities (idea, not built)
- **Postgres: extra columns.** A file property `avatar` is `avatar` bytea, `avatar_name` text and `avatar_mime_type`
  text; an array of files is three parallel arrays (`bytea[]`, `text[]`, `text[]`). Native to node-postgres, no
  parsing, the bytes stay bytea. Migrations and backups handle the three columns of a property together, a migration
  adds the two new columns to existing file columns. Valkey and memory store `{ name, mimeType, data }` (data base64
  in Valkey).
- **The value in the app** is a zibri model with the name, the mime type and the bytes (server only); an uploaded
  `File` of a multipart body becomes one (read from its temp path, then `cleanup()`).
- **Responses** write a `FileReference` (`{ name, mimeType, size, url }`, zibri-contract, replaces `StoredFile`) for
  every file property, also of entities answered by other routes or reached through relations: the `CrudController`
  of the entity registers itself as the one that serves its files, so the url is known. OpenAPI says the reference.
- **`GET /<base>/:id/files/<property>`** (`<property>.<index>` for arrays) on the `CrudController`, with its access
  rules: the bytes with the mime type as `Content-Type` and the name in `Content-Disposition`.
- **Create and update take multipart** when the DTO has file properties, chosen by the `CrudController` itself (the
  body declaration `type: MimeType.FORM_DATA`, unwrapping `FormData.value`). A file part replaces the file, an empty
  field removes it, a PATCH without it keeps it.
- Every place that handles `'file'` today (about 25: data sources, migrations, backup, validation, OpenAPI, response
  writing, parsing) changes with it: `grep -rnE "case 'file'|type === 'file'" packages/zibri/src`.

Decided with the author for the other kinds (the whole old set):
- **Password** (zibri `@Property.string({ password: true })`): a confirmation field that must match (form only, never
  sent) and a strength meter, the old rule (strong: 15+ characters and complex, medium: one of them, weak: otherwise).
  On edit it starts empty, an empty field keeps the stored password, the table never shows it.
- **Objects** (`@Property.object`): inline, the nested class's fields in a fieldset (problems by dot path), and the old
  dropdown of a fixed list of objects.
- **Arrays** (`@Property.array`): everything the old one had: strings, numbers and enums as chips (with options or
  typed in), arrays of objects as a local table with add/edit/remove dialogs, arrays of dates, datetimes and date
  ranges as tables with an add row.
- **Import and export** in `ngx-entity-table`: export the selected rows as JSON, CSV and XML in the browser; import a
  JSON file by `POST <baseUrl>/import` like the old one. zibri has no such route: the app developer adds it.

**Import and export: done.** `ngx-entity-table` `canExport` (selectable rows, buttons per format, disabled without a
selection) and `canImport` (hidden file input behind a button, `EntityService.import(file)`: POST `<baseUrl>/import`,
multipart field `import` like the old package, answers the created entities; errors to the `ErrorHandler`). New entry
point `export` with `EntityExportUtilities` (`resolveJson`, `resolveCsv` from the table's columns with quoting,
`resolveXml` own small writer, no dependency, `download` with a blob link), loaded by `import()` on the first export.
Table config: `importLabel`, `exportLabels`, `exportFileName`, `csvSeparator`. `EntityTableUtilities.resolveColumns`
takes `EntityTextLabels` now. Story backend answers `/import`; `tests/entity-table.spec.ts` checks a real CSV download
and an import.

**Password, objects and arrays: done.**
- ui: `ui-input-string` `passwordStrength` (bars and a polite live text, `InputStringUtilities.resolvePasswordStrength`,
  `passwordStrength` and `passwordStrengthLabels` in `provideInputConfig`). `ui-input-chips` keeps a text `customValue`
  refuses and shows the error of `customValidation` (which reads the text through `[(query)]`).
- `field-password` extends the string field: `autocomplete="new-password"`, strength, a repetition (`confirmation`,
  `confirmationDisplayName`, `provideEntityPasswordFieldConfig`). `resolveFromJson` drops passwords; the form makes a
  password not required in `update` mode.
- `Property.object`: inline objects are part of the form layout, not a field kind (a field that renders fields would be
  an entry point cycle): `EntityFormField.rows`/`path`, a fieldset per object in `ngx-entity-form-rows` (recursive),
  values and problems by dot path (`EntityUtilities.getValueAtPath`, `resolveWithValueAtPath`). Conditions of nested
  properties get the object. A dropdown object is the `select` kind, matching the value with `EntityUtilities.isEqual`
  (dates by time, arrays and plain objects by value, also used by `resolveChanges`).
- `Property.array` with `items` of `string`/`number` (chips, `field-chips` with `EntityChipsFieldUtilities` for the item
  rules), `date`/`dateRange` (`field-date-array`: local table, add row; required is the custom error of the add input),
  `object` (`field-object-array`: local table, add/edit in a dialog). Arrays are not required by default (an empty
  array is a value); required needs an item. The dialog gets the form through `ENTITY_FORM_COMPONENT` of `field-base`,
  which `ngx-entity-form` provides (no import of the form, no cycle); a required object array has a visually hidden
  input that forwards the focus of the form to the Add button.
- Texts moved from `EntityTableUtilities` to `EntityTextUtilities` in `entity` (yes/no as `EntityTextLabels`), so
  fields can format without importing the table. Tables don't order by objects and arrays by default.
- `provideEntityArrayFieldConfig` in `field-base` has its own Save/Cancel/Yes/No (the form and table configs can't be
  imported there).
- `FormTestingUtilities.findLabelledInput` added. Specs per field, stories `Entity arrays`, `tests/entity-arrays.spec.ts`
  (dialog AXE, focus of a required array), the form story has a password and a Location tab with objects.
- The rest of the old kinds, decided with the author: `Property.dateRange` (`field-date-range`, both dates or
  neither, `provideEntityDateRangeFieldConfig`), a string with `displayStyle: 'autocomplete'` and `options`
  (`field-autocomplete`, free text unless `restrictToOptions`; ui-input-autocomplete got `freeText`, ui
  `InputUtilities.resolvePatternError` for rules a combobox has no attribute for) and `Property.custom` (its own
  `component` loader and `data`; `EntityFieldUtilities.resolveLoader`, `resolveKind` excludes custom).
- Optional inline objects, decided with the author: `required: false` gives no default, the fields are only required
  once one has a value (`LayoutContext.optional` in `EntityFormUtilities`), and the form drops an empty one
  (`EntityUtilities.isEmpty`, false counts as empty; `resolveWithoutEmptyObjects`).
- jsdom has no popover api: `PopoverTestingUtilities.addPopovers()` of `testing/popover` adds it, called in the
  `test-setup.ts` (`setupFiles` of the test target) of ui and ngx-entity. No library logs `showPopover` any more.

**ngx-entity core: done.** Relations, every other kind of the old package, and import/export are done too. Left:
many-to-many (left out for now, as decided) and files and images, which wait for zibri v4 (see above).

zibri's in-memory suites run here with a temp jest config (see the memory "zibri tests in sandbox", which now also
maps the test versions folder to `$TMPDIR`).

## How to migrate a package
1. Read the old package in `../<name>`: its README, public api and showcase. Write down what it does, which Material
   components it uses and what it needs from ui that ui doesn't have yet. If it talks to a backend, read what
   `../zibri` provides for it: that is the contract, not the old backend.
2. Add every missing ui component first, in ui, with stories, tests and README docs — not inside the package.
3. Create the library as described in [Adding a library](./CONTRIBUTING.md#adding-a-library).
4. Rewrite the package one entry point per component, following [CODE_STYLE.md](./CODE_STYLE.md). Don't copy the old
   code over; it predates every convention here.
5. Stories for every component, variant and state, so AXE covers them. Specs next to the code, workspace tests in
   `tests/` for anything that spans packages.
6. A README in the package with a migration note for users of the old package, and a row in the packages table of
   the root [README](./README.md) that links to it.
7. `npm run lint` and `npm test` pass.

## Publishing and moving a package to its new name
npm can't rename a package or move it into a scope. The new name is a new package, and the old one points to it:

1. `npm publish` the new package from its `dist` directory (`publishConfig` makes it public). Start a new major
   version, the api changed anyway.
2. Publish one last version of the old package whose README says where it moved, so the npm page shows it.
3. Deprecate every version of the old package. npm then warns everyone who installs it:
   `npm deprecate ngx-material-change-sets "Moved to @service-soft/ngx-change-sets, see <link to the migration note>"`.
4. Don't unpublish the old package: existing projects still install it, and npm only allows it for new or unused
   packages anyway.

# Follow-ups for ui
Nothing here is needed before the first migration; add a component when a package needs it.

**Drawer, details and colored surfaces: done** (decided with the author).
- The drawer story had narrow `ui-button variant="text"` items; the pattern is `ui-link appearance="nav" block`
  (full width, like ngx-navigation's drawer already does), now in the story and the README. No new item component.
- `ui-drawer`: `color` (`surface`, `container`, `primary`, `secondary`), `header` (the label as h2 with a close
  button, `closeLabel`), defaults in `provideDrawerConfig`.
- `ui-details`: `variant` (`outlined`, `filled` with a transparent border, `plain` with a divider) and `color`
  (`neutral`, `primary`, `secondary`), `provideDetailsConfig`. Like a button (corrected by the author twice): filled in
  a theme color, only the summary is a colored surface (hover `X-hover`, focus ring `on-X`), the content stays in
  `surface-container`; outlined and plain show the color as their border or divider and chevron, open or not.
- Colored surfaces in the theme: per primary and secondary `on-X-variant`, `on-X-outline`, `on-X-outline-variant`,
  `X-surface-container` (towards `X-hover`), `on-X-tint`/`-pressed` (= `X-hover`/`X-pressed`, away from the text),
  `on-X-hover`/`-pressed` (filled on- color). `@utility surface-primary`/`surface-secondary` capture the color on the
  element and remap the surface, primary and secondary-text tokens on its direct children (a token naming itself would
  be invalid). `COLORED_SURFACE_REQUIREMENTS` check the pairs; the checker skips the utilities' own rules. Error and
  success as text stay surface colors inside (documented).

- More controls (date, autocomplete, chips, …), each in its own entry point, see "Next in ui".
- A `label-sm` text role: done (0.75rem, weight 500, for dense content like a badge or a count; nothing uses it yet,
  the small buttons keep `text-label`).
- `ui-input-boolean`: done. It has `indeterminate` (checkboxes only), and the popover story, the log history filter
  and the consent dialog use it (their specs read the label through `input.labels`). The checkbox is drawn like the
  switch (`appearance-none`, `size-5`, a check or dash icon on top), so invalid colors its border; the inline label
  gets the height of an input from padding, and an open message moves up into it.
- `ui-input-select` as a combobox: done (decided with the author, an exception to "native first" like the calendar:
  the list of a native select takes neither the colors nor the cursor of the theme). A select-only `ngCombobox` on a
  div with the listbox and classes of the autocomplete; a hidden native select stays the `#nativeInput` (validity,
  `name`, autofill, the target of the label and of the form's focus, handed on to the combobox). `labelId` on
  `InputFieldState` names it. The table filter (`ui/table/table-filter.component.html`) still uses a native select.
- `ui/menu` and `ui/popover` share how they are placed. Once a third overlay needs it, like a datepicker, build the
  menu on the popover.
- Visual regression tests for the stories (the author: skip for now).
- `tests/accessibility.spec.ts` fails now and then with "Axe is already running": the a11y addon of Storybook runs AXE
  in the story frame as well, and ours can start before it finished. Seen once on Breadcrumbs: Default, passed on two
  reruns. Fixed: `StorybookUtilities.renderStory` opens stories with `globals=a11y.manual:!true`, so the addon only
  runs from its panel.
- A build step that strips unused css from the consumer's production css (the author: document the second Tailwind
  pass over the build output in the ui README, no package).
- The first release of `@service-soft/ui`.

# How to work here
- **Before your first change**, read [CODE_STYLE.md](./CODE_STYLE.md) in full. It wins over the surrounding code.
- **Commands**: `npm run lint`, `npm test` (unit tests of every library, then `npm run test:workspace`, which builds
  Storybook and the libraries and runs the browser tests), `npm run storybook` to work on components.
- **Browser tests** need Chromium once, and again after Playwright was updated:
  `npx playwright install --only-shell chromium`.
- **`@angular/build` needs to be 22.2.5 or later.** Before, `ng test` replayed old builds: Vitest 5 caches modules in
  `node_modules/.vitest-cache` and keyed a spec by its source file on disk, while the Angular builder serves the
  compiled bundle, with the code under test, under that path. 22.2.5 turns that cache off for `ng test`; the folder
  that remains belongs to `npm run test:workspace`, which runs the sources directly.
- **jsdom is not a browser**: it has no layout and imitates native validation and events only partly. Behaviour of the
  browser (focus, the order of `invalid` events, typing into a number input, layout shifts) is tested in `tests/`
  with Playwright against the built Storybook.
- **A test has to fail without the change.** For every bug fix, break the code on purpose once and watch the test go
  red.
- **Keep this file current**: tick off what is done, move made decisions into
  [Decisions that are made](#decisions-that-are-made), and add what you learn.
