# ngx-tracking
Tracking for Angular websites that asks for consent first, as the GDPR requires: a consent dialog where the user chooses what to allow, and trackings that only load and send anything once allowed. Google Analytics, Google Tag Manager and the Meta Pixel are built in, and you can send visits and events to your own backend. A funnel shows the results.

Everything works with server-side rendering: on the server nothing is tracked, stored or asked.

# Table of Contents
- [ngx-tracking](#ngx-tracking)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
- [Setup](#setup)
- [Trackings](#trackings)
  - [Your own tracking](#your-own-tracking)
- [Consent dialog](#consent-dialog)
- [Embedded content](#embedded-content)
- [Funnel](#funnel)
- [Translating](#translating)
- [Moving from ngx-material-tracking](#moving-from-ngx-material-tracking)
- [License](#license)

# Requirements
Angular 22 with the router and `@angular/localize`, which [translates the texts](#translating). The consent dialog, the button of the privacy settings and the funnel also need [@service-soft/ui](https://www.npmjs.com/package/@service-soft/ui) and Tailwind CSS 4.

```sh
npm install @service-soft/ngx-tracking @service-soft/ui
ng add @angular/localize
```

```css
@import "tailwindcss";
@import "@service-soft/ui";
@import "@service-soft/ngx-tracking";
```

# Setup
List your trackings, say what the user sees, and configure the built-in trackings you use:

```ts
// app.config.ts
providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideTrackingConsent({
        trackings: [
            { name: 'Google Analytics', description: ['Counts visits. Shared with Google.'], service: GoogleAnalyticsService },
            { name: 'Meta Pixel', description: ['Measures our ads. Shared with Meta.'], service: MetaPixelService }
        ],
        // loaded only when it shows
        ui: () => import('@service-soft/ngx-tracking/consent-dialog').then(m => m.ConsentDialogUi)
    }),
    provideGoogleAnalytics({ measurementId: 'G-XXXXXXXXXX' }),
    provideMetaPixel({ pixelId: '1234567890' })
]
```

`provideTrackingConsent` creates every tracking when the app starts, so they track from the first navigation on. Say when the user is asked with `askOn`:

| `askOn` | Asks |
|---|---|
| `'interaction'` | at the first click, tap, key, scroll, wheel or mouse move on the page, once. The best for a website: the visitor sees the page first and still decides before doing anything with it, and the dialog is not part of how fast the page loads. Opened with the page, it would be its largest paint, and rated as the page loading slowly |
| `'navigation'` | at the end of every navigation, like the `consentGuard` on every route |
| left out | only where the `consentGuard` is, which asks when a route opens and never blocks the navigation. Like to leave it off the imprint and the privacy policy |

```ts
provideTrackingConsent({ trackings, ui: () => import('@service-soft/ngx-tracking/consent-dialog').then(m => m.ConsentDialogUi), askOn: 'interaction' })
```

```ts
const routes: Routes = [{ path: '', component: HomeComponent, canActivate: [consentGuard] }];
```

Either way, a user who chose already is not asked until their choices expire, and nothing is asked on the server, so no prerendered page holds any of the dialog and nobody who chose sees it flicker. The code of the dialog stays in the chunk of `ui`, loaded only when it opens.

Let the user change their choices later, as easily as they made them, on every page. `PrivacySettingsComponent` of `@service-soft/ngx-tracking/privacy-settings` is a button in the bottom start corner of the screen that opens the dialog again. Put it once in the layout of your app:

```html
<router-outlet />
<ngx-privacy-settings />
```

It floats over the content, filled in `secondary` and raised by a shadow, below snackbars, which cover it while they show. While it is on the page, the page has scroll padding at the bottom, so an element that is scrolled into view, like by the focus, never ends up under it. It shows a cookie and is named "Privacy settings" for screen readers. It is round by the token `--radius-floating-button` of ui. Change its color with its input `color` (`primary`, `secondary`, `error` or `success`), and the color and the name for the whole app with `providePrivacySettingsConfig({ color, label })`, like to translate it. It looks like the [back to top button](https://www.npmjs.com/package/@service-soft/ui#back-to-top) of ui, which takes the other corner.

Or open the dialog from a link of your own, like in the footer:

```ts
protected readonly consentService: ConsentService = inject(ConsentService);
```

```html
<button ui-link type="button" (click)="consentService.openDialog()">Privacy settings</button>
```

| Option of `provideTrackingConsent` | Default |
|---|---|
| `trackings` | required — every tracking of the app |
| `ui` | required — loads what the user sees, with a dynamic `import()` |
| `choicesDuration` | one month — how long the choices are kept before the user is asked again, in milliseconds |
| `respectDoNotTrack` | `true` — a browser that sends Global Privacy Control or Do Not Track gets only what is required, without asking, and a notice that says so |
| `askOn` | only where the `consentGuard` is — `'interaction'` or `'navigation'` to ask on every page |

# Trackings
Each tracking is in its own entry point, so only the ones you import end up in your bundle. They load nothing and send nothing before the user allowed them, events included.

| Service | Entry point | Config |
|---|---|---|
| `GoogleAnalyticsService` | `@service-soft/ngx-tracking/google-analytics` | `provideGoogleAnalytics({ measurementId })` |
| `GoogleTagManagerService` | `@service-soft/ngx-tracking/google-tag-manager` | `provideGoogleTagManager({ containerId })` |
| `MetaPixelService` | `@service-soft/ngx-tracking/meta-pixel` | `provideMetaPixel({ pixelId })` |

Each sends the page view of every page, and of the page the user allowed it on. Send events with `trackEvent`, which does nothing while the tracking isn't allowed:

```ts
inject(GoogleAnalyticsService).trackEvent('purchase', { value: 99.9, currency: 'EUR' });
inject(MetaPixelService).trackEvent('Purchase', { value: 99.9, currency: 'EUR' });
```

They set up `gtag` and `fbq` themselves and only load the external scripts of Google and Meta, so your content security policy needs no inline scripts for them. When the user forbids a tracking again, Google Analytics gets its opt-out flag and the Meta Pixel its consent revoked, which stops them on the current page. Google Tag Manager has no such switch: the tags it already started run until the page loads again.

## Your own tracking
Extend `CustomTrackingService` to send the visits of pages and your own events to your backend, and list it in the trackings:

```ts
@Service()
export class ShopAnalyticsService extends CustomTrackingService {
    override readonly storageKey: string = 'shopAnalytics';
    override readonly gdprCategory: GdprCategory = GdprCategory.ENABLED_BY_DEFAULT;
    override readonly domain: string = 'shop.example.com';
    override readonly visitUrl: string = `${environment.apiUrl}/visits`;
    override readonly eventUrl: string = `${environment.apiUrl}/events`;
}
```

It sends a `TrackingVisit` on every navigation, and a `TrackingEvent` for every `trackEvent`. For something else entirely, extend `TrackingService` and implement `onNavigationEnd`, which is only called while the user allowed the tracking. Override `enable` and `disable` to start and stop it.

The `gdprCategory` decides how the consent dialog shows a tracking:

| Category | In the consent dialog |
|---|---|
| `GdprCategory.TECHNICAL_NECESSARY` | always on, the user can't turn it off. Only for what the website needs to work |
| `GdprCategory.ENABLED_BY_DEFAULT` | checked at first. Courts have ruled that a pre-checked box is no consent, so use it only for trackings that need none where your website runs |
| `GdprCategory.DISABLED_BY_DEFAULT` | unchecked at first |

Nothing that needs consent is allowed before the user pressed a button in the dialog, whatever its category.

# Consent dialog
`ConsentDialogUi` from `@service-soft/ngx-tracking/consent-dialog` shows a modal dialog with a checkbox for every tracking, grouped by category. Escape doesn't close it: the user chooses with "Save choices", "Only required" or "Allow all", and refusing looks as prominent as allowing. Nothing changes before they press one of them. Links to your privacy policy and imprint open in a new tab, so the dialog stays.

Change its texts and links with `provideConsentDialogConfig` of `@service-soft/ngx-tracking/consent`, like to translate them. It is part of `/consent` rather than of `/consent-dialog`, so the app configures the dialog without loading it: an import of `/consent-dialog` in the application config puts the whole dialog into the first load. Values you leave out keep their defaults, labels included:

```ts
provideConsentDialogConfig({
    paragraphs: ['Wir nutzen Cookies, um unsere Website zu verbessern.'],
    privacyUrl: '/datenschutz',
    labels: { title: 'Datenschutz', allowAll: 'Alle erlauben', categories: { [GdprCategory.DISABLED_BY_DEFAULT]: 'Werbung' } }
})
```

| Option | Default |
|---|---|
| `paragraphs` | two English sentences about what is tracked and that the choices can be changed |
| `privacyUrl`, `imprintUrl` | `'/privacy'`, `'/imprint'` |
| `showOnlyCategories` | `false` — whether the user only chooses categories instead of every tracking |
| `labels` | the English texts of the dialog and of the notice about Do Not Track |

For a ui of your own, extend `ConsentUi` and load your class in `provideTrackingConsent` instead.

# Embedded content
Content of a third party, like a map or a video, sends data to it as soon as it loads, so it needs consent as well. The [consent gate](https://www.npmjs.com/package/@service-soft/ui#consent-gate) and the [map](https://www.npmjs.com/package/@service-soft/ui#map) of `@service-soft/ui` show a placeholder until the user allows it. Make each provider a tracking of the consent dialog, which then lists it next to the others, by extending `EmbedTrackingService` of `@service-soft/ngx-tracking/consent-gate`. It tracks nothing itself and is unchecked at first:

```ts
@Service()
export class GoogleMapsConsent extends EmbedTrackingService {
    override readonly storageKey: string = 'googleMapsConsent';
}
```

```ts
provideTrackingConsent({
    trackings: [{ name: 'Google Maps', description: ['Shows the map on the contact page. Google receives your IP address.'], service: GoogleMapsConsent }],
    ui: () => import('@service-soft/ngx-tracking/consent-dialog').then(m => m.ConsentDialogUi)
})
```

Then bind the gate or the map to it with `ngxConsentTracking`:

```ts
protected readonly googleMapsConsent: Type<GoogleMapsConsent> = GoogleMapsConsent;
```

```html
<ui-map alwaysAllow [location]="location" [ngxConsentTracking]="googleMapsConsent" />
```

Where the user allowed the tracking, the content loads right away, in the browser after the first render, so the page rendered on the server shows the placeholder. "Load" loads it this once; "Always allow" allows the tracking, which the consent dialog shows from then on. The gate follows the consent while it shows: allowing the tracking in the consent dialog loads the content at once, forbidding it removes the content again, also content that was loaded this once.

Every tracking has `enabled`, a signal of whether the user allowed it, so anything of your own can follow the consent the same way, like `@if (mapsConsent.enabled()) { … }` or in a `computed`.

# Funnel
Shows how many visitors reached each step, like visit, add to cart and purchase, with their share of the first step:

```ts
import { FunnelComponent } from '@service-soft/ngx-tracking/funnel';
```

```html
<h2 class="font-heading text-title">Checkout</h2>
<ngx-funnel [funnelPoints]="[{ name: 'Visit', value: 1840 }, { name: 'Purchase', value: 96 }]" />
```

The steps are a list screen readers read, and the shapes only repeat them. They are drawn in `--color-primary`. Without a heading before it, give it a `label`.

# Translating
The default texts are `$localize` with an id of their own, like `@@ngx-tracking.consent.title`, so `ng extract-i18n` puts them into the messages of your app, and you translate them like its own texts. The library needs `@angular/localize` for that, `ng add @angular/localize`, also in an app of one language. A build with `localize` fills the texts in, so no part of `@angular/localize` reaches the browser. The defaults are made once a config is injected, so translations an app loads at runtime with `loadTranslations` apply as well. A text of `provideConsentDialogConfig` or `providePrivacySettingsConfig` replaces the default in every language. So translate a default in your messages, and change it in the config only to say something else: a default the config replaces stays in your messages, though nothing shows it.

# Moving from ngx-material-tracking
- The package is `@service-soft/ngx-tracking`, with an entry point each for `/consent`, `/consent-dialog`, `/custom-tracking`, `/google-analytics`, `/google-tag-manager`, `/meta-pixel` and `/funnel`. It needs `@service-soft/ui` and Tailwind instead of the Angular CDK and the Font Awesome packages.
- `NGX_GDPR_TRACKINGS` and the `APP_INITIALIZER` are `provideTrackingConsent({ trackings, ui })`, which creates the services itself. `TrackingServiceClass` is `service`. `NGX_HAS_MADE_GDPR_CHOICES_DURATION_IN_MS` is `choicesDuration`, `NGX_GDPR_DNT_SETTINGS` is `respectDoNotTrack` and the `doNotTrackNotice` label.
- `GdprService` is `ConsentService`: `hasMadeGdprChoices` is the read-only `hasMadeChoices`, `openDialog` stays, `enableAllTrackings` and `disableAllTrackings` are `allowAll` and `allowOnlyRequired`, and `saveChoices` saves any choice. `GdprGuard` is `consentGuard`.
- The ids are configs: `NGX_GOOGLE_ANALYTICS_ID` is `provideGoogleAnalytics({ measurementId })`, `NGX_GOOGLE_TAG_MANAGER_ID` is `provideGoogleTagManager({ containerId })`, `NGX_PIXEL_ID` is `provideMetaPixel({ pixelId })`. `NGX_GOOGLE_ANALYTICS_ANONYMIZE_IP` is gone: Google Analytics 4 always anonymizes ips.
- `PixelService` is `MetaPixelService`, and `trackEvent(method, name, properties)` is `trackEvent(name, properties)` for standard events and `trackCustomEvent(name, properties)` for your own. `PixelEventName` and `PixelEventProperties` are `MetaPixelEventName` and `MetaPixelEventProperties`.
- `BaseTrackingService` is `TrackingService`, and `CustomTrackingService` has no type parameters for its metadata and visits. Their constants are lower case: `METADATA_KEY` is `storageKey`, `GDPR_CATEGORY` is `gdprCategory`, `DOMAIN`, `VISIT_API_URL` and `EVENT_API_URL` are `domain`, `visitUrl` and `eventUrl`. Every tracking injects what it needs, so they have no constructors. The choices are kept in the `localStorage`, so `METADATA_LOCATION`, `metadata` and `cookieStorage` are gone, and users are asked once more after the update.
- `onNavigationEnd` is only called while the tracking is allowed, so it no longer checks that itself.
- `GDPR_DIALOG_PANEL_CLASS` and `NGX_GDPR_DIALOG_DATA` are `provideConsentDialogConfig`. `text` was html; it is `paragraphs` now, and the links are `privacyUrl` and `imprintUrl`. `displayCloseAllowsAll` is gone: closing the dialog can't count as consent. `categoriesOpenedByDefault` is gone, the categories are always open.
- Switches in the dialog no longer allow a tracking right away; nothing changes before the user pressed a button.
- `ScriptService` only loads external scripts, by `loadScript(id, src)`, and `loadTemporaryJsScript` is gone.
- `<ngx-mat-tracking-funnel>` is `<ngx-funnel>`. It no longer renders a heading, so write the one that fits your page. `colors` is gone: it uses the tokens of `@service-soft/ui`.
- Fixed: the Meta Pixel loaded its script on `trackEvent` without consent, Google Analytics sent the whole url as the path of a page, and every switch of the dialog told screen readers it was disabled.

# License
MIT.