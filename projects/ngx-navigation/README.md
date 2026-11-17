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
- [Configuration](#configuration)
- [Moving from ngx-material-navigation](#moving-from-ngx-material-navigation)
- [License](#license)

# Requirements
Angular 22 with its router, and Tailwind CSS 4.

```sh
npm install @service-soft/ngx-navigation @service-soft/ui
```

# Setup
Your Tailwind generates the css. Add both packages to your global stylesheet:

```css
@import "tailwindcss";
@import "@service-soft/ui";
@import "@service-soft/ngx-navigation";
```

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
| `link` | a link, to a route of the app with `route`, or to another site with `url` | `name`, `icon?`, `route` or `url`, `fragment?`, `openInNewTab?` | `NavLinkComponent` of `/nav-link` |
| `button` | a button that runs an action | `name`, `icon?`, `variant?` (of `ui-button`, `'text'` by default), `action` | `NavButtonComponent` of `/nav-button` |
| `menu` | links, buttons, menus and custom components under one name; a menu inside opens beside it | `name`, `icon?`, `elements` | `NavMenuComponent` of `/nav-menu` |
| `text` | plain text, like the copyright in the footer | `text` | `NavTextComponent` of `/nav-text` |
| `custom` | a component of your own, like a switch of the language | `component`, `inputs?` | its own `component` |

A `link` of a title or an image is `{ route }` or `{ url }`, like the fields of a link. A link inside the app tells screen readers when it is the current page, on its path and, if it has one, its fragment, and is underlined then. The `alt` of a linked image is the name of the link, so say where it goes.

## Components of the elements
The navbar and the footer import none of the components of the elements: `components` brings the ones their rows need, so a navbar with only a title and links never ships the code of images, menus or buttons. A menu shows the links, buttons and menus inside of it itself, so only its own type counts.

A `custom` component inside a menu shows in the menu, and in the drawer once the menu collapsed. `inject(MenuComponent, { optional: true })` of `@service-soft/ui/menu` tells it where it is, so it shows its actions as `ui-menu-item` or `ui-menu-link` in the menu, like the other items, and as buttons or links in the drawer.

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

It takes the routes of the navbar first, then those of the footer, then `routes`, so a route for every path (`'**'`) stays last. A path that is there several times is kept once, the first time it comes. A `NavRoute` is a route of Angular that requires `title` and `path` and types its `data`: `NavRoute<NavRouteData & MyData>`.

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
<ngx-language-switcher appearance="list" [languages]="languages" />
```

| Input | Values | Default |
|---|---|---|
| `languages` | `LanguageSwitcherLanguage[]` | required — `code`, `label` and `href`, a fixed address or a function of the url of the current page; the `href` of the config when it has none |
| `current` | `string` | the `LOCALE_ID` of the app — the code of the language of the page; `en` counts for `en-US` when no code is the same |
| `appearance` | `'menu'` \| `'list'` | `'menu'` — a button with a globe and the current language that opens a [menu](https://www.npmjs.com/package/@service-soft/ui#menu) of all of them, or a row of links |
| `label` | `string` | `'Language'` — what screen readers call it; the button is named "Language: English" |

The link to the current page in a language has its code as `hreflang` and `lang`, so search engines know the page in that language, and screen readers read its name in it. The one of the current language is marked with a check in the menu, underlined in the row, and tells screen readers that it is the current page. The links are plain hrefs, which load the page in the other language. By default they go to `/<code><url>`, like `/de/orders?page=2`, where Angular's i18n puts the build of every language; change that for all languages with `provideLanguageSwitcherConfig({ href: (url, code) => … })`, and the `label`, the `icon` and the `appearance` there as well. Inside of a `ui-menu`, like a menu of the navbar as a `custom` element, its links are items of that menu.

# The page for unknown urls
`NotFoundComponent` is the page of the route for every other path, a centered [result](https://www.npmjs.com/package/@service-soft/ui#result) of `@service-soft/ui` with an icon, a heading, a text and a link back:

```ts
{ path: '**', title: 'Page not found', component: NotFoundComponent }
```

Change what it shows with `provideNotFoundConfig({ title, message, homeLabel, homeRoute, icon })`, or for one route with `notFound` in its data: `data: { notFound: { homeRoute: '/shop' } }`.

# Configuration
Every part reads its defaults and texts from a config, which `provideXConfig` changes, in the application config for the whole app or in a component or route for only that part of it:

| Provider | Option | Default |
|---|---|---|
| `provideNavbarConfig` | `collapse` | `'sm'` — for the elements without a collapse of their own |
| | `menuIcon` | `faBars` — the icon of the button that opens the drawer |
| | `labels` | `navigation: 'Navigation'`, `openNavigation: 'Open the navigation'` |
| `provideNavigationConfig` | `labels` | `home: 'Home'` — the first step of the breadcrumbs, `anchors: 'On this page'` — what screen readers call the links to the sections |
| `provideNotFoundConfig` | `title`, `message`, `homeLabel`, `homeRoute`, `icon` | `'Page not found'`, a sentence, `'Back to the start page'`, `'/'`, `faSignsPost` |
| `provideLanguageSwitcherConfig` | `appearance`, `label`, `icon`, `href` | `'menu'`, `'Language'`, `faGlobe`, `(url, code) => '/' + code + url` |
| `provideBreadcrumbsConfig` of `@service-soft/ui/breadcrumbs` | `label` | `'Breadcrumbs'` — what screen readers call the breadcrumbs |
| `provideDrawerConfig` of `@service-soft/ui/drawer` | `side` | `'start'` — the edge the drawer slides in from |

The navbar and the anchors also take their label as an input: `<ngx-navbar [rows]="rows" [components]="components" label="Main" />`.

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
