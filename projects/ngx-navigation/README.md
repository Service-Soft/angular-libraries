# ngx-navigation
Builds the navigation of an app from rows of elements: a navbar whose elements move into a drawer on smaller screens, a footer, breadcrumbs from the routes, links to the sections of the current page, a row of links to the pages of a section, a switch to the current page in another language and a page for unknown urls. The routes can be defined right in the elements.

It is built on [@service-soft/ui](https://www.npmjs.com/package/@service-soft/ui) and styled with Tailwind CSS. It uses native `<dialog>`, `<details>` and popover elements, and ships no css of its own.

# Table of Contents
- [ngx-navigation](#ngx-navigation)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
- [Setup](#setup)
- [The navbar](#the-navbar)
  - [Elements](#elements)
  - [Moving into the drawer](#moving-into-the-drawer)
  - [Components of the elements](#components-of-the-elements)
  - [Conditions and actions](#conditions-and-actions)
  - [Sections of the page](#sections-of-the-page)
- [Routes in the elements](#routes-in-the-elements)
- [The footer](#the-footer)
- [Breadcrumbs](#breadcrumbs)
- [The pages of a section](#the-pages-of-a-section)
- [Switching the language](#switching-the-language)
- [The page for unknown urls](#the-page-for-unknown-urls)
- [SEO](#seo)
  - [Several languages](#several-languages)
  - [The server: sitemap, robots.txt and llms.txt](#the-server-sitemap-robotstxt-and-llmstxt)
- [Configuration](#configuration)
- [Moving from ngx-material-navigation](#moving-from-ngx-material-navigation)
- [License](#license)

# Requirements
Angular 22 with its router and `@angular/localize`, which [translates the texts](#translating), and Tailwind CSS 4. `@angular/ssr` for the [server part of the SEO](#the-server-sitemap-robotstxt-and-llmstxt).

```sh
npm install @service-soft/ngx-navigation @service-soft/ui
ng add @angular/localize
```

# Setup
Your Tailwind generates the css. Add both packages to your global stylesheet:

```css
@import "tailwindcss";
@import "@service-soft/ui";
@import "@service-soft/ngx-navigation";
```

A title is drawn in the font of the token `--font-nav-title`, the font of headings by default. Set it in your `@theme` when your name has a font of its own, like the one of your wordmark: `--font-nav-title: "Orbitron", var(--font-heading);`.

Every part lives in its own entry point, so a page only loads what it uses: `@service-soft/ngx-navigation/navbar`, `/footer`, `/anchors`, `/breadcrumbs`, `/secondary-nav`, `/language-switcher`, `/not-found`, and one for the component of each type of element, like `/nav-link`. The models and `NavigationUtilities` are in `/navigation`.

# The navbar
Describe the navbar as rows of elements, usually one, give it the component for each type of element they have, and put it above your pages:

```ts
import { NavbarRow } from '@service-soft/ngx-navigation/navigation';

export const navbarRows: NavbarRow[] = [{
    elements: [
        { type: 'image', url: '/logo.svg', alt: 'Shop, the start page', width: 40, height: 40, link: { route: '' }, collapse: 'never' },
        { type: 'title', title: 'Shop', collapse: 'never' },
        { type: 'link', name: 'Orders', route: 'orders' },
        { type: 'menu', name: 'Help', position: 'center', elements: [
            { type: 'link', name: 'Questions and answers', route: 'faq' },
            { type: 'link', name: 'Documentation', url: 'https://example.com/docs', openInNewTab: true }
        ] },
        { type: 'button', name: 'Log out', position: 'end', action: () => inject(AuthService).logout() }
    ]
}];
```

```ts
import { NavElementComponents } from '@service-soft/ngx-navigation/nav-element';
import { NavButtonComponent } from '@service-soft/ngx-navigation/nav-button';
// … and the others the rows need

export const navbarComponents: Partial<NavElementComponents> = {
    image: NavImageComponent,
    title: NavTitleComponent,
    link: NavLinkComponent,
    menu: NavMenuComponent,
    button: NavButtonComponent
};
```

```html
<ngx-navbar [rows]="navbarRows" [components]="navbarComponents" />
<main><router-outlet /></main>
<ngx-footer [rows]="footerRows" [components]="footerComponents" />
```

The navbar is a `<header>` with a `<nav>` inside, labelled "Navigation". Each row has its elements at the `start`, in the `center` and at the `end`, the start by default; on a narrow screen the three wrap below each other. Your pages are no longer inside the navbar, so lay out the page around it as you like, like making it sticky with `class="sticky top-0 z-10"` on `<ngx-navbar>`.

## Elements
| Type | What it is | Its own fields | Component |
|---|---|---|---|
| `title` | the name of the app, linked when it has a `link` | `title`, `icon?`, `link?` | `NavTitleComponent` of `/nav-title` |
| `image` | an image like the logo, linked when it has a `link`, shown with `NgOptimizedImage` | `url`, `alt`, `width`, `height`, `link?` | `NavImageComponent` of `/nav-image` |
| `link` | a link, to a route of the app with `route`, or to another site with `url` | `name`, `icon?`, `route` or `url`, `fragment?`, `openInNewTab?`, `variant?` and `color?` (of `ui-button`: drawn as a button in a row, like a call to action; a link in the drawer and in menus) | `NavLinkComponent` of `/nav-link` |
| `button` | a button that runs an action | `name`, `icon?`, `variant?` (of `ui-button`, `'text'` by default), `action` | `NavButtonComponent` of `/nav-button` |
| `menu` | links, buttons, menus and custom components under one name; a menu inside opens beside it | `name`, `icon?`, `elements` | `NavMenuComponent` of `/nav-menu` |
| `text` | plain text, like the copyright in the footer | `text` | `NavTextComponent` of `/nav-text` |
| `custom` | a component of your own, like a switch of the language | `component`, `inputs?` | its own `component` |

A `link` of a title or an image is `{ route }` or `{ url }`, like the fields of a link. A link inside the app tells screen readers when it is the current page, on its path and, if it has one, its fragment, and is underlined then. The `alt` of a linked image is the name of the link, so say where it goes.

## Components of the elements
The navbar and the footer import none of the components of the elements: `components` brings the ones their rows need, so a navbar with only a title and links never ships the code of images, menus or buttons. A menu shows the links, buttons and menus inside of it itself, so only its own type counts.

A `custom` component inside a menu shows in the menu, and in the drawer once the menu collapsed. `inject(MenuComponent, { optional: true })` of `@service-soft/ui/menu` tells it where it is, so it shows its actions as `ui-menu-item` or `ui-menu-link` in the menu, like the other items, and as buttons or links in the drawer. In the drawer, `inject(IS_IN_DRAWER)` of `@service-soft/ui/drawer` is true, like for a button that is only an icon in the row and has the room for its text in the drawer, as the [theme switcher](https://www.npmjs.com/package/@service-soft/ui#theme-switcher) and the [language switcher](#language-switcher) do.

Development builds throw when a type of the rows has no component, and when there is a component for a type no element has, as it would only make the bundle bigger. An element whose `condition` hides it still counts, as it may show later. Production builds leave the check out, and an element without a component shows nothing.

Put a component of your own in place of one of the library, like to draw links differently. It takes the inputs of a `NavElementRenderer`, the `element` and the `layout`, which is `'row'` in the navbar and the footer and `'drawer'` in the drawer:

```ts
@Component({ selector: 'app-nav-link', templateUrl: './nav-link.component.html' })
export class AppNavLinkComponent implements NavElementRenderer<NavLink> {
    readonly element: InputSignal<NavLink> = input.required<NavLink>();
    readonly layout: InputSignal<NavElementLayout> = input.required<NavElementLayout>();
}

const navbarComponents: Partial<NavElementComponents> = { link: AppNavLinkComponent, title: NavTitleComponent };
```

## Moving into the drawer
`collapse` says up to which width an element is in the drawer instead of the navbar:

| `collapse` | In the drawer |
|---|---|
| `'sm'` | below 768px, the default |
| `'md'` | below 1024px |
| `'lg'` | below 1280px |
| `'always'` | on every screen |
| `'never'` | never |

The widths are Tailwind's breakpoints `md`, `lg` and `xl`, so they follow when your theme changes them. While an element is in the drawer, a button at the end of the first row opens it. The drawer is a modal `ui-drawer`: focus stays inside, escape or a click next to it closes it, and so does following a link. A menu is a section that opens there. When the screen gets wide enough that the drawer would be empty, like a tablet turned sideways, it closes.

## Conditions and actions
Every element can have a `condition`, which says whether it is shown. Conditions and the actions of buttons run in an injection context, so they can use `inject()`, written inline or as a function:

```ts
{ type: 'link', name: 'Admin', route: 'admin', condition: () => inject(AuthService).hasPermission('admin') }
```

A condition that reads signals is checked again whenever they change, so the element shows and hides with them.

To hide the links to every route a user can't open without a condition on each, `routeCondition` of `provideNavigationConfig` decides for each link to a route of the app, from its route. It runs in an injection context too, for the route and every parent of it, as the router runs their guards as well. A path like `'admin/users'` is looked up in the routes of the router, and a link whose path they don't have, like one with parameters, shows. With [@service-soft/ngx-auth](https://www.npmjs.com/package/@service-soft/ngx-auth), a link shows only when the permissions in the data of its route pass:

```ts
provideNavigationConfig({ routeCondition: route => inject(AuthService).hasRoutePermissions(route.data ?? {}) })
```

The `condition` of the link has to pass as well.

## Sections of the page
`<ngx-nav-anchors />` of `/anchors` links to the sections of the current page, from the anchors in the data of its route, like right below the navbar. It is a navigation labelled "On this page", and shows nothing on a page without anchors. Give the sections the ids of the fragments, and let the router scroll to them:

```html
<ngx-navbar [rows]="navbarRows" [components]="navbarComponents" />
<ngx-nav-anchors />
```

```ts
{ path: 'orders', title: 'Orders', component: OrdersPage, data: { anchors: [{ name: 'Open', fragment: 'open' }, { name: 'Shipped', fragment: 'shipped' }] } }

provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }))
```

# Routes in the elements
The `route` of a link, or of the `link` of a title or an image, is a path like `'orders'`, or a whole route, which `NavigationUtilities.resolveRoutes` then collects for the router, including the ones in menus:

```ts
const navbarRows: NavbarRow[] = [{
    elements: [{ type: 'link', name: 'Orders', route: { path: 'orders', title: 'Orders', loadComponent: () => import('./orders.page') } }]
}];

provideRouter(NavigationUtilities.resolveRoutes({
    navbarRows,
    footerRows,
    routes: [{ path: 'orders/:id', title: 'Order', loadComponent: () => import('./order.page') }, { path: '**', component: NotFoundComponent }]
}))
```

It takes the routes of the navbar first, then those of the footer, then `routes`, so a route for every path (`'**'`) stays last. A path that is there several times is kept once, the first time it comes. A `NavRoute` is a route of Angular that requires `title` and `path` and types its `data`: `NavRoute<NavRouteData & MyData>`. Its `children` are `NavChildRoute`s with the same data, which need no title or path, so a function in the data of a child, like a `breadcrumb.name`, gets its route typed as well.

# The footer
`<ngx-footer [rows]="footerRows" [components]="footerComponents" />` is a `<footer>` built from rows like the navbar, with the same elements, positions and [components](#components-of-the-elements); nothing in it collapses. A menu in it opens a popover like in the navbar.

```ts
const footerRows: FooterRow[] = [{
    elements: [
        { type: 'text', text: '© 2026 Shop' },
        { type: 'link', name: 'Imprint', route: 'imprint', position: 'end' }
    ]
}];

const footerComponents: Partial<NavElementComponents> = { text: NavTextComponent, link: NavLinkComponent };
```

# Breadcrumbs
`<ngx-breadcrumbs />` shows the way from the start page to the current one, a step for every route of the url, the current page last. A step is named by the breadcrumb in the data of its route, or by its title:

```ts
{
    path: 'orders/:id',
    title: 'Order',
    component: OrderPage,
    data: { breadcrumb: { parent: 'orders', name: route => `Order ${route.paramMap.get('id')}` } }
}
```

| Field of `breadcrumb` | Does |
|---|---|
| `name` | the name of the step, a string or a function of the route that runs in an injection context; the title of the route when there is none |
| `icon` | an icon in front of the name |
| `parent` | the path of a top level route to show as the step before, for a route that isn't a child of it, like `'orders'` for `'orders/:id'` |

The first step is the start page, "Home". A route without a path of its own, like one that only groups others, is no step, and the page for unknown urls, the route with the path `'**'`, has no breadcrumbs. The steps and the anchors are also signals of the `NavigationService`, `breadcrumbs` and `anchors`, to show them your own way.

# The pages of a section
`<ngx-secondary-nav />` of `/secondary-nav` is a row of pills that link to the pages of a section, like the training, the teams and the news of a sport, below the navbar or the heading of the section. Its links are the links of the navbar, with a `route` or a `url` and a `condition` if you like:

```ts
protected readonly footballPages: NavLink[] = [
    { type: 'link', name: 'Start', route: 'football' },
    { type: 'link', name: 'Training', route: 'football/training' },
    { type: 'link', name: 'Teams', route: 'football/teams' },
    { type: 'link', name: 'Association', url: 'https://example.com/football', openInNewTab: true }
];
```

```html
<ngx-secondary-nav label="Football" [links]="footballPages" />
```

It is a navigation named by its `label`, which is required, as screen readers have to tell it apart from the navbar. The pill of the current page is filled and tells screen readers that it is the current page, on its exact path, so the start page of the section isn't current on its sub pages. Pills that don't fit, like on a phone, scroll sideways in their row, and the current one is scrolled into the middle of it. That works in every browser and keeps every pill one click away; a menu instead would have to measure the row to know when, which a server can't, so a prerendered page would jump once it loads. The pills are `ui-link` with `appearance="pill"`, their corner radius is the token `--radius-link-pill`.

# Switching the language
`<ngx-language-switcher />` of `/language-switcher` links to the current page in other languages, like at the end of the navbar or in the footer. Give it the languages, each with its name in the language itself, which is how its speakers find it:

```ts
protected readonly languages: LanguageSwitcherLanguage[] = [
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français', href: url => `https://example.fr${url}` }
];
```

```html
<ngx-language-switcher [languages]="languages" />
<ngx-language-switcher appearance="icon" [languages]="languages" />
<ngx-language-switcher appearance="list" [languages]="languages" />
```

| Input | Values | Default |
|---|---|---|
| `languages` | `LanguageSwitcherLanguage[]` | required — `code`, `label`, `subPath`, the path its build is served below, its code when it has none, and `href`, a fixed address or a function of the url of the current page; the `href` of the config when it has none |
| `current` | `string` | the `LOCALE_ID` of the app — the code of the language of the page; `en` counts for `en-US` when no code is the same |
| `appearance` | `'menu'` \| `'icon'` \| `'list'` | `'menu'` — a button with the icon of languages and the current language that opens a [menu](https://www.npmjs.com/package/@service-soft/ui#menu) of all of them, the same button with only the icon, like the theme switcher beside it, or a row of links. Inside of a `ui-drawer`, like the drawer of the navbar, the button of `'menu'` and `'icon'` is a row of the drawer with the current language |
| `label` | `string` | `'Language'` — what screen readers call it; the button is named "Language: English" |

The link to the current page in a language has its code as `hreflang` and `lang`, so search engines know the page in that language, and screen readers read its name in it. The one of the current language is marked with a check in the menu, underlined in the row, and tells screen readers that it is the current page. The links are plain hrefs, which load the page in the other language. By default they go to `/<subPath><url>`, like `/de/orders?page=2`, where Angular's i18n puts the build of every language. Give a language whose path isn't its code its `subPath`, like `{ code: 'de-CH', label: 'Deutsch', subPath: 'de' }`, the same as the `subPath` of its [SEO locale](#several-languages). Change the links for all languages with `provideLanguageSwitcherConfig({ href: (url, code, subPath) => … })`, and the `label`, the `icon` and the `appearance` there as well. Inside of a `ui-menu`, like a menu of the navbar as a `custom` element, its links are items of that menu.

# The page for unknown urls
`NotFoundComponent` is the page of the route for every other path, a centered [result](https://www.npmjs.com/package/@service-soft/ui#result) of `@service-soft/ui` with an icon, a heading, a text and a link back:

```ts
{ path: '**', title: 'Page not found', component: NotFoundComponent }
```

Change what it shows with `provideNotFoundConfig({ title, message, homeLabel, homeRoute, icon })`, or for one route with `notFound` in its data: `data: { notFound: { homeRoute: '/shop' } }`.

# SEO
Every page tells search engines and AI assistants about itself, next to its title, from the data of its routes. `provideSeoConfig` of `@service-soft/ngx-navigation/seo` writes it into the head of the document on every navigation, on the server too, so the prerendered html holds it: search engines and AI crawlers mostly read the html as it comes, without running its scripts. An app that doesn't use it ships none of it.

```ts
providers: [
    provideRouter(routes),
    provideSeoConfig({ origin: 'https://club.example', defaultImage: '/images/club.png' })
]
```

```ts
const routes: NavRoute[] = [{
    path: 'teams/:team',
    title: 'Team',
    component: TeamPage,
    data: {
        description: 'The players, practice times and results of a team.',
        structuredData: route => ({ '@context': 'https://schema.org', '@type': 'SportsTeam', name: route.paramMap.get('team') })
    }
}];
```

| Tag | From |
|---|---|
| `<meta name="description">` | `description` of the data |
| `<link rel="canonical">` | the `origin` and the path of the url, without its query and fragment |
| `<script type="application/ld+json">` | `structuredData`, an object as https://schema.org describes it, or a function of the route that resolves it in an injection context |
| `<meta name="robots">` | `robots`, like `'noindex'` for a thank-you page |
| `og:title`, `og:description`, `og:url`, `og:image` | the title of the route, the description, the canonical url and `image`, or the `defaultImage`, so a shared link and an assistant citing the page show a preview |

Each value comes from the deepest route that has it, and `NavRouteData` types them. A tag the page has no value for is removed, so none of the page before survives a navigation; leave them out of your `index.html`. The JSON-LD of the site itself, like its `Organization`, can stay there: only the one of the pages is replaced.

## Several languages
For a site that Angular i18n builds in several languages, give `locales` the languages, the source language first, each with its code and the `subPath` its build is served below:

```ts
provideSeoConfig({ origin: 'https://club.example', locales: [{ code: 'en', subPath: 'en' }, { code: 'de', subPath: 'de' }] })
```

Each build knows its language by its `LOCALE_ID`. Then the canonical url of a page has its language, like `https://club.example/de/teams`. Every page also links to itself in each language with `<link rel="alternate" hreflang>`, and to its url without a language as `x-default`, which the server redirects by the language of the visitor. `og:locale` is the language, like `de_CH`, and `og:locale:alternate` names the others. With one language, or none given, pages have no alternates and no prefix.

## The server: sitemap, robots.txt and llms.txt
`SeoServerUtilities` of `@service-soft/ngx-navigation/seo-server` gives the server of the site what it tells about all of its pages. That entry point needs `@angular/ssr`, an optional peer dependency. `resolvePages` finds them in the routes of the app, so the sitemap has every page, however it renders:

- the routes of the router config, children and lazily loaded children included;
- without redirects, the route of unknown urls, matchers, and routes whose `robots` holds `noindex`;
- the render mode of each page by the first of the server routes that matches it, `RenderMode.Server` when none does;
- without a route whose server route answers with an error, like one with no server route of its own that falls under the 404 of the route of unknown urls. It is returned in `errorRoutes`, so the server can log it;
- for a route with parameters, the pages Angular prerendered for it, and the ones `sitemap` in its data lists, like the articles of a database. `sitemap` runs in the app, in an injection context of its root, so it reads them like the pages do. A route with parameters that has neither is returned in `unlistedRoutes`;
- the title and description of each page in each language, read from its html as the app engine answers it, prerendered or rendered once. A page only a browser renders, `RenderMode.Client`, has neither, as search engines see little more of it.

The app hands the server its routes, as the server can't import them: in a site in several languages their texts are `$localize`, which only the build of each language fills in. For that, `resolvePages` has the app engine render one page on the server, which hands the app a `REQUEST_CONTEXT` that only the server can give. `provideSeoConfig` puts the routes into it, after running every `sitemap`, before that page renders. The page is an unknown url, so the route of unknown urls has to render on the server, which a 404 needs anyway: `{ path: '**', renderMode: RenderMode.Server, status: 404 }`. Without it, the first server route without parameters that renders on the server is used, and `resolvePages` throws when there is none.

```ts
{ path: 'news/:article', title: 'Article', component: ArticlePage, data: {
    sitemap: async () => {
        // inject before the first await, as in every injection context
        const articles: Article[] = await firstValueFrom(inject(ArticleService).findAll());
        return articles.map(article => ({ path: `/news/${article.slug}`, lastModified: new Date(article.updatedAt) }));
    }
} }
```

`lastModified` of the data, or of an entry of `sitemap`, is a `Date`, which the sitemap writes as the `<lastmod>` of the page in the format search engines read, like `2026-11-01T00:00:00.000Z`. It is left out when it isn't known: search engines ignore one that is always today. An invalid date throws, naming the page.

```ts
const appEngine: AngularNodeAppEngine = new AngularNodeAppEngine();
const locales: SeoLocale[] = [{ code: 'en', subPath: 'en' }, { code: 'de', subPath: 'de' }];
const site: Promise<SeoSite> = SeoServerUtilities.resolvePages({
    origin: 'https://club.example',
    serverRoutes,
    // written next to the browser and server folders by the build
    prerenderedRoutes: Object.keys(JSON.parse(readFileSync(join(import.meta.dirname, '../prerendered-routes.json'), 'utf8')).routes),
    appEngine,
    locales
});
```

The app engine renders each page of the site once for that, at the url of `origin`, so its host has to be one the app engine accepts.

| Method | Gives |
|---|---|
| `resolveSitemapFiles(pages, origin)` | the files of the sitemap by their path: every page in every language, with `xhtml:link` alternates and `x-default` when there are several. Over 50,000 urls or 50 MB, `/sitemap.xml` is an index of `/sitemap-1.xml`, `/sitemap-2.xml` and so on |
| `resolveRobotsTxt({ allowed, disallowedCrawlers, sitemapUrl })` | the robots.txt: everything allowed or, like on a stage, disallowed, the crawlers that may not read the site, and the sitemap |
| `resolveLlmsTxt(pages, locale, locales, origin)` | the [llms.txt](https://llmstxt.org) of a language: the name and description of the start page and every page that renders on the server, and where the other languages have theirs. `/llms.txt` is the one of the source language, `/<subPath>/llms.txt` the one of another |
| `findTrailingSlashRedirect(url)` | the url without a slash at the end of its path, for a 301, so each page has one url |
| `findLocaleRedirect(url, acceptLanguage, locales)` | for a url without a language, the same page in the language the visitor prefers, for a 302 with `Vary: Accept-Language`; none for the robots.txt, the llms.txt and the sitemap |
| `resolvePreferredLocale(acceptLanguage, locales)` | the language of the site the visitor prefers, by its code or its primary language, like `de` for `de-AT`, the source language when they accept none |

# Configuration
Every part reads its defaults and texts from a config, which `provideXConfig` changes, in the application config for the whole app or in a component or route for only that part of it:

| Provider | Option | Default |
|---|---|---|
| `provideNavbarConfig` | `color` | `'surface'` — or `'primary'` / `'secondary'`, a [colored surface](../ui/README.md#colored-surfaces) of ui, like the brand color behind a white wordmark. Also the input `color` of `ngx-navbar`. A colored navbar looks the same in both modes and takes the shadow of dark mode, which also shows on a section of its color below it, like a hero. The drawer keeps the colors of the page |
| | `collapse` | `'sm'` — for the elements without a collapse of their own |
| | `menuIcon` | `faBars` — the icon of the button that opens the drawer |
| | `labels` | `navigation: 'Navigation'`, `openNavigation: 'Open the navigation'` |
| `provideNavigationConfig` | `labels` | `home: 'Home'` — the first step of the breadcrumbs, `anchors: 'On this page'` — what screen readers call the links to the sections |
| | `routeCondition` | every link shows — see [conditions and actions](#conditions-and-actions) |
| `provideSeoConfig` | `origin`, `defaultImage`, `locales` | required, none, `[]` — see [SEO](#seo) |
| `provideNotFoundConfig` | `title`, `message`, `homeLabel`, `homeRoute`, `icon` | `'Page not found'`, a sentence, `'Back to the start page'`, `'/'`, `faSignsPost` |
| `provideLanguageSwitcherConfig` | `appearance`, `label`, `icon`, `href` | `'menu'`, `'Language'`, `faLanguage`, `(url, code, subPath) => '/' + subPath + url` |
| `provideBreadcrumbsConfig` of `@service-soft/ui/breadcrumbs` | `label` | `'Breadcrumbs'` — what screen readers call the breadcrumbs |
| `provideDrawerConfig` of `@service-soft/ui/drawer` | `side` | `'start'` — the edge the drawer slides in from |

The navbar and the anchors also take their label as an input: `<ngx-navbar [rows]="rows" [components]="components" label="Main" />`.

## Translating
The default texts are `$localize` with an id of their own, like `@@ngx-navigation.not-found.title`, so `ng extract-i18n` puts them into the messages of your app, and you translate them like its own texts. The library needs `@angular/localize` for that, `ng add @angular/localize`, also in an app of one language. A build with `localize` fills the texts in, so no part of `@angular/localize` reaches the browser. The defaults are made once a config is injected, so translations an app loads at runtime with `loadTranslations` apply as well. A text of `provideXConfig` replaces the default in every language. So translate a default in your messages, and change it in the config only to say something else: a default the config replaces stays in your messages, though nothing shows it.

# Moving from ngx-material-navigation
The package was ngx-material-navigation, built on Angular Material. It is built on `@service-soft/ui` now, without Material and the cdk:

- **Fewer element types.** `title`, `image`, `link`, `button`, `menu`, `text` and `custom` replace the 13 `NavElementTypes`: `TITLE_WITH_INTERNAL_LINK` and `TITLE_WITH_EXTERNAL_LINK` are a `title` with a `link` of `{ route }` or `{ url }`, the same for images; `INTERNAL_LINK` and `EXTERNAL_LINK` are a `link` with `route` or `url`; `BUTTON_FLAT` is a `button` with `variant: 'filled'`. The types are strings now, not an enum.
- **Positions** are `'start'`, `'center'` and `'end'` instead of `'left'`, `'center'` and `'right'`, so they follow right-to-left languages.
- **No ids.** Elements no longer need an `id`.
- **The components** are `ngx-navbar` (`[rows]` instead of `[navbarRows]`), `ngx-footer` (`[rows]` instead of `[footerRows]`), `ngx-breadcrumbs` and `NotFoundComponent`, each in its own entry point. The navbar and the footer need the [components of their elements](#components-of-the-elements), which kept every type in the bundle before.
- **The anchors** are no longer a row of the navbar, but `<ngx-nav-anchors />`, which you put where you like.
- **Your pages are no longer inside the navbar**, and `minHeight`, `minHeightOtherElements` and `minSidenavWidth` are gone: the navbar is as high as its content, and you lay out the page around it.
- **The sidenav is a drawer**, a modal dialog that keeps the focus, closes on escape and leaves the page behind it inert. A menu is a section that opens there.
- **The breakpoints** are Tailwind's: `md` collapses below 1024px instead of 992px, `lg` below 1280px instead of 1200px. `NGX_BURGER_MENU_ICON` and `NGX_BURGER_MENU_ARIA_LABEL` are `menuIcon` and `labels.openNavigation` of `provideNavbarConfig`.
- **Conditions** follow the signals they read; one that reads no signals is checked once.
- **Images** need an `alt` now, and a title is no `h1` anymore: the heading of a page belongs to the page.
- **The route data** is `breadcrumb` instead of `breadcrumbConfig` (with `parent` instead of `parentRoute`, and without `ariaLabel`, the name is the label), and `notFound` instead of `pageNotFoundConfig`. The first step of the breadcrumbs is "Home" instead of "Start", changed with `provideNavigationConfig`. The page for unknown urls has no breadcrumbs because of its path `'**'`, so it no longer needs a config for that.
- **`NavUtilities.getAngularRoutes(navbarRows, footerRows, routes)`** is `NavigationUtilities.resolveRoutes({ navbarRows, footerRows, routes })`. It now removes routes whose path is there twice, which the old one never did.
- **`NgxMatNavigationService`** is `NavigationService`, with signals instead of subjects, and no longer needs an `APP_INITIALIZER`.
- **Custom components** no longer extend `NgxMatNavigationBaseNavElementComponent`: any component works, and gets its `inputs`. `closeSidenavOnClick` and `closeMenuOnClick` are gone; the drawer closes on every navigation.

# License
MIT
