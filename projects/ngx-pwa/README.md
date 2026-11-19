# ngx-pwa
Progressive web app features for Angular: changes the user makes offline are kept on the device and synced later, what they loaded last can be read offline, a bar says when the user is offline or has unsaved changes, push notifications, and a dialog that offers to reload once a new version of the app is ready.

Everything works with server-side rendering: on the server nothing is kept, sent or asked.

# Table of Contents
- [ngx-pwa](#ngx-pwa)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
- [Offline changes](#offline-changes)
  - [Who and where they belong to](#who-and-where-they-belong-to)
  - [Before a logout](#before-a-logout)
  - [Showing them in your data](#showing-them-in-your-data)
  - [Syncing them](#syncing-them)
- [Offline cache](#offline-cache)
- [Offline status bar](#offline-status-bar)
- [Sync dialog](#sync-dialog)
- [Push notifications](#push-notifications)
- [Updates](#updates)
- [Moving from ngx-pwa](#moving-from-ngx-pwa)
- [License](#license)

# Requirements
Angular 22 with `@angular/service-worker` set up by `ng add @angular/pwa`. The offline status bar, the sync dialog and the update dialog also need [@service-soft/ui](https://www.npmjs.com/package/@service-soft/ui) and Tailwind CSS 4.

```sh
npm install @service-soft/ngx-pwa @service-soft/ui
```

```css
@import "tailwindcss";
@import "@service-soft/ui";
@import "@service-soft/ngx-pwa";
```

Each feature is in its own entry point, so only the ones you import end up in your bundle. `/offline`, `/offline-cache` and `/push-notifications` don't need ui.

# Offline changes
Register the `offlineInterceptor` from `@service-soft/ngx-pwa/offline`:

```ts
// app.config.ts
providers: [
    provideHttpClient(withInterceptors([offlineInterceptor]))
]
```

Then mark every POST, PATCH and DELETE request that should be kept while the user is offline, with the type of the entity it changes:

```ts
const context: HttpContext = new HttpContext().set(OFFLINE_REQUEST_METADATA, { type: 'todo', displayValue: `New todo: ${todo.title}` });
await firstValueFrom(this.http.post<Todo>('/api/todos', todo, { context }));
```

While the browser is offline, a marked request isn't sent. It is kept on the device, and answered right away with status 202, so your app goes on as if the server had taken it: a POST gets its body back with an id like `offline-…`, a PATCH its body and a DELETE `null`. Requests that aren't marked, like a login, are sent and fail like without the library.

| Option of `OFFLINE_REQUEST_METADATA` | Default |
|---|---|
| `type` | required — the type of the entity, which `applyOfflineData` looks for |
| `idKey` | `'id'` — the property that holds the id of the entity |
| `displayValue` | the url — what the user sees of the change in the sync dialog, as plain text |

Bodies are kept as json, like `HttpClient` sends them. Of the headers, only the ones of [`provideOfflineConfig`](#who-and-where-they-belong-to) are kept: when they are synced, your interceptors add the others again, like a fresh token.

## Who and where they belong to
On a device that several users share, or in an app with tenants, a change belongs to the user who made it and to the tenant they made it in. `provideOfflineConfig` tells them apart:

```ts
provideOfflineConfig({
    headers: { 'x-tenant-id': () => inject(AuthService).activeTenantId() },
    scope: () => inject(AuthService).authData()?.userId
})
```

| Option of `provideOfflineConfig` | Default |
|---|---|
| `headers` | none — the headers that tell apart where a request is made, each with a function of its current value. A request that sets one itself keeps its own |
| `scope` | everybody — who a request belongs to, like the id of the logged in user |

Both run in an injection context, and the signals they read are followed. With them:
- A change is kept with the values of the headers and synced with them, even when the user switched the tenant by then: interceptors like the one of [@service-soft/ngx-auth](https://www.npmjs.com/package/@service-soft/ngx-auth) leave a header that a request sets itself alone.
- `applyOfflineData` applies only the changes of the current user in the current tenant, so a table of tenant B never shows what was created offline in tenant A.
- `cachedRequests()`, the status bar and the sync dialog list the changes of the current user in every tenant, so they can be synced from anywhere. A change is never sent with the login of somebody else: `sync` rejects it, and `syncAll` and `removeAll` leave it for its user.

A change made while `scope` answers undefined, or kept before there was a scope, belongs to everybody.

## Before a logout
Syncing needs the login, so ask before it ends. `syncBeforeLogout` of `@service-soft/ngx-pwa/sync-before-logout` opens the [sync dialog](#sync-dialog) when the user has changes, with "Stay logged in" in place of "Close", and answers true once every change is synced or discarded. Without changes, it answers true at once and loads nothing. It is made for the `beforeLogout` of [@service-soft/ngx-auth](https://www.npmjs.com/package/@service-soft/ngx-auth):

```ts
provideAuth(AppAuthService, { apiUrl, strategy: 'jwt', beforeLogout: syncBeforeLogout })
```

## Showing them in your data
`applyOfflineData` applies the changes made offline to what you loaded from the server: it adds the entities created offline, changes the changed ones and removes the deleted ones. A PATCH or DELETE request changes the entity whose id is the last segment of its url, like `/api/todos/5`:

```ts
protected readonly offlineService: OfflineService = inject(OfflineService);
protected readonly todos: Signal<Todo[]> = computed(() => this.offlineService.applyOfflineData('todo', this.loadedTodos()));
```

`offline()` says whether the browser has no connection, and `cachedRequests()` lists the changes that aren't synced, oldest first. Both are signals.

## Syncing them
Nothing is sent by itself: the user syncs in the [sync dialog](#sync-dialog), or you call the service:

| Method | Does |
|---|---|
| `syncAll()` | Sends every change, oldest first, and stops at the first that fails, which stays with every change after it |
| `sync(request)` | Sends one change |
| `remove(request)`, `removeAll()` | Discards changes without sending them |
| `hasUnresolvedDependency(request)` | Whether a change uses an entity that was created offline and isn't synced yet |

A change that uses an entity created offline, like `PATCH /api/todos/offline-…`, gets the id the server gave the entity once that is synced, in its url and anywhere in its body. Until then it can't be synced on its own.

# Offline cache
What the user loaded last can be read offline. The data groups of Angular's service worker can't do that for an app with logins: they keep an answer by its url only, so offline, the users of tenant B would see what was loaded for tenant A, and the next user of a device what the one before loaded. The `offlineCacheInterceptor` of `@service-soft/ngx-pwa/offline-cache` keeps answers by who and where they were loaded:

```ts
providers: [
    provideHttpClient(withInterceptors([authInterceptor, offlineCacheInterceptor, offlineInterceptor])),
    provideOfflineConfig({ headers: { 'x-tenant-id': () => inject(AuthService).activeTenantId() }, scope: () => inject(AuthService).authData()?.userId }),
    provideOfflineCache({ urls: ['https://api.example.com/'] })
]
```

| Option of `provideOfflineCache` | Default |
|---|---|
| `urls` | required — the beginnings of the urls of the GET requests whose answers are kept, like the url of your api |
| `maxAgeInMs` | 7 days — how long an answer is given once it was loaded. An older one is deleted instead |

- Every GET request goes to the server first, so nothing old shows while it answers. Only when the request can't reach it, like offline, is it answered with the last answer to the same url with the same query, for the same `scope` and `headers` of [`provideOfflineConfig`](#who-and-where-they-belong-to). Without one, it fails like it would have. A request reaches no server when it fails without an answer, or with the `504` that the service worker of Angular answers for it. The server refusing it is an answer, and is passed on.
- An answer of the cache has the status 200 and the header `X-Offline-Cache-Loaded-At`, when it was loaded, as an ISO string. `cachedSince()` of the `OfflineService` is when the oldest answer the cache gave since the server last answered was loaded, which the [offline status bar](#offline-status-bar) shows.
- The answers are kept in IndexedDB, so they are there after a reload and in every tab, or as long as the page without it. `clearCache()` of the `OfflineCacheService` deletes all of them. Call it when the user logs out, like with the `onLogout` of [@service-soft/ngx-auth](https://www.npmjs.com/package/@service-soft/ngx-auth): `onLogout: () => inject(OfflineCacheService).clearCache()`.
- The changes made offline are applied on top with [`applyOfflineData`](#showing-them-in-your-data).

On the server, nothing is kept or answered.

# Offline status bar
Put it at the top of your app. It says when the user is offline or has unsaved changes, has a button that opens the [sync dialog](#sync-dialog), and shows nothing otherwise:

```ts
import { OfflineStatusBarComponent } from '@service-soft/ngx-pwa/offline-status-bar';
```

```html
<ngx-offline-status-bar />
```

While the app shows answers of the [offline cache](#offline-cache), it says when the oldest of them was loaded, like "Offline · Data from 11/18/26, 8:30 AM", also when the browser thinks it is online but the server can't be reached.

Screen readers announce what it says. The sync dialog is only loaded once the user opens it. Change its texts with `provideOfflineStatusBarConfig({ labels: { offline: 'Offline', loadedAt: 'Daten vom', unsavedChanges: 'Nicht gespeichert', sync: 'Synchronisieren' } })`, in the application config or in a component for only that part of the app.

# Sync dialog
Lists the changes made offline, each with a button to sync it and one to discard it, and buttons to sync or discard all of them. Discarding all of them asks first. It closes by itself once no change is left, and says in a snackbar when everything is synced. Open it yourself from your own button:

```ts
inject(DialogService).open((await import('@service-soft/ngx-pwa/sync-dialog')).SyncDialogComponent);
```

Change its texts with `provideSyncDialogConfig({ labels: { ... } })` in the application config: the dialog opens from the root of the app. Values you leave out keep their defaults, including `labels.methods`, which says what a change did: `'New'`, `'Changed'` or `'Deleted'`.

Opened with `{ beforeLogout: true }` as its data, like [`syncBeforeLogout`](#before-a-logout) opens it, it says so with `labels.beforeLogout`, and its close button is `labels.stayLoggedIn`. It closes with true once no change is left.

# Push notifications
`PushNotificationService` from `@service-soft/ngx-pwa/push-notifications` turns push notifications on and off, and posts the subscription of the browser to your server, which sends the notifications with it:

```ts
providers: [
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() }),
    providePushNotifications({ vapidPublicKey: 'BM64…', enableUrl: '/api/push/enable', disableUrl: '/api/push/disable' })
]
```

```ts
protected readonly pushNotificationService: PushNotificationService = inject(PushNotificationService);
```

```html
@if (pushNotificationService.available) {
    <button ui-button type="button" (click)="pushNotificationService.enabled() ? pushNotificationService.disable() : pushNotificationService.enable()">
        Notifications
    </button>
}
```

`enable()` asks the user for permission first and rejects when they don't allow it. `enabled()` says whether this browser gets notifications, and `available` whether the service worker runs, which push notifications need. Generate the VAPID keys with `npx web-push generate-vapid-keys`.

# Updates
Asks the user to reload once the service worker has downloaded a new version of the app, in a `ConfirmDialogComponent` of `@service-soft/ui/dialog` that is only loaded then. "Not now" keeps the current version until the app is opened again.

It asks as well when parts of the running version can't be loaded anymore, because the service worker had to delete them, like after an update while the app was open for a long time. Only a reload helps then.

```ts
providers: [
    provideServiceWorker('ngsw-worker.js', { enabled: !isDevMode() }),
    provideUpdates({ labels: { newVersionTitle: 'Neue Version', newVersionMessage: 'Eine neue Version ist da.', reload: 'Neu laden', notNow: 'Später' } })
]
```

| Label | Default |
|---|---|
| `newVersionTitle`, `newVersionMessage` | `'New version available'`, and that it was downloaded |
| `unrecoverableTitle`, `unrecoverableMessage` | `'Reload needed'`, and that parts of this version can't be loaded anymore |
| `reload`, `notNow` | `'Reload'`, `'Not now'` |

To check for a new version yourself, call `checkForUpdate()` of `SwUpdate`.

# Moving from ngx-pwa
- The package is `@service-soft/ngx-pwa`, with an entry point each for `/offline`, `/offline-status-bar`, `/sync-dialog`, `/push-notifications` and `/updates`. It needs `@service-soft/ui` and Tailwind instead of Angular Material, and no longer lodash, uuid and dompurify.
- `NgxPwaOfflineService` and `NGX_PWA_OFFLINE_SERVICE` are `OfflineService`, which you inject directly instead of extending it. `isOffline` is the signal `offline()` and `cachedRequests` a read-only signal. `removeSingleRequest` is `remove`, and setting `cachedRequests = []` is `removeAll()`. `sync` and `syncAll` reject when they fail instead of showing a snackbar; the sync dialog shows it.
- `OfflineRequestInterceptor` with `HTTP_INTERCEPTORS` is `offlineInterceptor` with `withInterceptors`. `NGX_PWA_HTTP_CONTEXT_METADATA` is `OFFLINE_REQUEST_METADATA` and `RequestMetadata` is `OfflineRequestMetadata`.
- Only requests with metadata are kept, so the list of urls that were never kept, like `/login`, is gone. A kept request is answered with a success instead of the network error.
- `displayValue` is plain text, not html.
- A `CachedRequest` is a plain object with `method`, `url` and `body` instead of a serialized `HttpRequest`, kept under `offlineRequests` in the `localStorage`. Changes the old version kept under `requests` are converted when the app starts, with their offline ids, so users who update keep them; their html display values become plain text. New offline ids are `offline-<uuid>`.
- `<ngx-pwa-offline-status-bar>` is `<ngx-offline-status-bar>`. `offlineMessage` and `unsavedChangesMessage` are labels of `provideOfflineStatusBarConfig`, and the sync button always shows while there are changes. `<ngx-pwa-synchronize-badge>` is part of the bar.
- `NgxPwaSynchronizeDialogComponent` is `SyncDialogComponent`, opened with the `DialogService` of `@service-soft/ui/dialog`. `SynchronizeDialogData` is `provideSyncDialogConfig`.
- `NgxPwaNotificationService` is `PushNotificationService` with `providePushNotifications`, instead of a subclass. `askForNotificationPermission` is `enable`, `disableNotifications` is `disable` and `hasNotificationsEnabled` is the signal `enabled()`.
- `NgxPwaUpdateService` is `provideUpdates()`, which starts by itself, so `subscribeToUpdateEvents` is gone. `onVersionDetected` and the other hooks are gone, and `checkForUpdates` is `checkForUpdate` of `SwUpdate`. `NgxPwaVersionReadyDialogComponent` is the `ConfirmDialogComponent` of ui, and `VersionReadyDialogData` the labels of `provideUpdates`: `title` is `newVersionTitle`, `message` is `newVersionMessage`, `confirmButtonLabel` is `reload` and `cancelButtonLabel` is `notNow`. `onVersionFailed`, which was never called, is the unrecoverable state, which the dialog handles now.
- "Undo all" in the sync dialog is "Discard all", and asks before it discards.
- Fixed: syncing all changes sent the same request again and again, and a POST that got an id made the sync fail after it was sent, so it was sent once more on the next try. The dialog let the user sync a change that used an entity created offline in its body before that entity. `applyOfflineData` changed entities whose id was only part of the url, like `1` of `/todos/11`, and removed the last entity for a deleted one it didn't find. `hasNotificationsEnabled` said whether the service worker runs, not whether the user turned notifications on. The status bar didn't update in zoneless apps, and the buttons of the dialog had no names for screen readers.

# License
MIT.