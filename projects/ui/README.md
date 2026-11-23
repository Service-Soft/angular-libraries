# ui
A design system for Angular, styled with Tailwind CSS and themed through one set of design tokens. It brings the tokens and the basic components the other `@service-soft` libraries, like [@service-soft/ngx-change-sets](https://www.npmjs.com/package/@service-soft/ngx-change-sets), are built on.

Every component lives in its own entry point, so a project only ships the code of the components it imports. The components are built on native elements, like `<details>`, `<dialog>` and popovers, and ship no css of their own.

# Table of Contents
- [ui](#ui)
- [Table of Contents](#table-of-contents)
- [Usage](#usage)
  - [Styling setup](#styling-setup)
  - [Theming](#theming)
    - [Colored surfaces](#colored-surfaces)
  - [Dark mode](#dark-mode)
  - [Translating](#translating)
- [Components](#components)
  - [Button](#button)
  - [Input string](#input-string)
  - [Input number](#input-number)
  - [Input textarea](#input-textarea)
  - [Input select](#input-select)
  - [Input boolean](#input-boolean)
  - [Input date](#input-date)
  - [Input date range](#input-date-range)
  - [Input time](#input-time)
  - [Input slider](#input-slider)
  - [Input file](#input-file)
  - [Input autocomplete](#input-autocomplete)
  - [Input chips](#input-chips)
  - [Input cards](#input-cards)
  - [An input of your own](#an-input-of-your-own)
  - [Form](#form)
  - [Form draft](#form-draft)
  - [Spam protection](#spam-protection)
  - [Stepper](#stepper)
  - [Link](#link)
  - [Icon](#icon)
  - [Spinner](#spinner)
  - [Loading](#loading)
  - [Empty state](#empty-state)
  - [Avatar](#avatar)
  - [Rating](#rating)
  - [Rating badge](#rating-badge)
  - [Details](#details)
  - [Data list](#data-list)
  - [Card](#card)
  - [Testimonial](#testimonial)
  - [Person card](#person-card)
  - [Address](#address)
  - [Opening hours](#opening-hours)
  - [Consent gate](#consent-gate)
  - [Iframe](#iframe)
  - [Map](#map)
  - [Heading](#heading)
  - [Section](#section)
  - [Callout](#callout)
  - [Media split](#media-split)
  - [Check list](#check-list)
  - [Steps](#steps)
  - [Timeline](#timeline)
  - [Stat](#stat)
  - [Logo cloud](#logo-cloud)
  - [Price](#price)
  - [Pricing card](#pricing-card)
  - [FAQ](#faq)
  - [Dialog](#dialog)
  - [Drawer](#drawer)
  - [Breadcrumbs](#breadcrumbs)
  - [Menu](#menu)
  - [Theme switcher](#theme-switcher)
  - [Pagination](#pagination)
  - [Popover](#popover)
  - [Snackbar](#snackbar)
  - [Result](#result)
  - [Back to top](#back-to-top)
  - [News ticker](#news-ticker)
  - [Table](#table)
  - [Scroll region](#scroll-region)
  - [Local table](#local-table)
  - [Tabs](#tabs)
  - [Event calendar](#event-calendar)
  - [Date period](#date-period)
  - [Byline](#byline)
  - [Article card](#article-card)
  - [Showcase card](#showcase-card)
  - [Rich text](#rich-text)
  - [Table of contents](#table-of-contents)
  - [Footnotes](#footnotes)
  - [Search toolbar](#search-toolbar)
  - [Filter tiles](#filter-tiles)
  - [Category overview](#category-overview)
  - [Gallery](#gallery)
  - [Badge](#badge)
  - [Expandable text](#expandable-text)
- [Components given as a map](#components-given-as-a-map)
- [License](#license)

# Usage
It requires Angular 22 with `@angular/localize`, which [translates the texts](#translating), and Tailwind CSS 4:

```sh
npm install @service-soft/ui
ng add @angular/localize
```

The icons it draws itself, like the one that shows a password, come from `@fortawesome/free-solid-svg-icons`, a peer dependency npm installs with it. Your app and every library share that one copy, and only the icons that are imported end up in the bundle.

## Styling setup
The libraries ship no css of their own. Instead, your Tailwind generates it, together with the css of your app. Add `@service-soft/ui` and every other library you use to your global stylesheet:

```css
@import "tailwindcss";
@import "@service-soft/ui";
@import "<library>";
```

`@service-soft/ui` brings the default values of the design tokens, and each library import makes Tailwind read that library's classes. If you only need the tokens, without its components, import `@service-soft/ui/theme.css` instead.

### Only the css of the components you use
Importing a library makes Tailwind read all of its components, also the ones your app never uses. For the smallest css, run Tailwind a second time after `ng build`, over the build output, which only holds the components that end up in your app. Lazy chunks count as well, so everything a page may load keeps its classes:

```css
/* src/styles.production.css */
@import "tailwindcss" source(none);
@import "@service-soft/ui/theme.css";
@source "../dist/my-app/browser/**/*.js";
```

```json
"build:prod": "ng build && for f in dist/my-app/browser/styles-*.css; do npx @tailwindcss/cli -i src/styles.production.css -o \"$f\" --minify; done"
```

Scan only the `.js` files: the stylesheet of the first build and the critical css Angular inlines into `index.html` hold every class of the first pass as a selector. The result replaces the stylesheet of the build under its hashed name, which `index.html` links to. Keep your own `@theme` overrides in the file as well. The workspace's styling test compares the sizes of both passes on the showcase.

Then import components from their entry points:

```ts
import { ButtonComponent } from '@service-soft/ui/button';
```

## Theming
Every library uses the same tokens, like `--color-primary` and `--color-on-primary`. The `theme.css` of the package lists all of them and what they are used for. Override them in your own `@theme`, after the imports:

```css
@theme {
    --color-primary: light-dark(#0e7068, #5fd5c3);
}
```

The tokens are regular Tailwind theme variables, so you can use them in your own templates as well (`bg-primary`, `text-on-primary`).

Every color comes with an `on-` color for the content on top of it. Never set one without checking the other.

Hover and pressed colors (`--color-primary-hover`, `--color-primary-pressed`, `--color-primary-tint`, `--color-primary-tint-pressed`, …) and `--color-primary-faint`, behind the stripes of tables and lists, are calculated from the base colors, so they follow your overrides. If one looks too weak or too strong for your color, override its percentage too.

A color too light to be text on a surface has a `-text` token for that: `--color-secondary-text`, `--color-success-text` and `--color-warning-text` are used for text, icons and focus rings on surfaces, the color itself for fills. Override them together with their color.

### Colored surfaces
`surface-primary` and `surface-secondary` turn any element into a colored surface, like a primary drawer: the element gets the color as its background, and the content inside of it the colors that work on it, so links, buttons, inputs and details keep their contrast without knowing:

```html
<aside class="surface-primary rounded-lg p-4">
    <div><a ui-link href="/help">Help</a> <button ui-button type="button">Ask</button></div>
</aside>
```

The content takes them from the direct children of the element, so wrap it in one. They are the tokens `--color-on-primary-variant` (hints), `--color-on-primary-outline` (borders of controls), `--color-on-primary-outline-variant`, `--color-primary-surface-container` (areas like input fields), `--color-on-primary-tint` and `-tint-pressed` (behind colored text, like a text button) and `--color-on-primary-hover` and `-pressed` (a filled button, which is the on- color with the color as its text), and the same for secondary. They are calculated from the color and its on- color, and the contrast tests check them like the others. Status colors as text, like an error message, keep the colors they have on the surface, so a form with validation belongs on the surface.

A colored surface looks the same in light and dark mode: it is always light, so every `light-dark()` inside of it, and the `dark:` variant, take their light value. Primary is a color for text in dark mode, light on the dark surface, while a navbar, a hero or a call to action wants the deep brand color with its white text in both modes.

Text uses the roles of the type scale: `text-display`, `text-headline`, `text-title`, `text-body`, `text-body-sm`, `text-label-sm` (for dense content like a badge or a count), `text-label` and `text-label-lg`. Each sets the size, line height and weight together, so you can change the whole scale through the `--text-*` tokens. The page uses `--font-body`, and headings use `font-heading`, which follows the body font until you set it:

```css
@theme {
    --font-body: "Inter", ui-sans-serif, system-ui, sans-serif;
    --font-heading: "Fraunces", serif;
}
```

The titles in the navbar and the footer of [ngx-navigation](https://www.npmjs.com/package/@service-soft/ngx-navigation) use `--font-nav-title`, which follows the heading font until you set it, like to the font of your wordmark.

The default is the font of the operating system, which costs nothing to load. When you add your own, host it yourself with `font-display: swap` and preload the files the first screen needs. That keeps text visible while the font loads, and keeps the layout from jumping when it arrives, which search engines measure.

Shadows come in five elevation levels, from `shadow-1` to `shadow-5`: cards and elevated buttons sit on 1, menus and popovers on 2, dialogs on 3, and hovering raises an elevated element by one level. They are darker in dark mode, where a light shadow would not show.

## Dark mode
Every color token has a value for light and one for dark mode, written as `light-dark(<light>, <dark>)`. Give your overrides both as well: a single color is used in both modes, and a brand color that works on white rarely works on a dark surface.

The default dark surface is a gray with a touch of blue, `#2a2a35`, and `surface-container` is darker than it, `#1a1a26`, like the header and the code of the documentation of zibri. [Colored surfaces](#colored-surfaces) keep their light look.

By default the page follows the operating system. To let users choose, use the [theme switcher](#theme-switcher), which sets the class `light` or `dark` on `<html>` and remembers the choice. The classes work on any element, so a part of the page can have the other mode too:

```html
<html class="dark">
<footer class="light">…</footer>
```

Use the surface on your `body`, so the page background switches with the components:

```html
<body class="bg-surface text-on-surface">
```

Tailwind's `dark:` variant follows the same rules. You rarely need it, since the tokens switch by themselves.

## Translating
The default texts are `$localize` with an id of their own, like `@@ui.table.selectAllLabel`, so `ng extract-i18n` puts them into the messages of your app, and you translate them like its own texts. The library needs `@angular/localize` for that, `ng add @angular/localize`, also in an app of one language. A build with `localize` fills the texts in, so no part of `@angular/localize` reaches the browser. The defaults are made once a config is injected, so translations an app loads at runtime with `loadTranslations` apply as well. A text of `provideXConfig` replaces the default in every language. So translate a default in your messages, and change it in the config only to say something else: a default the config replaces stays in your messages, though nothing shows it.

# Components
Every input of a component has a default you can change for the whole app, or for only a part of it, with its `provideXConfig` function. Values you leave out keep the defaults of the parent.

## Button
Styles a native `button` or `a`, so they keep their semantics, focus handling and form behaviour:

```html
<button ui-button type="submit">Save</button>
<button ui-button variant="outlined" color="error" size="sm">Delete</button>
<a ui-button href="/docs" variant="text">Docs</a>
```

| Input | Values | Default |
|---|---|---|
| `variant` | `filled`, `outlined`, `text` | `filled` |
| `color` | `primary`, `secondary`, `error`, `success` | `primary` — `success` for an action that confirms something positive, like approving a request. Outlined and text buttons draw it as `success-text`, which stays readable on `surface-container` and on its tints |
| `size` | `sm`, `md`, `lg` | `md` |
| `elevation` | `0` to `5` | `0` — the shadow level, raised by one on hover. Outlined and text buttons get the surface as fill. Bind it as a number: `[elevation]="1"` |
| `disabled` | `boolean` | `false` — a disabled link gets `aria-disabled` and can't be focused or clicked |
| `iconOnly` | `boolean` | `false` — makes the button square, for a single icon without text |
| `pressed` | `boolean` | — makes it a toggle button, see below |

A toggle button switches something on or off, like a filter. Bind `pressed` to its state: screen readers announce whether it is pressed, and while it is, it is drawn filled. Leave it unset on buttons that do something, and don't use it on links:

```html
<button ui-button type="button" variant="outlined" [pressed]="showErrors()" (click)="showErrors.set(!showErrors())">Errors</button>
```

Icons are yours: put any `svg` into the button, inline or inside an icon component of your icon set. The button sizes it to the text and spaces it from the label. Draw it with `currentColor`, so it takes the color of the button, and hide it from screen readers with `aria-hidden="true"`, since the label already says what the button does:

```html
<button ui-button type="button"><svg aria-hidden="true">…</svg> Add</button>
<button ui-button type="button" iconOnly aria-label="Add"><svg aria-hidden="true">…</svg></button>
```

An icon-only button has no text, so it needs an `aria-label` or `aria-labelledby`. Development builds report a missing one through Angular's `ErrorHandler`, which logs it to the console.

A label that doesn't fit wraps and makes the button taller, so it never overflows with larger text or on narrow screens. Every variant has a border, transparent where you don't see it, which keeps the shape of the button visible in forced colors mode.

```ts
// app.config.ts
providers: [provideButtonConfig({ variant: 'outlined', size: 'sm' })]
```

The corner radius of every button is the token `--radius-button`.

## Link
Styles a native link, or a button that should look like one. It stays your own element, so `routerLink`, `href`, `target` and `routerLinkActive` work as on any link, and middle clicks, new tabs and crawlers too:

```html
<p>By ordering you accept the <a ui-link routerLink="/terms">terms of service</a>.</p>

<nav aria-label="Main">
    <a ui-link appearance="nav" routerLink="/orders" routerLinkActive ariaCurrentWhenActive="page">Orders</a>
    <a ui-link appearance="nav" href="https://example.com/docs">Documentation</a>
</nav>

<button ui-link appearance="nav" block type="button" (click)="logOut()">Log out</button>
```

| Input | Values | Default |
|---|---|---|
| `appearance` | `'inline'` \| `'nav'` \| `'plain'` \| `'subtle'` \| `'menu'` \| `'pill'` | `'inline'` — underlined inside text; an item of a navigation, at least 40px high, with the current page underlined; the look of what is around it, like a title or an image, with only the focus ring; the look of the text around it, underlined on hover, like the headlines of a [news ticker](#news-ticker); an item of a menu over its full width; or an outlined pill in a row of them, like the sub pages of a section, with the current page filled |
| `block` | `boolean` | `false` — whether it takes the full width, like the links of a drawer below each other |

A link with `aria-current="page"`, which `routerLinkActive ariaCurrentWhenActive="page"` sets, is drawn as the current page: underlined in a navigation, as plain text inside text, like the last step of [breadcrumbs](#breadcrumbs). Icons inside are sized like in buttons. Every link of ui is drawn this way, the links and items of a [menu](#menu) too; a component that draws an element of its own like a link gets the classes from `LinkUtilities.getClasses(appearance, block)`. Change the default appearance with `provideLinkConfig({ appearance })`. The corner radius of the focus ring and of a navigation item is the token `--radius-link`, the one of a pill `--radius-link-pill`.

A link to another site, an `http` or `https` address of another origin than the page, and a link with `target="_blank"` show a small icon after their text. One that opens in a new tab also tells screen readers so, after its text: change the words with `provideLinkConfig({ newTabLabel })`, by default `'opens in a new tab'`. `routerLink`, relative paths, fragments, `mailto:` and `tel:` are no other site; `LinkUtilities.isExternal(href, origin)` decides it. A bound `[href]` or `[target]` is followed when it changes.

## Input string
An input for text, like a name, an email address or a password, with its label, hint and validation error. Inputs for other values, like numbers or dates, are separate components in their own entry points, so you only load the ones you use.

Bind its value two-way to a signal:

```html
<ui-input-string label="Name" hint="As in your passport" [(value)]="name" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `string` | `''` — the text, bind it with `[(value)]` |
| `label` | `string` | required — shown above the input and read by screen readers |
| `hideLabel` | `boolean` | `false` — only screen readers read the label, for an input whose purpose is clear from where it is, like a filter in the header of a column |
| `hint` | `string` | — helps filling it in, the error replaces it while it shows |
| `autofocus` | `boolean` | `false` — like the native `autofocus`: takes the focus as the dialog or popover it is in opens |
| `type` | `text`, `email`, `password`, `search`, `tel`, `url` | `text` — sets the keyboard on phones and what autofill offers |
| `required` | `boolean` | `true` — only optional fields have to say so |
| `minLength`, `maxLength` | `number` | — like the native `minlength` and `maxlength` |
| `pattern` | `string` | — a regular expression the whole text has to match, like the native `pattern` |
| `customValidation` | `(value: string) => string \| undefined` | — a rule the browser can't check, returns the error message or `undefined` |
| `disabled`, `readonly` | `boolean` | `false` |
| `placeholder` | `string` | — an example of the expected text, not a replacement for the label |
| `autocomplete` | `string` | — what the browser may fill in, like `email`, `current-password` or `one-time-code` |
| `inputMode` | `text`, `numeric`, `decimal`, `tel`, `email`, `url`, `search`, `none` | — the keyboard phones show instead of the one of the type, like `numeric` for a code of digits |
| `name` | `string` | — what forms submit the value under, password managers use it as well |
| `size` | `sm`, `md`, `lg` | `md` — the same heights as buttons, so both line up in a row |
| `inputId` | `string` | generated, the id of the native input |

The browser validates the input like any native one, so a form only submits when it is valid. The input shows the error itself instead of the popup of the browser, in the language of your app. Change or translate the messages with `provideInputConfig`, by the property of the native [`ValidityState`](https://developer.mozilla.org/docs/Web/API/ValidityState); messages you leave out keep theirs:

```ts
import { provideInputConfig } from '@service-soft/ui/input';

provideInputConfig({ required: false, errorMessages: { valueMissing: 'Bitte ausfüllen.' } })
```

It is the config of every input, so it lives in `@service-soft/ui/input`, which the inputs share.

Like the native attribute, `maxLength` stops the user from typing more instead of showing an error. Unlike the native attributes, `minLength` and `maxLength` are also checked for a text set from code, like a prefilled form; the browser only checks them once the user changed the text.

For rules the browser can't check, pass `customValidation`. It gets every text, also an empty one, and runs after the other rules, so a required field that is empty still says so. Its message is set on the native input with `setCustomValidity()`, so it blocks the form like any other error. Signals it reads are tracked, so it can compare with another field:

```ts
protected readonly validateRepeated: InputStringValidation = value => {
    return value === this.password() ? undefined : 'The passwords differ.';
};
```

```html
<ui-input-string label="Repeat password" type="password" [customValidation]="validateRepeated" [(value)]="repeated" />
```

Without a hint or an error, nothing is reserved below the input, so it lines up with what is next to it. Once an error showed, its space stays while `showValidationError` is `true`, also when the value becomes valid, so the fields below don't move while the user fixes it. Reset `showValidationError` to `false`, like after resetting the form, to remove it.

A `type="password"` input has a button that shows the password as text while it is pressed. Its name is `showPasswordLabel` of `provideInputConfig`, `'Show password'` by default; screen readers announce whether it is pressed.

A `type="search"` input has a magnifier at its start and, while it has a text it can change, a button at its end that empties it and keeps the focus in the input. It replaces the button some browsers draw themselves, so it looks and is named the same in every browser: `clearSearchLabel` of `provideInputConfig`, `'Clear search'` by default. A search is rarely required, so give it `[required]="false"`, or use it inside a [search toolbar](#search-toolbar).

`passwordStrength` shows below a password input how hard it is to guess, for a new password: strong when it has 15 or more characters and mixes capital and small letters, digits and other characters, medium when it does one of them, weak otherwise (`InputStringUtilities.resolvePasswordStrength`). Bars and a text, which screen readers announce when the strength changes. The texts are `passwordStrengthLabels` of `provideInputConfig`, and `passwordStrength: true` there turns it on for every password input.

Every size uses 16px text, because iOS zooms into the page when an input with smaller text gets focus. The corner radius is the token `--radius-input`.

## Input number
An input for a number, like an amount or an age. It works like [Input string](#input-string): the same label, hint, errors, sizes, `showValidationError` and `provideInputConfig`. Its value is a number, and `undefined` while the input is empty:

```html
<ui-input-number label="Guests" hint="1 to 10" [min]="1" [max]="10" [(value)]="guests" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `number \| undefined` | `undefined` — the number, bind it with `[(value)]` |
| `min`, `max` | `number` | — the smallest and largest allowed number, like the native `min` and `max` |
| `step` | `number`, `any` | `1` — like the native `step`, so only whole numbers are valid unless you set it, like `[step]="0.01"` for money or `step="any"` |
| `customValidation` | `(value: number \| undefined) => string \| undefined` | — a rule the browser can't check, returns the error message or `undefined` |

`label`, `hint`, `required`, `disabled`, `readonly`, `placeholder`, `autocomplete`, `name`, `size` and `inputId` are the same as for Input string. Range and step errors have their own messages in `provideInputConfig`: `rangeUnderflow`, `rangeOverflow` and `stepMismatch`.

It is a native `type="number"` input, so the browser decides how numbers are typed: it shows the arrows to step, and whether a comma is accepted as the decimal separator depends on the browser and the language of the page. A text that is no number, like `1e`, is invalid with the `badInput` message, and the value is `undefined` meanwhile. Use Input string for anything that only consists of digits but isn't counted, like postcodes or phone numbers, which would lose their leading zeros.

## Input textarea
An input for a longer text of several lines, like a message or a description. It works like [Input string](#input-string): the same label, hint, errors, sizes and `showValidationError`, and `minLength` and `maxLength` are checked for a text set from code as well:

```html
<ui-input-textarea label="Delivery note" hint="Shown to the driver" [maxLength]="500" [(value)]="note" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `string` | `''` — the text with its line breaks, bind it with `[(value)]` |
| `rows` | `number` | `textareaRows` of `provideInputConfig`, `3` — the lines it shows before the user resizes it |
| `minLength`, `maxLength` | `number` | — like the native `minlength` and `maxlength` |
| `customValidation` | `(value: string) => string \| undefined` | — a rule the browser can't check, returns the error message or `undefined` |

`label`, `hint`, `required`, `disabled`, `readonly`, `placeholder`, `autocomplete`, `name`, `size` and `inputId` are the same as for Input string. The user can resize it in height.

It grows into any height its place gives it, so in a grid of a form it can span two rows next to two other inputs, and the rows after it line up again:

```html
<ui-form class="grid grid-cols-2 gap-x-4 gap-y-2">
    <ui-input-string label="Name" [(value)]="name" />
    <ui-input-textarea class="row-span-2" label="Note" [(value)]="note" />
    <ui-input-string label="Email" [(value)]="email" />
</ui-form>
```

## Input select
A select to choose one of a few options, like a country or a status. It works like [Input string](#input-string): the same label, hint, errors, sizes and `showValidationError`. The options can hold any value, like an enum or an object, and the value is `undefined` while none is chosen:

```ts
protected readonly countries: InputOption<Country>[] = [
    { label: 'Germany', value: germany },
    { label: 'France', value: france },
    { label: 'Spain', value: spain, disabled: true }
];
```

```html
<ui-input-select label="Country" placeholder="Choose a country" [options]="countries" [(value)]="country" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `T \| undefined` | `undefined` — the value of the chosen option, bind it with `[(value)]` |
| `options` | `InputOption<T>[]` | required — `label`, `value` and `disabled` of each option, in the order they show, from `@service-soft/ui/input` |
| `placeholder` | `string` | — shows while nothing is chosen, and is the option that empties an optional select again |
| `customValidation` | `(value: T \| undefined) => string \| undefined` | — a rule the browser can't check, returns the error message or `undefined` |

`label`, `hint`, `required`, `disabled`, `readonly`, `autocomplete`, `name`, `size` and `inputId` are the same as for Input string. Values are compared by identity, so pass the value of one of the options, not a copy of it.

It is a combobox with a list styled like the one of [Input autocomplete](#input-autocomplete), because the list of a native select is drawn by the browser and takes neither the colors nor the cursor of the theme. A click, Enter, Space or the arrow down open it on the chosen option, the arrows and letters move through it, and Enter, Space or a click choose. A hidden native select underneath is what the browser validates, submits under `name` (the index of the chosen option) and autofills, and what the label and a form focus, which hands focus on to the combobox. A required select has no empty option to go back to once something is chosen. While `readonly` is set, it can be focused but not opened, and is still submitted with its form.

## Input boolean
An input for a yes or no, like accepting the terms or turning on notifications, with its label after it. A checkbox, or a switch for a setting that applies right away:

```html
<ui-input-boolean label="Send me the newsletter" [(value)]="newsletter" />
<ui-input-boolean label="Notifications" appearance="switch" [(value)]="notifications" />
<ui-input-boolean label="I accept the terms" required [(value)]="accepted" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `boolean` | `false` — whether it is checked, bind it with `[(value)]` |
| `appearance` | `checkbox`, `switch` | `booleanAppearance` of `provideInputConfig`, `checkbox` |
| `color` | `neutral`, `primary`, `secondary`, `success` | `color` of `provideInputConfig`, `primary` — the color of a checked box or switch |
| `required` | `boolean` | `false` — whether it has to be checked, unlike other inputs not by default, as no is a value |
| `size` | `sm`, `md`, `lg` | `md` — the height of the row, the same as an input of that size |
| `alignWithInputs` | `boolean` | `false` — keeps the space of a label above it, so next to inputs with their label above them, like in a grid of a form, it lines up with their boxes rather than with their labels |

`label`, `hint`, `customValidation`, `disabled`, `readonly`, `name`, `inputId` and `showValidationError` are the same as for Input string. It is a native checkbox, a switch has the role `switch`, so the browser handles its keyboard and state, and clicking the label changes it as well. The hint and the error show below the label. Like the select, a read only one keeps its value but can be focused and is submitted.

A label with links, like the consent to your privacy policy, is the content of the input. Leave out `label`, and the content is the label: screen readers read the text and the links as its name, and a click on the text checks it, while a click on a link follows the link:

```html
<ui-input-boolean name="privacy" required [(value)]="accepted">
    I accept the <a ui-link routerLink="/privacy">privacy policy</a>.
</ui-input-boolean>
```

## Input date
An input for a date, like a birthday or a deadline, or a date and a time of it. It works like [Input string](#input-string): the same label, hint, errors, sizes and `showValidationError`. Its value is a `Date`, and `undefined` while the input holds no complete date:

```html
<ui-input-date label="Deadline" [min]="today" [(value)]="deadline" />
<ui-input-date label="Delivery" type="datetime-local" [(value)]="delivery" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `Date \| undefined` | `undefined` — the date, bind it with `[(value)]` |
| `type` | `date`, `datetime-local` | `date` — a day, or a day and a time of it |
| `min`, `max` | `Date` | — the earliest and latest allowed date; with `date`, any time of their day is allowed |
| `placeholder` | `string` | an example date in the format of the input, like `12/31/2026` |
| `customValidation` | `(value: Date \| undefined) => string \| undefined` | — a rule the browser can't check, returns the error message or `undefined` |

`label`, `hint`, `required`, `disabled`, `readonly`, `autocomplete`, `name`, `size` and `inputId` are the same as for Input string. A text that is no date has the message `badInput` of `provideInputConfig`, and a date outside of `min` and `max` `rangeUnderflow` and `rangeOverflow`. They make the native input invalid like the rules of the browser, so a form doesn't submit.

The user types the date in the format of the `LOCALE_ID` of the app, like `11/12/2026` in `en-US` or `12.11.2026` in `de`, with the time like `11/12/2026, 09:30 AM` or `12.11.2026, 09:30`. Leading zeros and the separators don't matter, a year has four digits, and without AM or PM a time is read as 24-hour. Leaving the input writes the date in the format. It is a text input rather than the native date input, whose picker looks different in every browser and can't be hidden in all of them.

The button in the input opens a calendar in a popover: a month with buttons to the ones before and after it (`previousMonthLabel`, `nextMonthLabel`), whose days the arrow keys, Home and End move through, and Enter, Space or a click chooses. Days outside of `min` and `max` can't be chosen, and with `datetime-local` the chosen day keeps the time of the value. Month and weekday names come from `Intl` in the `LOCALE_ID`. The name of the button is `datePickerLabel` of `provideInputConfig`, `'Choose a date'` by default, and `firstDayOfWeek` there is the day the weeks start with, `1` (Monday) by default, `0` for Sunday.

The date is in the time zone of the browser: a `date` is midnight of its day. `InputDateUtilities` has the format (`resolveFormat`), reads a typed text (`findDateInText`) and writes a date as the value of a native date input (`getNativeValue`). It also counts days the way a calendar does, also across a change of the clocks: `resolveDayStart(date, offset)` is midnight of the day, or of one before or after it, and `resolveDaysBetween(start, end)` the number of days from one to the other. Send the date as it is, and zibri reads it as the same moment.

## Input date range
An input for a period from a start to an end, like a booking from its pick-up to its return or the nights of a holiday. Each side has a text input like [Input date](#input-date), and both share one calendar, which shows the range: the buttons in the inputs open it, a click chooses the start and then the end, and the days between them are tinted. The value is an `InputDateRange`, `{ start: Date | undefined, end: Date | undefined }`:

```html
<ui-input-date-range
    label="Rental"
    startLabel="Pick-up"
    endLabel="Return"
    [min]="today"
    [maxDuration]="{ days: 14 }"
    [dayValidation]="closedOnSundays"
    [times]="openingHours"
    [(value)]="rental"
/>
```

```ts
readonly closedOnSundays: InputValidation<Date> = day => day.getDay() === 0 ? 'We are closed on Sundays.' : undefined;
readonly openingHours: InputDateRangeTimes = day => day.getDay() === 6
    ? InputTimeUtilities.resolveTimes('09:00', '12:00', 30)
    : InputTimeUtilities.resolveTimes('08:00', '18:00', 30);
```

| Input | Values | Default |
|---|---|---|
| `value` | `InputDateRange` | `{ start: undefined, end: undefined }` — the range, bind it with `[(value)]`; a side is `undefined` while its input holds no complete date |
| `startLabel`, `endLabel` | `string` | `rangeStartLabel` and `rangeEndLabel` of `provideInputConfig`, `'Start'` and `'End'` — the labels above the two sides |
| `min`, `max` | `Date` | — the earliest start and the latest end; any time of their day is allowed |
| `minDuration`, `maxDuration` | `{ days: number }` \| `{ hours: number }` | — the shortest and longest range. Days count by the days, whatever the time: from the 12th to the 15th are 3 days. Hours count from moment to moment |
| `dayValidation` | `(day: Date) => string \| undefined` | — a rule for the day of each side, like a closed weekday or a booked day, returns the error message or `undefined` |
| `times` | `string[]` \| `(day: Date) => string[]` | — the times a range can start and end at, as `'HH:mm'`: the same every day, or the ones of a day, like opening hours. Each side then has an input of its time like [Input time](#input-time), whose picker offers the times of its day; it moves below the date where both don't fit. Without them the range is of days, both sides at midnight |
| `customValidation` | `(value: InputDateRange) => string \| undefined` | — a rule for the whole range, checked after all others, like days in between that are booked |
| `color` | `neutral`, `primary`, `secondary` | `calendarColor` of `provideInputConfig` — the header of the calendar |

`label`, `hint`, `required`, `disabled`, `readonly`, `placeholder`, `autocomplete`, `size` and `inputId` are the same as for Input string; `name` names the inputs `<name>-start` and `<name>-end`. The label names both sides, so screen readers read `'Rental Pick-up'` and `'Rental Return'`, and the inputs of the times `'Rental Pick-up Time'` (`timeLabel` of `provideInputConfig`).

The calendar doesn't offer the days that can't be chosen: outside of `min` and `max`, rejected by `dayValidation`, without `times`, and while it chooses the end, the days after the start that make the range too short or too long in days. A day before the start starts the range again, and a start after the end removes the end. The button of the end opens it to choose the end. A day that gets a new date keeps its time, also one the new day doesn't offer, which then shows its error; a side without a time takes the first one of its day.

The rules make the native input of the start invalid, so a form doesn't submit, with the messages of `provideInputConfig`, in this order: a text that is no date (`badInput`), only one side (`rangeIncomplete`), an end before the start (`rangeReversed`), outside of `min` and `max` (`rangeUnderflow`, `rangeOverflow`), the message of `dayValidation`, a time that isn't offered (`timeNotAllowed`), and a range too short or too long (`rangeTooShort`, `rangeTooLong`); a typed time that is no time is `badInput` as well. The error shows once focus leaves the whole range, not when it moves from the start to the end. `InputTimeUtilities.resolveTimes(from, until, stepMinutes)` of `@service-soft/ui/input-time` lists the times of opening hours, and `InputDateRangeUtilities` has `resolveDurationDifference(start, end, duration)`. The calendar of both date inputs is `InputDateCalendarComponent` of `@service-soft/ui/input-date`, whose `end` input shows a range, for a control of your own.

## Input time
An input for a time of the day, like the start of an appointment. It works like [Input date](#input-date): the same label, hint, errors, sizes and `showValidationError`. Its value is the time as `'HH:mm'`, like the value of a native time input, and `undefined` while the input holds no complete time:

```html
<ui-input-time label="Start" min="08:00" max="18:00" [(value)]="start" />
<ui-input-time label="Appointment" [times]="freeSlots" [(value)]="appointment" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `string \| undefined` | `undefined` — the time as `'HH:mm'`, bind it with `[(value)]` |
| `times` | `string[]` | — the allowed times, like the free slots of appointments; without them, every `step` minutes from `min` to `max` are |
| `min`, `max` | `string` | — the earliest and latest allowed time, as `'HH:mm'` |
| `step` | `number` | `30` — the minutes between two allowed times, counted from `min` or midnight |
| `color` | `neutral`, `primary`, `secondary` | `'primary'` — the header of the picker |
| `placeholder` | `string` | an example time in the format of the input, like `6:30 PM` |
| `customValidation` | `(value: string \| undefined) => string \| undefined` | — a rule the browser can't check, returns the error message or `undefined` |

`label`, `hint`, `required`, `disabled`, `readonly`, `autocomplete`, `name`, `size` and `inputId` are the same as for Input string.

The user types the time in the format of the `LOCALE_ID` of the app, like `9:30 AM` in `en-US` or `9:30` in `de`. The minutes and the separator don't matter, `9` is `09:00` and `9.30` is `09:30`, and without AM or PM a time is read as 24-hour. Leaving the input writes the time in the format, which the list of the picker and the times of [Input date range](#input-date-range) use as well (`InputTimeUtilities.resolveFormat`). The button in the input opens a picker in a popover, in the style of the calendar of a date input: a header and the allowed times as a list, whose times the arrow keys, Home, End and the first digits move through, and Enter, Space or a click chooses, which closes it and focuses the input again. It opens at the time of the value. Escape or a click outside closes it.

A text that is no time has the message `badInput` of `provideInputConfig`, a time outside of `min` and `max` `rangeUnderflow` and `rangeOverflow`, one that isn't one of `times` `timeNotAllowed`, and one off the steps `stepMismatch`. They make the native input invalid like the rules of the browser, so a form doesn't submit. Change the default `step`, `color` and the name of the picker (`timePickerLabel`, `'Choose a time'`) with `provideInputTimeConfig`. `InputTimeUtilities` has the format (`resolveFormat`), reads a typed text (`findTimeInText`), writes a time (`resolveText`) and lists the times of opening hours (`resolveTimes(from, until, stepMinutes)`). The picker is `InputTimePickerComponent`, which [Input date range](#input-date-range) uses for its times as well. It is built on the listbox of [`@angular/aria`](https://angular.dev/guide/aria/overview).

## Input slider
A slider for a number within a range, like a volume or a rating, with the number next to it:

```html
<ui-input-slider label="Volume" [min]="0" [max]="10" [(value)]="volume" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `number` | `50` — the number, bind it with `[(value)]` |
| `min`, `max` | `number` | `0` and `100` — like the native `min` and `max` |
| `step` | `number` | `1` — the steps the number moves in, like the native `step` |
| `color` | `neutral`, `primary`, `secondary`, `success` | `color` of `provideInputConfig`, `primary` — the color of the filled part of the track and the thumb |
| `required` | `boolean` | `false` — only whether the label says so, as a slider always holds a number |
| `customValidation` | `(value: number) => string \| undefined` | — a rule the browser can't check, returns the error message or `undefined` |

`label`, `hint`, `disabled`, `name`, `inputId` and `showValidationError` are the same as for Input string. It is the native range input of the browser, which handles its keyboard and keeps the number within the range and on a step. Use Input number for a number the user knows and types, like an amount.

## Input file
An input for files, like an attachment or a picture. A button chooses them, and a list below it shows them with their size, a preview of every image and a button that removes each. It takes the files your backend stored already as well, so a form edits them like any other value:

```html
<ui-input-file label="Attachments" accept="image/*,.pdf" [maxSize]="5000000" multiple [(value)]="attachments" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `(File \| InputExistingFile)[]` | `[]` — the files, bind it with `[(value)]` |
| `multiple` | `boolean` | `false` — whether it takes several files; choosing adds to them then, and replaces the one otherwise |
| `accept` | `string` | — the types it takes, like the native `accept`: `application/pdf`, `image/*` or `.pdf`, separated by commas |
| `maxSize` | `number` | — the largest size of a chosen file, in bytes |
| `customValidation` | `(value: (File \| InputExistingFile)[]) => string \| undefined` | — a rule it can't check itself, returns the error message or `undefined` |

`label`, `hint`, `required`, `disabled`, `readonly`, `name`, `size` and `inputId` are the same as for Input string. A read only or disabled one lists its files, but can't choose or remove any.

Without `multiple`, its one file shows in place of the button and the list, in a box as high as an input of its size, so choosing a file doesn't move the rows of a form. The button in the box removes the file and brings back the one that chooses, and the focus moves on from one to the other. The box has no room for the error of its file, so that is the error below the input.

The files the user chose are `File` objects, which you upload, like as `FormData` to a zibri route. A file your backend stored is an `InputExistingFile`, with its `name`, the `url` a browser loads it from and its `mimeType` and `size`: the `StoredFile` of [zibri-contract](https://www.npmjs.com/package/zibri-contract) is one. Tell them apart with `instanceof File`.

It checks `required`, `maxSize` and `accept` itself, since the native input never holds the stored files, and blocks the form like any invalid input. With `multiple`, a file that is too large or of a type it doesn't take is marked in the list, with why below its name, so of twenty files the user sees which to remove; the button that removes it is described by that error as well. The input itself then asks to remove the marked files. The messages are `valueMissing`, `fileTooLarge`, `fileTypeMismatch` and `invalidFiles` of `provideInputConfig`, where `chooseFileLabel`, `chooseFilesLabel` and `removeLabel` name its buttons as well. The size and the type are only checked for chosen files. The button opens the picker of the browser, which only offers the types of `accept` but lets the user pick every file anyway.

## Input autocomplete
An input to choose one of many options by typing, like a city or a customer. The options whose label contains the text show in a list below it; the arrow keys move through them, Enter or a click chooses one, and Escape or leaving the input closes the list. Only an option can be the value:

```html
<ui-input-autocomplete label="City" [options]="cities" [(value)]="city" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `T \| undefined` | `undefined` — the value of the chosen option, bind it with `[(value)]` |
| `options` | `InputOption<T>[]` | required — `label`, `value` and `disabled` of each option, like for Input select |
| `query` | `string` | `''` — the text of the input, bind it with `[(query)]` to load the options that fit it |
| `freeText` | `boolean` | `false` — any text is fine and the options only suggest some; bind the text with `[(query)]` as the value then. `InputUtilities.resolveLengthError` and `resolvePatternError` of `@service-soft/ui/input` check the rules a combobox has no native attribute for, in `customValidation` |
| `customValidation` | `(value: T \| undefined) => string \| undefined` | — a rule the browser can't check, returns the error message or `undefined` |

`label`, `hint`, `required`, `disabled`, `readonly`, `placeholder`, `autocomplete`, `name`, `size` and `inputId` are the same as for Input string. `autocomplete` is `off` unless you set it, so the suggestions of the browser don't cover the list.

Choosing an option writes its label into the input, and a value set from code shows its label. Typing again removes the value until the user chooses another option, and a text that is none of the options is invalid with `optionNotChosen` of `provideInputConfig`. For many options, like the customers of an api, bind `[(query)]` and set `options` to what your backend found for it; the options are still filtered by the text, and the list opens when they arrive while the user is still in the input, also after they stopped typing.

It is built on the combobox and listbox of [`@angular/aria`](https://angular.dev/guide/aria/overview), which handle its keyboard and ARIA state; focus stays in the input while the arrow keys move through the list. Install `@angular/aria`, an optional peer of ui that only this entry point loads. The list is a popover in the top layer, placed below the input with CSS anchor positioning, or above it when there is no space, so a container that scrolls, like a dialog, doesn't cut it off. `InputPopupDirective` of `@service-soft/ui/input` does that for a list of an input of your own.

## Input chips
An input to choose several values, like the tags of an article or the members of a team. Each chosen value is a chip inside the field, before the text, with a button that removes it; Backspace in the empty text removes the last one. With more chips than fit in a line, the field grows, like a textarea; with one line of them, it is as high as the inputs next to it. Typing shows the options that contain the text, like [Input autocomplete](#input-autocomplete); Enter or a click selects an option, or deselects a chosen one, and the list stays open to choose more:

```html
<ui-input-chips label="Tags" placeholder="Add a tag" [options]="tags" [customValue]="toTag" [(value)]="chosenTags" />
```

```ts
protected readonly toTag: InputChipsCustomValue<string> = text => text.toLowerCase();
```

| Input | Values | Default |
|---|---|---|
| `value` | `T[]` | `[]` — the chosen values in the order they were chosen, bind it with `[(value)]` |
| `options` | `InputOption<T>[]` | `[]` — `label`, `value` and `disabled` of each option, like for Input select |
| `customValue` | `(text: string) => T \| undefined` | — turns a text that is no option into a value when the user presses Enter, like a new tag. Without it, only options can be chosen. A text it returns undefined for stays in the input and shows the error of `customValidation`, which can read the text through `[(query)]` |
| `query` | `string` | `''` — the text of the input, bind it with `[(query)]` to load the options that fit it |
| `color` | `neutral`, `primary`, `secondary`, `success` | `color` of `provideInputConfig`, `primary` — the color of the chips: their label on the tint of it, or on the container while neutral |
| `customValidation` | `(value: T[]) => string \| undefined` | — a rule it can't check itself, like at most three values, returns the error message or `undefined` |

`label`, `hint`, `required`, `disabled`, `readonly`, `placeholder`, `autocomplete`, `name`, `size` and `inputId` are the same as for Input string. `required` needs at least one value. A chip shows the label of its option, or the value itself for one typed with `customValue`; a value is only added once. The buttons that remove a chip are named with `removeLabel` of `provideInputConfig` and described by the chip's label; once one is gone, the text has the focus. Read only or disabled, the chips can't be removed. Like Input autocomplete, it is built on `@angular/aria`.

## Input cards
An input to choose one of a few options shown as cards, like a car or a plan, where each option needs more than a label to tell it apart. It works like [Input select](#input-select): the same label, hint, errors and `showValidationError`, and the value is `undefined` while nothing is chosen. A card has the label of its option as its title, and may have a description, an image at its top or an icon in front of the title, and what a template shows at its end, like a price:

```ts
protected readonly cars: InputCardOption<Car>[] = [
    { label: 'VW Golf', value: golf, description: 'Compact, 5 seats', image: { url: '/cars/golf.jpg', width: 1200, height: 800 } },
    { label: 'VW Polo', value: polo, description: 'Small, 5 seats', icon: faCarSide },
    { label: 'VW Transporter', value: transporter, description: 'Booked out on these days', disabled: true }
];
```

```html
<ui-input-cards label="Car" [options]="cars" [(value)]="car">
    <ng-template let-car [uiInputCardMeta]="cars">{{ car.value.price | currency: 'EUR' }} a day</ng-template>
</ui-input-cards>
```

`ui-input-cards-multiple` is the same with checkboxes, for any number of the options, like the extras of a booking. Its value is `T[]`, the chosen values in the order they were chosen, and a required one needs at least one of them:

```html
<ui-input-cards-multiple label="Extras" [required]="false" [options]="extras" [(value)]="chosenExtras" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `T \| undefined`, or `T[]` for `ui-input-cards-multiple` | `undefined`, or `[]` — bind it with `[(value)]` |
| `options` | `InputCardOption<T>[]` | required — `label`, `value` and `disabled` like the options of Input select, and `description`, `image` (`url`, `width`, `height` and `alt`, empty by default) and `icon` |
| `appearance` | `cards`, `segmented` | `cardsAppearance` of `provideInputConfig`, `cards` — only `ui-input-cards`: cards, or one row of segments, see below |
| `color` | `neutral`, `primary`, `secondary`, `success` | `color` of `provideInputConfig`, `primary` — the color of the border of a chosen card and of its radio button or checkbox, or the fill of the chosen segment |
| `customValidation` | `(value) => string \| undefined` | — a rule the browser can't check, returns the error message or `undefined` |

`label`, `hint`, `required`, `disabled`, `readonly`, `name` and `inputId` are the same as for Input string. Every card is a label around a native radio button or checkbox, so a click anywhere on it chooses it, the browser handles the keyboard, with the arrow keys moving between radio buttons, and a form submits the index of every chosen option under `name`. They are inside a fieldset whose legend is the label, which screen readers read with the hint or the error once on entering it. The radio button or checkbox of a card is named by its title and described by its description and what the template shows. A chosen card has its border in the color as well as a marked radio button or checkbox, so it never shows by the color alone. The template of `uiInputCardMeta` gets the option as `let-option`; give it the options, `[uiInputCardMeta]="cars"`, and the option has their type. The image is drawn with `NgOptimizedImage`, so it can't be a data url. The cards stand in up to three columns, by the width of the input, not the one of the screen, and below each other where it is narrow. Their corner radius is the token `--radius-input-card`.

With `appearance="segmented"`, `ui-input-cards` is a segmented control for two to five short options, like a size or monthly and yearly: one row of segments with only the label and the `icon` of each option, as high as an input of its `size`. A segment is a label around a hidden native radio button, so the keyboard and forms work the same; the chosen one is filled with the color and has a check mark, which takes the place of its icon, so it never shows by the color alone. The segments stand in a row once there is room, by the width of the input, and below each other where it is narrower.

```html
<ui-input-cards label="Size" appearance="segmented" [options]="sizes" [(value)]="size" />
```

## An input of your own
`@service-soft/ui/input` holds what every input shares, so an input for another value looks and behaves like the ones of ui. Extend `BaseInputDirective` with the type of the value: it has the inputs `label`, `hideLabel`, `autofocus`, `hint`, `required`, `customValidation`, `disabled`, `readonly`, `placeholder`, `autocomplete`, `name`, `size`, `inputId` and `showValidationError`, the error messages of `provideInputConfig` and the validation state. Declare the `value`, the errors of the native [`ValidityState`](https://developer.mozilla.org/docs/Web/API/ValidityState) the input can have, in the order they are checked, and render `ui-input-field` around a native input marked `#nativeInput`:

```ts
@Component({
    selector: 'app-input-time',
    templateUrl: './input-time.component.html',
    imports: [InputFieldComponent],
    host: { class: 'flex flex-col' }
})
export class InputTimeComponent extends BaseInputDirective<string> {
    readonly value: ModelSignal<string> = model('');

    protected readonly validityErrors: readonly InputValidityError[] = ['valueMissing', 'badInput'];
}
```

```html
<ui-input-field [field]="this">
    <input
        #nativeInput
        type="time"
        [class]="inputClasses()"
        [id]="inputId()"
        [attr.autofocus]="autofocus() ? '' : null"
        [value]="value()"
        [required]="required()"
        [attr.aria-invalid]="errorMessage() ? 'true' : null"
        [attr.aria-describedby]="describedBy() ?? null"
        (input)="value.set(nativeInput.value)"
        (blur)="showValidationError.set(true)"
        (invalid)="showInsteadOfPopup($event)"
    />
</ui-input-field>
```

`ui-input-field` shows the label, the hint and the error, and keeps the space of an error like the inputs of ui. It hides the label with `hideLabel`, which keeps it for screen readers; `autofocus` goes on the element the label points to. Override `resolveCustomError` for rules of your own that run before `customValidation`, and `resolveExtraClasses` for classes the native input needs, like room for a button over it. A control with checkboxes, switches or cards to choose draws them with the classes the inputs of ui use: `INPUT_CHECKBOX_CLASSES`, `INPUT_SWITCH_CLASSES` and `INPUT_CARD_CLASSES`, with their colors, marks and thumbs, of `@service-soft/ui/input`.

## Form
A native form for inputs and a submit button. Listen to the native submit event, which the browser only fires when every input is valid, also when the user presses enter in an input:

```html
<ui-form class="grid gap-4" (submit)="save()">
    <ui-input-string label="Name" [(value)]="name" />
    <ui-input-string label="Company" [required]="false" [(value)]="company" />
    <button ui-button type="submit">Save</button>
</ui-form>
```

On a submit with invalid values, every invalid input shows its error, and the form focuses the first of them, which scrolls it into view. Classes on `<ui-form>` lay out its content directly, like `grid`, and it never reloads the page.

For a single field with its submit button in one row, like a newsletter signup or a quick search, use `layout="inline"`. The field takes the width the button leaves, and below the `sm` breakpoint the button is below the field, as wide as it. The label stays above the field and the button lines up with its box, not with the label; with `hideLabel` on the input, only screen readers read the label and the button lines up with the field:

```html
<ui-form layout="inline" (submit)="subscribe()">
    <ui-input-string label="Email" type="email" autocomplete="email" [(value)]="email" />
    <button ui-button type="submit">Subscribe</button>
</ui-form>
```

In the inline layout, the content is laid out by the form: classes on `<ui-form>` only place the form itself. The button lines up by the height of the label of the inputs of ui, `text-label` with its margin, so a label of your own of another size, or one that wraps, moves it off. Change the default layout with `provideFormConfig({ layout })`.

## Form draft
Keeps what the user typed into a form while they are away, like on another page, and fills it in again when they come back in the same tab. Put `uiFormDraft` with a key of the form on it:

```ts
import { FormDraftDirective } from '@service-soft/ui/form-draft';
```

```html
<ui-form uiFormDraft="contact" (submit)="send()">
    <ui-input-string label="Name" name="name" [(value)]="name" />
    <ui-input-textarea label="Message" name="message" [(value)]="message" />
    <button ui-button type="submit">Send</button>
</ui-form>
```

It keeps the value of every field of the form that has a `name`, in the `sessionStorage` under `ui-form-draft:<key>`, while the user types, and forgets it once the form is submitted, which the browser only does when it is valid. Give every field a `name` that is unique in the form, and each form its own key. The draft lives as long as the tab: closing it forgets the draft.

It works on the native fields, so it needs no `@angular/forms`: it fills in the native field and fires the `input` and `change` events the user would, which the inputs of ui take their value from. That covers the inputs of text, numbers, dates, the textarea, the checkbox and the switch, the slider and the select, and plain native fields as well. The select keeps the position of the option, so a draft fills in another one when the options change. Chips and an autocomplete only get back what was typed into their field, not the values that were chosen. Passwords, also one that shows as text, files and hidden fields are never kept, nor is anything inside an element with `data-form-draft="off"`, like the field of the [spam protection](#spam-protection). The draft is only read in the browser, after the first render, so it works with server-side rendering; values your app sets after that, like loaded data, replace it.

## Spam protection
Tells submissions of simple bots apart from the ones of people, so your app can drop them. Put it inside of the form and ask `isSpam()` on submit:

```html
<ui-form (submit)="spam.isSpam() || send()">
    <ui-input-string label="Message" [(value)]="message" />
    <ui-spam-protection #spam [minimumFillTime]="3000" />
    <button ui-button type="submit">Send</button>
</ui-form>
```

| Input | Values | Default |
|---|---|---|
| `name` | `string` | `'website'` — the name of the hidden field, one a bot expects in a form. Change it when the form has a real field of that name |
| `minimumFillTime` | `number` | `0` — how many milliseconds a person needs at least to fill in the form; a faster submission looks like spam. `0` checks no time |

It adds a honeypot: a text field that people never see and bots that fill in every field fill in too. It is hidden visually by `sr-only` rather than `display: none`, which bots look for, from screen readers by `aria-hidden`, from the keyboard by `tabindex="-1"`, from autofill by `autocomplete="off"` and from a [form draft](#form-draft). It takes no space in the layout, also not in an inline form. Change the defaults and the label of the field, for whoever reaches it anyway, with `provideSpamProtectionConfig({ name, label, minimumFillTime })`.

Know what it doesn't do:
- It only keeps out bots that fill in forms without rendering the page like a browser. A bot that renders the page, or one written for your site, leaves the field empty and waits long enough.
- It runs in the browser, so a bot that sends the request to your backend directly isn't stopped at all. Check on the server as well, like by a rate limit, and send the honeypot along to check it there too.
- Autofill or a password manager that ignores `autocomplete="off"` may fill in the field, which drops the message of a real person. Tell users a way to reach you that doesn't need the form.
- A minimum fill time drops a person who sends a form fast, like one whose [form draft](#form-draft) was filled in again, which is why it is off by default.

## Stepper
A flow of steps, like a booking: the list of the steps, each done, the current one or still to come, the content of the current step with its name as the heading, and buttons back and on. Every `ui-step` inside is one of them:

```html
<ui-stepper finishLabel="Book now" [(step)]="step" (finished)="book()">
    <ui-step label="Dates"><ui-input-date label="Pick-up" [(value)]="pickUp" /></ui-step>
    <ui-step label="Car"><ui-input-cards label="Car" [options]="cars" [(value)]="car" /></ui-step>
    <ui-step label="Extras"><ui-input-cards-multiple label="Extras" [required]="false" [options]="extras" [(value)]="extras" /></ui-step>
    <ui-step label="Confirm"><ui-data-list [items]="summary()" /></ui-step>
</ui-stepper>
```

| Input | Values | Default |
|---|---|---|
| `step` | `number` | `0` — the index of the current step, bind it with `[(step)]` |
| `orientation` | `horizontal`, `vertical` | `horizontal` — the steps in a row above the content of the current one, or below each other, with the content of the current step below its name |
| `linear` | `boolean` | `true` — whether the user only moves with the buttons, or may also go back to a done step by clicking its name |
| `color` | `neutral`, `primary`, `secondary` | `primary` — the color of the done and the current steps |
| `headingLevel` | `1` to `6` | `2` — the level of the heading of the current step, its name |
| `label` | `string` | `'Steps'` — what screen readers call the list of the steps |
| `backLabel`, `nextLabel`, `finishLabel` | `string` | `'Back'`, `'Next'`, `'Finish'` — the texts of the buttons, the last one on the last step, like `'Book now'` |
| `beforeNext` | `(step: number) => boolean \| Promise<boolean>` | — a check once the controls of the current step are valid, before the stepper goes on or finishes, see below |

The content of every step is a native [form](#form), whose submit button is the one that goes on: the browser checks the controls of the step, every invalid one shows its error and the first of them gets the focus, and the stepper only goes on once they are valid, also when the user presses enter in one of them. A step can't be skipped, as only the steps before the current one are done, and going on always checks the current one. On the last step the button finishes instead, which `(finished)` says. Don't put the stepper inside a form of your own, forms can't be nested; read the values of the controls instead. The content of every step stays rendered while it is hidden, so the steps keep what the user typed.

A done step shows a check mark instead of its number, and the current one a ring and its name in bold, so the state never shows by the color alone; screen readers hear the current step through `aria-current="step"` and "completed" after the name of a done one. When a step shows, the focus moves to its heading, so screen readers say where the user is and the next Tab goes into the step. Where the row of steps doesn't fit, like on a phone, it shows "Step 2 of 4" and a bar instead, by the width of the stepper, not the one of the screen. Change the defaults and the texts with `provideStepperConfig({ orientation, linear, color, headingLevel, label, backLabel, nextLabel, finishLabel, doneLabel, busyLabel, progressLabel })`; `progressLabel` takes the number of the current step and how many there are.

A rule the browser can't check, like whether the chosen car is still available, is `beforeNext`. It gets the index of the current step once its controls are valid, and the stepper goes on, or finishes, when it returns `true`. While its promise runs, the button that goes on is `aria-busy` with a [spinner](#spinner) named by `busyLabel`, `'Checking'` by default, and another click on it does nothing; it stays focusable, as disabling it would drop the focus. On `false` the stepper stays on the step, so tell the user why, like with the `customValidation` of a control or a [callout](#callout) in the step:

```ts
protected readonly checkAvailability: StepperBeforeNext = async step => step !== 1 || await this.cars.isAvailable(this.car());
```

## Icon
Draws an icon definition, like the ones of Font Awesome, without Font Awesome's own components or runtime. Import single icons, so every other icon stays out of the bundle:

```ts
import { faClock } from '@fortawesome/free-solid-svg-icons';
```

```html
<ui-icon [icon]="faClock" /> 12.10.2026
<ui-icon label="Created at" [icon]="faClock" />
```

It is sized in `em` and drawn in the color of the text, so change its size with the font size and its color with the text color. It adds no box to the layout, so classes like margins on `<ui-icon>` have no effect. Without a `label` it is decorative and screen readers skip it; give an icon that stands for something a `label`. Inside a button, the button sizes it like any other `svg`.

## Spinner
Shows that something is loading whose end isn't known. Screen readers announce it as a progress bar with its `label`:

```html
@if (loading()) {
    <ui-spinner label="Loading orders" />
}
```

| Input | Values | Default |
|---|---|---|
| `label` | `string` | `'Loading'` — what screen readers announce |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` — as high as a line of text, twice or three times as high |

It is sized in `em`, so it grows with the text around it, and drawn in `primary` over a track in `outline-variant`. On a [colored surface](#colored-surfaces) it takes the on- color. It only turns with `prefers-reduced-motion` unset, otherwise the arc stands still. Like an icon it adds no box to the layout, and inside a button the button sizes it and its arc takes the text color of the button, without a track. Set `aria-busy="true"` on the region that is loading, so screen readers wait for it, or let [`uiLoading`](#loading) do all of it. Change the defaults with `provideSpinnerConfig`.

## Loading
Marks an area of the page as loading, like a card, a table or a list, while the rest of the page stays usable:

```ts
import { LoadingDirective } from '@service-soft/ui/loading';
```

```html
<ui-card [uiLoading]="loading()" loadingLabel="Loading orders">…</ui-card>
```

| Input | Values | Default |
|---|---|---|
| `uiLoading` | `boolean` | `false` — whether the area loads |
| `loadingLabel` | `string` | `'Loading'` — what screen readers read for the spinner |
| `loadingSize` | `'sm'` \| `'md'` \| `'lg'` | `'lg'` — the size of the [spinner](#spinner) |

While it loads, the area is `aria-busy`, a spinner on the surface shows in its middle over `--color-scrim` of the theme, with the corners of the area, and what is inside of it is `inert`: it can't be clicked, focused or read, while the spinner can. What the area holds when it starts loading is made inert, and given back as it was afterwards, so what your app made inert itself stays so. An area that isn't positioned gets `position: relative` meanwhile, so the overlay covers only it. The spinner only turns without `prefers-reduced-motion`. On the server only `aria-busy` is rendered; the overlay shows in the browser, after the first render. Put it on an element that can hold a `div`, like a card or a `ui-table`, not on a native `<table>`. Change the defaults with `provideLoadingConfig({ label, size })`.

## Empty state
Says that there is nothing to show, and why, in place of what would be there, like the orders of a new customer, the results of a search or a list that couldn't be loaded:

```html
<ui-empty-state title="No orders yet" text="Orders show here once a customer ordered." [headingLevel]="2">
    <ui-empty-state-actions><button ui-button type="button" (click)="create()">New order</button></ui-empty-state-actions>
</ui-empty-state>
```

| Input | Values | Default |
|---|---|---|
| `title` | `string` | — required, what there is not |
| `text` | `string` | — more about it below the title |
| `variant` | `'empty'` \| `'no-results'` \| `'error'` | `'empty'` — nothing yet, nothing that matches, or what couldn't be loaded; picks the icon and its color |
| `size` | `'md'` \| `'compact'` | `'md'` — the content of a page or a card, or compact, like inside a table or a list |
| `headingLevel` | `1` to `6` \| `undefined` | `undefined` — the level of the [heading](#heading) the title is; without one, the title is no heading, like inside a table |
| `icon` | `IconDefinition` | — an icon in place of the one of the variant |

The icon is decorative, the title says what happened: an inbox, a magnifying glass, or a warning sign in `error`, so the color is never the only cue. `<ui-empty-state-actions>` holds what the user can do about it, below the text. It adds no live region: when it replaces content after a search, announce the result where the search is. [Tables](#table) show a compact one of their own when they have no rows. Change the defaults and the icons with `provideEmptyStateConfig({ variant, size, headingLevel, icons })`.

## Avatar
A person as a round picture, or as the initials of their name where there is no picture or it can't be loaded:

```html
<ui-avatar name="Ada Lovelace" [src]="user.photoUrl" />
```

| Input | Values | Default |
|---|---|---|
| `name` | `string` | — required, its initials show without a picture, like `AL`, and screen readers read it |
| `src` | `string` | — the url of the picture, also a data url |
| `size` | `'sm'` \| `'md'` \| `'lg'` | `'md'` — 2rem, 2.5rem or 4rem |
| `color` | `'neutral'` \| `'primary'` \| `'secondary'` | `'primary'` — the background of the initials, which take its on- color |
| `decorative` | `boolean` | `false` — screen readers skip it, like next to the name it shows |

The initials are the first letters of the first and the last word of the name, uppercased in the language of the app (`LOCALE_ID`). They show while the picture loads, and grow the circle with larger text. Like an icon it adds no box to the layout. Change the defaults of `size` and `color` with `provideAvatarConfig`.

## Rating
A rating as stars, like 4.4 out of 5, filled up to the exact value, a part of the last star as well. It only shows a rating, the user can't give one:

```html
<ui-rating [value]="4.4" />
```

| Input | Values | Default |
|---|---|---|
| `value` | `number` | — required, from 0 to `max`; values outside fill no or all stars |
| `max` | `number` | `5` — how many stars there are |

Screen readers read it as one image, like `'4.4 out of 5 stars'`, with the value written in the language of the app (`LOCALE_ID`), like `'4,4'` in German. The stars are as large as the text around them. The filled stars are the token `--color-rating`, which has to keep 3:1 to `surface` and `surface-container`; the empty ones are `outline-variant`. In forced colors mode, where every star would be the same color, only the filled ones show. Change the default `max` and the text with `provideRatingConfig({ max, label })`; `label` takes the written value and `max`.

## Rating badge
A link to the ratings of a site, like the reviews on Google, as a pill with the logo of the site, the stars and the value. It stays your own link, so `href`, `target` and `routerLink` work as on any link:

```html
<a ui-rating-badge href="https://maps.app.goo.gl/…" target="_blank" [value]="4.4"></a>
```

| Input | Values | Default |
|---|---|---|
| `value` | `number` | — required, from 0 to `max` |
| `max` | `number` | the `max` of `provideRatingConfig`, `5` |
| `logo` | `{ src: string, alt: string }` | the "G" of Google — the image at the start and the name of the site, which screen readers read before the rating |

Screen readers read the link as the name of the site and the [rating](#rating), like `'Google, 4.4 out of 5 stars'`, and that it opens in a new tab when it has a static `target="_blank"`, with the `newTabLabel` of `provideLinkConfig`. It is raised like a card, so it stands out on a colored header or a picture as well. The corner radius is the token `--radius-rating-badge`, a pill by default. Change the default logo with `provideRatingBadgeConfig({ logo })`, like for another review site.

## Details
A section that opens and closes, on the native `<details>` element. The `<ui-summary>` is always visible and is read as a button, so put nothing interactive inside it:

```html
<ui-details [(open)]="open">
    <ui-summary>Shipping</ui-summary>
    <p>Orders ship within two working days.</p>
</ui-details>
```

| Input | Values | Default |
|---|---|---|
| `open` | `boolean` | `false` — whether it is open, bind it with `[(open)]` or as `[open]="true"` |
| `name` | `string` | — sections with the same name work like an accordion, where only one is open at a time |
| `variant` | `'outlined'` \| `'filled'` \| `'plain'` | `'outlined'` — a box with a border, a box filled with `surface-container`, or plain with a divider below, like the questions of an FAQ |
| `color` | `'neutral'` \| `'primary'` \| `'secondary'` | `'neutral'` — like the color of a button: filled, its summary is a [colored surface](#colored-surfaces), whose text and chevron take the on- colors of it, above content in the container color; outlined and plain, it is the color of the border or divider and of the chevron, open or not |

`focus()` focuses the summary. The corner radius is the token `--radius-details`. Change the defaults of `variant` and `color` with `provideDetailsConfig`.

## Data list
Labels and their values, like the details of a customer, on the native description list (`<dl>`). The type of a value decides how it shows: a text as it is, a number or a `Date` with `Intl` in the language of the app (`LOCALE_ID`), and a template for anything else, like a list of links. Nothing shows for `undefined`:

```html
<ng-template #links>
    <a ui-link href="https://example.com">Website</a>
</ng-template>
<ui-data-list
    [items]="[
        { label: 'Customer number', value: 'MM-42' },
        { label: 'Birthday', value: birthday },
        { label: 'Revenue', value: 98765.4, numberFormat: { style: 'currency', currency: 'EUR' } },
        { label: 'Links', value: links }
    ]"
/>
```

| Item | Values | Default |
|---|---|---|
| `label` | `string` | — what the value is |
| `value` | `string` \| `number` \| `Date` \| `TemplateRef` \| `undefined` | — |
| `dateFormat` | `Intl.DateTimeFormatOptions` | `{ dateStyle: 'medium' }` — how a date is written |
| `numberFormat` | `Intl.NumberFormatOptions` | `{}` — how a number is written |

Each label stands next to its value while the list is at least 24rem wide, and above it where it is narrower. It goes by its own width, not the one of the screen, so it also stacks in a narrow dialog. Change the default `dateFormat` and `numberFormat` with `provideDataListConfig`.

## Card
A surface that groups related content, like a widget of a dashboard. The heading stays yours, so its level fits the page:

```html
<ui-card>
    <h2 class="mb-2 font-heading text-title">Orders</h2>
    <p>12 orders are waiting to be shipped.</p>
</ui-card>
```

| Input | Values | Default |
|---|---|---|
| `variant` | `'elevated'` \| `'outlined'` \| `'filled'` | `'elevated'` — raised by `shadow-1`, outlined with a border in `outline-variant`, or filled with `surface-container` |
| `color` | `'neutral'` \| `'primary'` \| `'secondary'` | `'neutral'` — elevated, a bar at the top in the color; outlined, the border; filled, the background, whose content takes the on- colors of it like on a [colored surface](#colored-surfaces), so its text, links and controls keep their contrast |
| `flush` | `boolean` | `false` — the content goes up to the edges, like an image at the top, and brings its own padding, like the [article card](#article-card) |

Place cards with a grid of your own, like `grid gap-4 md:grid-cols-12` with `md:col-span-4` on each card. The corner radius is the token `--radius-card`. Change the default `variant` and `color` with `provideCardConfig`.

## Testimonial
What a person says about you, like a member about a club or a customer about a product, on a [card](#card). The quote is your own content:

```html
<div class="grid gap-4 md:grid-cols-3">
    <ui-testimonial name="Ada Lovelace" subtitle="Member since 2019" [rating]="5">
        <p>A great club with great coaches.</p>
    </ui-testimonial>
</div>
```

| Input | Values | Default |
|---|---|---|
| `name` | `string` | — required, the name of the person |
| `subtitle` | `string` | — what sets the person apart, below their name, like their company |
| `avatar` | `string` | — the url of a picture of the person; without one, their initials show, like in an [avatar](#avatar) |
| `rating` | `number` | — the rating they gave, as [stars](#rating) above the quote; without one, there are none |
| `max` | `number` | the `max` of `provideRatingConfig`, `5` |
| `variant` | `'card'` \| `'quote'` | `'card'` — a card, like several next to each other in a grid, or a large quote with a portrait of the person beside it, like the one a page is built around |

It is a `<figure>`: the quote is a `<blockquote>`, the person its `<figcaption>`. The card follows `provideCardConfig`, so provide it around a section of testimonials to change only their look. Next to each other in a grid, every testimonial is as high as the highest of its row.

As a quote, the text is as large as a headline and the `avatar` is a portrait beside it, at the end once the testimonial is 48rem wide and above the quote where it is narrower, with the corners of a card. Without an `avatar` there is no portrait, and the quote takes the whole width. Change the default variant with `provideTestimonialConfig({ variant })`.

## Person card
A person on a [card](#card), like a member of a team or the contact person of a page: their photo, name and position, a description as your own content, buttons that call or write them, and actions of your own:

```html
<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <ui-person-card name="Ada Lovelace" position="Head coach" photo="/team/ada.jpg" email="ada@example.com">
        <p>Trains the youth teams since 2019.</p>
    </ui-person-card>
</div>

<ui-person-card layout="contact" name="Grace Hopper" position="Memberships" phone="+49 2234 12 34-5">
    <ui-person-card-actions>
        <a ui-button variant="outlined" size="sm" target="_blank" [href]="whatsAppHref">
            <ui-icon [icon]="faWhatsapp" /> WhatsApp <span class="sr-only">(opens in a new tab)</span>
        </a>
        <a ui-button size="sm" routerLink="/trial">Book a trial</a>
    </ui-person-card-actions>
</ui-person-card>
```

```ts
// the logo from the brand icons of Font Awesome, which your app installs
protected readonly faWhatsapp: IconDefinition = faWhatsapp;
protected readonly whatsAppHref: string = LinkUtilities.resolveWhatsAppHref('+49 171 1234567');
```

WhatsApp, Instagram and any other way to reach the person are links of your own in `<ui-person-card-actions>`, with the logo you choose. `LinkUtilities.resolveWhatsAppHref` of `@service-soft/ui/link` resolves the href of a chat on WhatsApp from the number with its country code.

| Input | Values | Default |
|---|---|---|
| `name` | `string` | — required, the heading of the card |
| `position` | `string` | — what the person does, below their name, like `'Head coach'` |
| `photo` | `string` | — the url of a photo, best in 4:5; without one, or while it can't be loaded, their initials show, like in an [avatar](#avatar) |
| `phone` | `string` | — the number as it is written; its button calls the digits |
| `email` | `string` | — the address, whose button writes an email |
| `layout` | `'portrait'` \| `'contact'` | `'portrait'` — the photo over the full width above the text, for a team page, or a compact card with a small photo next to the text, which wraps below it where the card is too narrow |
| `headingLevel` | `1` to `6` | `3` — the level of the [heading](#heading) the name is, so it fits the headings of the page |

The photo is decorative, the name is right after it, and it keeps its frame of 4:5 while it loads. It is shown by `NgOptimizedImage`, which loads it lazily; a data or blob url, which `NgOptimizedImage` refuses, is shown as it is. Its corner radius is the token `--radius-person-card-photo`. The buttons are outlined [buttons](#button) after the description, `<ui-person-card-actions>` adds more of your own after them, and a portrait keeps them at the bottom, so they line up in a row of cards. Place the cards with a grid of your own; next to each other, every portrait is as high as the highest of its row. The card follows `provideCardConfig`. Change the defaults with `providePersonCardConfig({ layout, headingLevel })`. The hrefs come from `LinkUtilities.resolvePhoneHref` and `resolveEmailHref` of `@service-soft/ui/link`, which work for links of your own as well.

## Address
The address of a business or a person and how to reach them, on the native `<address>`:

```html
<ui-address
    name="Dental practice Example"
    phone="+49 (0) 2234 12 34-5"
    fax="+49 2234 12 34-6"
    email="info@example.com"
    businessType="Dentist"
    [address]="{ street: 'Main Street 1', postalCode: '50999', city: 'Cologne', country: 'Germany' }"
/>
```

| Input | Values | Default |
|---|---|---|
| `address` | `{ street, postalCode, city, region?, country? }` | — required |
| `name` | `string` | — the name of the business or the person, above the address |
| `phone` | `string` | — the number as it is written, linked to its digits, like `tel:+49223412345` |
| `fax` | `string` | — shown, not linked |
| `email` | `string` | — linked with `mailto:` |
| `icons` | `boolean` | `true` — an icon before each contact, with its label read by screen readers; without, the label shows, like `'Phone:'` |
| `microdata` | `boolean` | `true` — the schema.org microdata search engines read |
| `businessType` | `string` \| `undefined` | `'LocalBusiness'` — the schema.org type, like `'Dentist'` or `'SportsClub'` |

The phone number shows as it is written and calls only its digits, without the `(0)` an international number is often written with. With microdata, the block is an item of the `businessType`, with its name, a `PostalAddress` and the `telephone`, `faxNumber` and `email`. With `businessType` set to `undefined`, its properties belong to an item of your own around it instead, like one that holds the [opening hours](#opening-hours) as well:

```html
<div itemscope itemtype="https://schema.org/Dentist">
    <ui-address name="Dental practice Example" phone="+49 2234 12 34-5" [address]="address" [businessType]="undefined" />
    <ui-opening-hours [week]="week" />
</div>
```

The postal code is before the city, like in most of Europe. Change the defaults and the labels with `provideAddressConfig({ icons, microdata, businessType, phoneLabel, faxLabel, emailLabel })`.

## Opening hours
The opening hours of a week, like the ones of a practice, with split hours, closed days and a note per day:

```ts
protected readonly week: OpeningHoursDay[] = [
    { weekday: 1, ranges: [{ opens: '08:00', closes: '12:00' }, { opens: '14:00', closes: '18:00' }] },
    { weekday: 2, ranges: [{ opens: '08:00', closes: '12:00' }, { opens: '14:00', closes: '18:00' }] },
    { weekday: 5, ranges: [{ opens: '08:00', closes: '13:00' }], note: 'Only by appointment' }
];
```

```html
<ui-opening-hours group timeZone="Europe/Berlin" [week]="week" />
```

| Input | Values | Default |
|---|---|---|
| `week` | `OpeningHoursDay[]` | — required, each day with its `weekday` (0 is Sunday, like `Date.getDay`), its `ranges` and an optional `note`. Days that are left out, or have no ranges, are closed |
| `firstDayOfWeek` | `0` to `6` | `1` — Monday |
| `group` | `boolean` | `false` — days after each other with the same hours and note share a row, like `'Monday – Thursday'` |
| `status` | `boolean` | `true` — says above the days whether it is open now |
| `timeZone` | `string` | the one of the browser — the time zone of the business, like `'Europe/Berlin'`, which today and the status are in, wherever the visitor is |
| `dayFormat` | `'long'` \| `'short'` | `'long'` — `'Monday'` or `'Mon'` |
| `microdata` | `boolean` | `true` — the hours as schema.org `openingHoursSpecification` |

Times are `'HH:mm'` in 24 hours, a range that closes at or before it opens ends on the next day, like `'18:00'` to `'02:00'`, and midnight is `'00:00'`. The names of the days and the times are written with `Intl` in the language of the app (`LOCALE_ID`), like `'8:00 AM'` in English and `'8:00'` in German. It is a table, whose row headers are the days: screen readers read each day with its hours, and their table navigation moves from day to day. The dash between two days or two times is read as `'to'`.

Today is bold and labelled `'Today'`, and the status is `'Open now'` or `'Closed now'` with a dot in `success` or `outline`. Both are only worked out in the browser, after the page is hydrated, and every minute after that: a page rendered on the server or built ahead of time leaves them out, so it never shows a day that has passed. The line of the status keeps its height until then, so nothing moves. The microdata is a property of the item around it, like a [ui-address](#address) or an element of your own with `itemscope`, one specification per range for all days of its row. Change the defaults and the texts with `provideOpeningHoursConfig`.

## Consent gate
Loads content of a third party, like a map, a video or any other embed, only once the user allowed it. Until then, a placeholder says who the content is from and why it needs consent, links to the privacy policies, and has a button that loads it, and optionally one that always allows the provider. The content is an `<ng-template>`, so nothing of it exists before the consent:

```html
<ui-consent-gate
    provider="YouTube"
    providerPrivacyPolicyUrl="https://policies.google.com/privacy"
    aspectRatio="16 / 9"
    alwaysAllow
    [(consented)]="youTubeAllowed"
    (alwaysAllowed)="keepYouTubeAllowed()"
>
    <ng-template><ui-iframe src="https://www.youtube-nocookie.com/embed/…" label="Video of the club" /></ng-template>
</ui-consent-gate>
```

| Input | Values | Default |
|---|---|---|
| `provider` | `string` | — required, who the content is from, which the texts name |
| `consented` | `boolean` | `false` — whether the content loads, bind it with `[(consented)]` |
| `privacyPolicyUrl` | `string` | `privacyPolicyUrl` of `provideConsentGateConfig` — your privacy policy; without one, there is no link |
| `providerPrivacyPolicyUrl` | `string` | — the privacy policy of the provider, which opens in a new tab |
| `alwaysAllow` | `boolean` | `false` — a second button that loads the content and emits `alwaysAllowed`, for your app to keep the choice |
| `aspectRatio` | `string` | — the ratio of the width to the height, like `'16 / 9'`, which the placeholder keeps as well, so nothing moves when the content loads. A placeholder whose text doesn't fit grows instead of being cut off |

The gate keeps nothing itself: bind `consented` to where your app keeps the consent, and keep it when `alwaysAllowed` emits. Set it in the browser after the first render, like in `afterNextRender`, so a page rendered on the server and its hydration agree. After a button loaded the content, the content takes the focus, so the next Tab goes into it. With [@service-soft/ngx-tracking](https://www.npmjs.com/package/@service-soft/ngx-tracking), `ngxConsentTracking` of `@service-soft/ngx-tracking/consent-gate` binds a gate to a tracking of its consent dialog. The placeholder is filled with `surface-container`, which a [colored surface](#colored-surfaces) changes as well, and its corner radius is the token `--radius-consent-gate`. Change the defaults and the texts, like the url of your privacy policy, with `provideConsentGateConfig`; the texts that name the provider are functions of it.

## Iframe
An embedded page of another site, like a video or a map, on a native `<iframe>` that loads once it is close to the screen:

```html
<ui-iframe src="https://www.youtube-nocookie.com/embed/…" label="Video of the club" />
```

| Input | Values | Default |
|---|---|---|
| `src` | `string` | — required, an `http` or `https` url |
| `label` | `string` | — required, the title of the iframe, which screen readers read |
| `aspectRatio` | `string` \| `undefined` | `'16 / 9'` — keeps its space before it loads; `undefined` fills the height of its parent |

Angular only binds the `src` of an iframe to a url it trusts, so the iframe trusts the `src` as it is: give it urls of your app, never one a user typed. Other urls than `http` and `https`, like `javascript:`, are refused with an error. It sends other sites only the origin of the page as referrer. Its corner radius is the token `--radius-iframe`. Put it into a [consent gate](#consent-gate) to load it only after consent. Change the default ratio with `provideIframeConfig({ aspectRatio })`.

## Map
A map of a location behind a [consent gate](#consent-gate): it only loads from its provider once the user allowed it. Below it, a link plans the route there, which works without consent, as it is only a link that sends nothing before the user follows it:

```html
<ui-map label="Map of the practice" [location]="{ address: 'Main Street 1, 50999 Cologne' }" [(consented)]="mapAllowed" />
```

| Input | Values | Default |
|---|---|---|
| `location` | `{ address, coordinates? }` \| `{ address?, coordinates }` | — required, the address as it is written and/or its `{ latitude, longitude }` |
| `provider` | `MapProvider` | `GOOGLE_MAPS_PROVIDER` |
| `zoom` | `number` | `15` — from 1 for the whole earth to about 20 for a house |
| `aspectRatio` | `string` \| `undefined` | `'16 / 9'` — `undefined` fills the height you give the map, like with `h-96` |
| `label` | `string` | `'Map'` — what screen readers call the map |
| `consented`, `alwaysAllow` | | like a [consent gate](#consent-gate), and `alwaysAllowed` too |

Google Maps needs no api key: the map is the embed of a search, by the address or the coordinates, and the route the directions of Google Maps. `OPEN_STREET_MAP_PROVIDER` shows a location by its coordinates, which it needs; its route leads there with the directions of OpenStreetMap, or searches the address. Use another provider for every map with `provideMapConfig({ provider: OPEN_STREET_MAP_PROVIDER })`, or write a `MapProvider` of your own, a name, the url of its privacy policy and the functions that resolve the url of the embed and of the route; `MapLocationUtilities` helps with the location. Directions in words, like how to get there by train, are a [data list](#data-list) of your own next to the map. Change the defaults and the text of the route link with `provideMapConfig({ provider, zoom, aspectRatio, label, routeLabel })`.

## Heading
A native heading whose level is a value, for a component whose heading has to fit the page it is on, like the heading of a [section](#section) or the name of a [pricing card](#pricing-card). It renders an `<h1>` to `<h6>` around your own content, like a text or a link, which search engines and screen readers read as the heading it is:

```html
<ui-heading class="font-heading text-title" [level]="level">Prices</ui-heading>
<ui-heading class="font-heading text-title" [level]="3"><a ui-link appearance="subtle" routerLink="/news/summer-party">Summer party</a></ui-heading>
```

| Input | Values | Default |
|---|---|---|
| `level` | `1` to `6` | — required |

The heading takes the look of the element, so style `<ui-heading>`; Tailwind's preflight gives headings the font of what they are in. An `id` stays on the element, whose text is the one of the heading, so an `aria-labelledby` can point to it.

## Section
The container every section of a website repeats from top to bottom: its content in the width of the token `--container-section`, with the space of `--spacing-section-padding` above and below it, and optionally a heading, a small eyebrow above it and a lead text below it:

```html
<ui-section sectionId="prices" heading="Prices" eyebrow="Membership" lead="One fee for every department." background="surface-container">
    <div class="grid gap-4 md:grid-cols-3">…</div>
</ui-section>

<ui-section heading="About the club" [level]="1" align="center" lead="A club for the whole family." />
```

| Input | Values | Default |
|---|---|---|
| `heading` | `string` | — without one, there is no heading, eyebrow or lead, and the content brings its own |
| `level` | `1` to `6` | `2` — the [heading](#heading) of the section; `1` for the intro at the top of a page, in `text-display`; `2` in `text-headline`, deeper ones in `text-title` |
| `eyebrow` | `string` | — a short text above the heading, like the topic of the section |
| `lead` | `string` | — a text below the heading that leads into the section |
| `background` | `'surface'` \| `'surface-container'` \| `'primary'` \| `'secondary'` | `'surface'` — a theme color is a [colored surface](#colored-surfaces), whose content takes its on- colors |
| `align` | `'start'` \| `'center'` | `'start'` — where the heading, the eyebrow and the lead stand; the content decides its own alignment |
| `sectionId` | `string` | — the id of the `<section>`, which a link scrolls to with it as its fragment, like the anchors of [ngx-navigation](https://www.npmjs.com/package/@service-soft/ngx-navigation) |

It is a `<section>` named by its heading through `aria-labelledby`, a region screen readers can jump to; without a heading it is only a group. The eyebrow belongs to the heading in an `<hgroup>`. The section takes the full width, so its background reaches the edges of the page, with a gutter at the sides on narrow screens. Change the defaults with `provideSectionConfig({ level, background, align })`.

## Callout
A note in the content of a page that stands out from the text around it, like a hint, a warning or an offer, with an icon of its tone, an optional heading and your own content:

```html
<ui-callout tone="warning" heading="Closed on holidays">
    <p>The office is closed on public holidays.</p>
</ui-callout>
```

| Input | Values | Default |
|---|---|---|
| `tone` | `'neutral'` \| `'info'` \| `'success'` \| `'warning'` \| `'error'` \| `'promo'` | `'info'` — the tint it is drawn on (`surface-container`, `primary-tint`, `success-tint`, `warning-tint`, `error-tint`, `secondary-tint`), with a bar at the start and an icon in the color of the tone |
| `heading` | `string` | — the heading above the content |
| `icon` | `IconDefinition` | the icon of the tone — a light bulb, a circled i, a check, a triangle, an exclamation mark or a star |

It is static content, not a message that appears, so it is no live region and screen readers read it where it is. They read what the tone means before it, like 'Warning', as they get neither the color nor the icon; neutral and promo say nothing of their own. Neutral, info and promo follow a [colored surface](#colored-surfaces); success, warning and error keep their tints, so they belong on the surface, like a form with validation. The corner radius is the token `--radius-callout`. Change the default tone, the icons and the texts with `provideCalloutConfig({ tone, icons, toneLabels })`.

## Media split
Media next to text, like an image beside a paragraph about it. The media goes into `<ui-media-split-media>`, the text is the rest of your content:

```html
<ui-media-split position="end">
    <ui-media-split-media><img ngSrc="/hall.jpg" alt="The new hall" width="800" height="600" /></ui-media-split-media>
    <h2 class="font-heading text-headline">Our new hall</h2>
    <p>Built in 2024, with room for six teams at once.</p>
</ui-media-split>
```

| Input | Values | Default |
|---|---|---|
| `position` | `'start'` \| `'end'` | `'start'` — on which side of the text the media stands; splits below each other that switch it zig-zag down a page |
| `mediaWidth` | `'narrow'` \| `'half'` \| `'wide'` | `'half'` — how much of the width the media takes: a third, half, or three fifths |
| `align` | `'start'` \| `'center'` | `'center'` — whether the media and the text line up at their tops or are centered on each other |

Where the split is narrower than 48rem, the media stands above the text, whatever its position. It goes by its own width, not the one of the screen, so it also stacks in a narrow column. The media stays first in the html, so screen readers read it in the same order on every screen. It takes the width of its column and keeps its own aspect ratio; its corners are the token `--radius-media-split`. Change the defaults with `provideMediaSplitConfig({ position, mediaWidth, align })`.

## Check list
A list whose items each start with an icon, a check by default, like the features of a plan, with items that are not included:

```html
<ui-check-list>
    <ui-check-list-item>Every course of every department</ui-check-list-item>
    <ui-check-list-item [included]="false">A personal coach</ui-check-list-item>
</ui-check-list>
```

| Input | Values | Default |
|---|---|---|
| `color` | `'neutral'` \| `'primary'` \| `'secondary'` \| `'success'` | `'primary'` — of the icons of the included items; `success` keeps its color on a [colored surface](#colored-surfaces), the others take its on- color |
| `icon` | `IconDefinition` | a check — the icon of the included items |

An item takes `included`, `true` by default, and an `icon` of its own. One that is not included shows a cross and its text in the color of hints, so it differs in more than the color, and screen readers read 'not included' after it. Change the defaults, the icons and the text with `provideCheckListConfig({ color, icon, excludedIcon, excludedLabel })`.

## Steps
The steps of a process, like how to become a member, as a numbered list. Each step shows its number in a circle, joined to the next one by a line, with its heading and your own text:

```html
<ui-steps orientation="horizontal">
    <ui-step heading="Sign up"><p>Online or in the office.</p></ui-step>
    <ui-step heading="Try it"><p>Train with any group for two weeks.</p></ui-step>
</ui-steps>
```

| Input | Values | Default |
|---|---|---|
| `orientation` | `'vertical'` \| `'horizontal'` | `'vertical'` — below each other, or next to each other once the list is 48rem wide, and below each other where it is narrower |

It is an ordered list, so screen readers read the number of each step and how many there are; the numbers in the circles are decorative. The heading of a step is the title of the step, not a heading of the page. Change the default with `provideStepsConfig({ orientation })`.

## Timeline
Entries in the order of their dates, below each other on a line, like the history of a club, the stations of a CV or the dates of a course:

```html
<ui-timeline>
    <ui-timeline-entry date="March 1921" datetime="1921-03" heading="Founded"><p>By twelve gymnasts.</p></ui-timeline-entry>
    <ui-timeline-entry date="2019 – 2023" heading="Head coach" />
</ui-timeline>
```

| Input of an entry | Values | Default |
|---|---|---|
| `date` | `string` | — required, when it was, as it shows, like `'2019 – 2023'` or `'Since March 2021'` |
| `datetime` | `string` | — the date as machines read it, like `'2021-03'`; with one, the date is a `<time>` element for search engines |
| `heading` | `string` | — required, the title of the entry |

It is an ordered list, so write the entries in the order they should be read, oldest or newest first.

## Stat
A number that stands out, with what it counts below it, like '1,200 members'. Place stats next to each other with a grid of your own:

```html
<div class="grid gap-4 text-center sm:grid-cols-3">
    <ui-stat label="Members" prefix="+" [value]="1200" />
    <ui-stat label="Would recommend us" suffix=" %" [value]="98.5" [format]="{ maximumFractionDigits: 1 }" />
</div>
```

| Input | Values | Default |
|---|---|---|
| `value` | `number` | — required |
| `label` | `string` | — required, what the number counts |
| `prefix`, `suffix` | `string` | `''` — what stands right before and after the number, like `'+'` or `' %'` |
| `format` | `Intl.NumberFormatOptions` | `{}` — how the number is written in the language of the app (`LOCALE_ID`), like `{ notation: 'compact' }` for '1.2K' |
| `color` | `'neutral'` \| `'primary'` \| `'secondary'` | `'primary'` — of the number |
| `duration` | `number` | `1500` — how long it counts up, in milliseconds |

In the browser, the number counts up from 0 once it scrolls into view, keeping the fraction digits of its value on the way, unless the user prefers reduced motion. The page rendered on the server, search engines and screen readers always get the final value, and the number keeps the width of the final value while it counts, so nothing around it moves. Change the defaults with `provideStatConfig({ color, format, duration })`.

## Logo cloud
The logos of sponsors, partners or certificates, next to each other and wrapping into rows, each with the area of a square of the token `--spacing-logo-cloud` whatever the size of its image. With one height for all, a wide wordmark would look far bigger than a square logo. A wide logo is at most two and a half squares wide, a tall one at most a quarter higher than a square:

```html
<ui-logo-cloud [logos]="[{ src: '/sponsors/acme.svg', alt: 'Acme', width: 160, height: 48, href: 'https://acme.example' }]" />
```

| Logo | Values | Default |
|---|---|---|
| `src` | `string` | — the url of the image, also a data url |
| `alt` | `string` | — what the logo shows, like the name of the sponsor, and the name of its link |
| `width`, `height` | `number` | — the size of the image in pixels, which keeps the page from moving while it loads |
| `href` | `string` | — where the logo links to; without one, it is no link |
| `openInNewTab` | `boolean` | `true` — the default comes from `provideLogoCloudConfig({ openInNewTab })` |

| Input | Values | Default |
|---|---|---|
| `grayscale` | `boolean` | `false` — gray until the pointer is on a logo or its link has the focus, so colorful logos don't compete with the page. The color fades in and out over half a second; the default comes from `provideLogoCloudConfig({ grayscale })` |

Images load with `NgOptimizedImage`, lazily, data urls as they are. A link that opens in a new tab tells screen readers so after the logo, with the `newTabLabel` of `provideLinkConfig`. It gets the focus ring of a plain [link](#link), without the icon of a link to another site.

## Price
A price in the language of the app (`LOCALE_ID`) and its currency, optionally per a period and next to an old price that is struck through:

```html
<ui-price [amount]="49" period="month" [oldAmount]="59" />
```

| Input | Values | Default |
|---|---|---|
| `amount` | `number` | — required |
| `period` | `string` | — what it is paid for, like `'month'`, which shows as '/ month'; without one, it is a single payment |
| `oldAmount` | `number` | — the price before, like before a discount, struck through |
| `currency` | `string` | `'EUR'` — an ISO 4217 code |
| `format` | `Intl.NumberFormatOptions` | `{}` — on top of the currency, like `{ maximumFractionDigits: 0 }` for '€49' |
| `size` | `'md'` \| `'lg'` | `'md'` — the amount in `text-title`, or in `text-display`, like on a [pricing card](#pricing-card) |

Screen readers read it as '€49.00 per month, previously €59.00': the slash and the strike through don't reach them, so they get words for them. Change the defaults and the words with `providePriceConfig({ currency, format, size, perLabel, oldPriceLabel })`.

## Pricing card
A plan with its price, like a membership or a product, on a [card](#card): the name of the plan as a [heading](#heading), an optional description, and your own content for the rest, a [price](#price), the features, like a [check list](#check-list), and `<ui-pricing-card-actions>` at the bottom:

```html
<div class="grid gap-4 md:grid-cols-3">
    <ui-pricing-card name="Family" description="For two adults and their children." highlighted>
        <ui-price size="lg" period="month" [amount]="25" />
        <ui-check-list>…</ui-check-list>
        <ui-pricing-card-actions><a ui-button href="/join">Join</a></ui-pricing-card-actions>
    </ui-pricing-card>
</div>
```

| Input | Values | Default |
|---|---|---|
| `name` | `string` | — required, the name of the plan |
| `description` | `string` | — a sentence below the name, like who it is for |
| `highlighted` | `boolean` | `false` — the plan stands out, like the recommended one, in the `highlightColor` and with a badge before its name |
| `badge` | `string` | `'Recommended'` — the text of the badge |
| `headingLevel` | `1` to `6` | `3` — below the `h2` of the section of the plans |

The card follows `provideCardConfig`: a highlighted elevated card gets a bar at its top, an outlined one its border, a filled one is a [colored surface](#colored-surfaces), whose price, features and buttons take its on- colors. Next to each other in a grid, every card is as high as the highest of its row, with the actions at the same height and their buttons over the full width. The badge is a [badge](#badge), whose corner radius is the token `--radius-badge`. Change the defaults with `providePricingCardConfig({ headingLevel, badge, highlightColor })`.

## FAQ
Frequently asked questions, each one a [details section](#details) that opens to its answer:

```html
<ui-faq>
    <ui-faq-item question="How much is a membership?"><p>From 15 € a month.</p></ui-faq-item>
    <ui-faq-item question="Can I try it?" [open]="true"><p>For two weeks, for free.</p></ui-faq-item>
</ui-faq>
```

| Input | Values | Default |
|---|---|---|
| `variant` | `'plain'` \| `'outlined'` \| `'filled'` | `'plain'` — the variant of the details sections, plain with a divider below each question |
| `microdata` | `boolean` | `true` — whether the questions and answers carry the schema.org microdata of an `FAQPage` |
| `exclusive` | `boolean` | `false` — whether only one answer shows at a time, like an accordion: opening a question closes the one that was open |

An item takes its `question` and `open`, bound with `[(open)]` like a details section. An exclusive list gives the details sections of its questions one `name`, its own, so two lists on a page don't close each other's questions; the browser then closes the others when one opens. That is the native exclusive accordion of `<details name>`, in Chrome and Edge from 120, Safari from 17.2 and Firefox from 130; an older browser lets several stay open. The microdata is in the html of the questions and the answers, so search engines read your own content as the text of the answers, also while they are closed, without a script of JSON-LD. Turn it off for a page that already describes itself otherwise. Change the defaults with `provideFaqConfig({ variant, microdata, exclusive })`, the color with `provideDetailsConfig`.

## Dialog
A modal dialog on the native `<dialog>` element. The browser moves focus into it, keeps it there, closes it on escape, makes the rest of the page inert and returns focus to where it was. It is labelled by its first heading.

Open a component from code with the `DialogService`. The component injects `DialogRef` to close the dialog with a result and `DIALOG_DATA` for its data. `ConfirmDialogComponent` asks a question:

```ts
const confirmed: boolean | undefined = await inject(DialogService).open<boolean>(ConfirmDialogComponent, {
    title: 'Delete the order?',
    paragraphs: ['This can\'t be undone.'],
    confirmButtonLabel: 'Delete',
    cancelButtonLabel: 'Cancel',
    confirmButtonColor: 'error'
}).closed;
```

Its cancel button comes first and gets focus, so pressing enter right away never confirms. `MessageDialogComponent` tells the user something they have to notice, like an error, with one button that closes it:

```ts
inject(DialogService).open(MessageDialogComponent, {
    title: 'The order couldn\'t be placed',
    paragraphs: ['The payment was declined.'],
    closeButtonLabel: 'OK'
});
```

For a message the user doesn't have to act on, a [snackbar](#snackbar) interrupts less. Or write the dialog in the template and open it with `open()`; `close()` or a button in a `<form method="dialog">` closes it:

```html
<button ui-button type="button" (click)="newsletter.open()">Subscribe</button>
<ui-dialog #newsletter (closed)="subscribed()">
    <h2 class="font-heading text-title">Newsletter</h2>
    <form method="dialog"><button ui-button type="submit">Got it</button></form>
</ui-dialog>
```

`(closed)` emits whenever it closes, also on escape. A dialog without a heading needs a `label`, which screen readers announce as its name. The page behind it is dimmed with the token `--color-scrim`, the corner radius is `--radius-dialog`.

A question the user has to answer, which has no default, keeps escape from closing it: `<ui-dialog closeOnEscape="false">`, or `dialogService.open(component, data, { closeOnEscape: false })`. Its content then needs a button that closes it. Browsers without the `closedby` attribute still close it when escape is pressed twice in a row, and `(closed)` emits then as well.

A dialog is at most 32rem wide, enough for a message or a question. A form whose fields sit side by side takes `size="lg"`, up to 56rem: `<ui-dialog size="lg">`, or `dialogService.open(component, data, { size: 'lg' })`. On a smaller screen it takes the width there is. Content that needs the whole screen, like the pictures of a [gallery](#gallery), takes `size="fullscreen"`, without corners and shadow.

## Drawer
A panel that slides in from the side of the screen, like the navigation on a small screen, on a modal native `<dialog>`. The browser moves focus into it, keeps it there, makes the rest of the page inert, closes it on escape and returns focus to where it was. A click next to it closes it as well:

```html
<button ui-button type="button" (click)="navigation = true">Menu</button>
<ui-drawer label="Navigation" header [(open)]="navigation">
    <nav aria-label="Main">
        <a ui-link appearance="nav" block routerLink="/orders" (click)="navigation = false">Orders</a>
    </nav>
</ui-drawer>
```

On a phone, give its links and buttons the full width, so a tap anywhere in their row hits them, not only on their text: `ui-link` with `appearance="nav"` and `block` looks like a navigation item and spans the drawer, on an `<a>` as well as on a `<button>`.

Its content can tell that it is in a drawer: `inject(IS_IN_DRAWER)` is true there, and false anywhere else. A button that is only an icon elsewhere uses it to be such a row with its text, like the [theme switcher](#theme-switcher).

| Input | Values | Default |
|---|---|---|
| `open` | `boolean` | `false` — bind it with `[(open)]`, it follows when the user closes the drawer |
| `label` | `string` | required — what screen readers call the drawer |
| `side` | `'start'` \| `'end'` | `'start'` — the edge it slides in from, which flips in right-to-left languages |
| `color` | `'surface'` \| `'container'` \| `'primary'` \| `'secondary'` | `'surface'` — its background. Primary and secondary are [colored surfaces](#colored-surfaces): its content takes the colors that work on them |
| `header` | `boolean` | `false` — shows the label as a heading with a button that closes the drawer, a visible way out for touch users |

It takes the full height, and at most 85% of a narrow screen, so a strip of the page stays visible. It only slides with `prefers-reduced-motion` unset. Change the defaults with `provideDrawerConfig({ side, color, header, closeLabel })`; `closeLabel` names the button of the header, `'Close'` by default. The page behind it is dimmed with the token `--color-scrim`, the inner corners use `--radius-dialog`.

## Breadcrumbs
The way from the start of the app to the current page, as a navigation with a list of links. Each step holds your own [link](#link), so `routerLink`, middle clicks and crawlers work like with any link:

```html
<ui-breadcrumbs>
    <ui-breadcrumb><a ui-link routerLink="/">Home</a></ui-breadcrumb>
    <ui-breadcrumb><a ui-link routerLink="/orders">Orders</a></ui-breadcrumb>
    <ui-breadcrumb><a ui-link routerLink="/orders/1001" aria-current="page">Order 1001</a></ui-breadcrumb>
</ui-breadcrumbs>
```

Mark the current page with `aria-current="page"`, on its link or on a `<span>` when it links nowhere: screen readers announce it, and `ui-link` draws it as text instead of a link. An arrow separates the steps, and on a narrow screen they wrap. The `label` is what screen readers call the navigation, `'Breadcrumbs'` by default; change it with `provideBreadcrumbsConfig({ label })`, like to translate it.

## Menu
A menu of actions and links, on a native popover. The browser opens and closes it, closes it on escape or a click outside, and tells screen readers whether it is open. It opens below its trigger, or above when there is no space, with CSS anchor positioning:

```html
<button ui-button type="button" [uiMenuTrigger]="menu">Reset</button>
<ui-menu #menu>
    <ui-menu-item (click)="reset()">This change</ui-menu-item>
    <ui-menu-item [disabled]="!canRollback" (click)="rollback()">Everything back to this state</ui-menu-item>
</ui-menu>
```

The trigger stays a directive on your own `button`, because it only adds behaviour to it. The items follow the trigger in the tab order. Choosing one closes the menu and returns focus to the trigger before your click handler runs, so a dialog it opens returns focus there as well. The corner radius is the token `--radius-menu`.

Items that are a choice of several, like the modes of the [theme switcher](#theme-switcher), mark the chosen one with `[pressed]`, which screen readers announce. Give it a visible mark as well, like a check: color is never the only cue.

Links are your own `<a>` with `ui-menu-link`, so `routerLink`, middle clicks and new tabs work like with any link. A menu inside of a menu is a submenu, which an item opens beside it:

```html
<button ui-button type="button" variant="text" [uiMenuTrigger]="account">Account</button>
<ui-menu #account>
    <a ui-menu-link routerLink="/profile">Profile</a>
    <ui-menu-item [submenu]="settings">Settings</ui-menu-item>
    <ui-menu #settings>
        <a ui-menu-link routerLink="/settings/password">Password</a>
    </ui-menu>
</ui-menu>
```

The links of a submenu follow its item in the tab order, and escape closes only the submenu. Following a link or choosing an item anywhere closes every menu, with the focus back at the first trigger. The submenu opens on the other side when there is no space, and below its item on a screen too narrow for either.

## Theme switcher
Lets users choose the color mode of the page: the one of their operating system, light or dark. A button with the icon of the current mode opens a [menu](#menu) of the three, the current one marked with a check and announced as pressed:

```html
<ui-theme-switcher />
```

The choice is remembered in the browser and applied to `<html>` as the class `light` or `dark` (see [Dark mode](#dark-mode)). Choosing "System" forgets it again. Inside of a `<ui-menu>`, like a menu of a navbar, the modes are items of that menu instead. Inside of a [drawer](#drawer), like the one of a navbar on a phone, the button is a row of the drawer that names the current mode beside its icon, as the drawer has the room for it and lists text below each other.

Prerendered pages and pages rendered on the server don't know the choice of a browser. So the page doesn't show in the wrong mode until the app has started, add the script of `ThemeModeUtilities.INIT_SCRIPT` to the `<head>` of your `index.html`. It is this, for `localStorage` key `ui-theme-mode`:

```html
<script>try{var m=localStorage.getItem('ui-theme-mode');if(m==='light'||m==='dark')document.documentElement.classList.add(m)}catch(e){}</script>
```

If your site sends a Content-Security-Policy, allow the script by its hash.

`ThemeService` is the same choice in code: `mode()` is the current one, `setMode('dark')` changes it. On the server, the mode is always `'system'`. The texts and icons are set with `provideThemeSwitcherConfig({ label, modeLabels, modeIcons })`.

## Pagination
Goes through pages, like the ones of a list zibri answers in pages: a navigation with buttons for up to five pages around the current one, between buttons for the page before and after and for the first and the last page:

```html
<ui-pagination [totalAmount]="result.totalAmount" [pageSize]="10" [(page)]="page" />
```

| Input | Values | Default |
|---|---|---|
| `page` | `number` | `1` — the current page, from 1 on, bind it with `[(page)]` |
| `totalAmount` | `number` | required — how many items there are on all pages together |
| `pageSize` | `number` | required — how many items a page has |
| `label` | `string` | `'Pages'` — what screen readers call the navigation; give each its own when a page has more than one |
| `color` | `primary`, `secondary` | `primary` — the color of the button of the current page, and of the text of the others |

It shows nothing while there is only one page. The current page is in the middle of the five, or moved to the side near the first and the last page, so there are always five while there are enough pages, and every button of a page is as wide as the number of the last page: the pagination keeps its width from page to page, and nothing jumps under the pointer. Screen readers announce the button of the current page as the current one, and it is drawn filled, so it stands out by its shape as well. When an arrow can no longer be used, on the first or the last page, focus moves to the button of that page. On narrow screens the buttons wrap. Change the color, the label and the names of the buttons with `providePaginationConfig({ color, label, firstLabel, previousLabel, nextLabel, lastLabel, pageLabel })`, like to translate them.

## Popover
A panel with any content, like the options of a filter, on a native popover. It opens below its trigger like a menu, but stays open while the user works inside of it. The browser closes it on escape or a click outside, returns focus to the trigger and tells screen readers whether it is open:

```html
<button ui-button type="button" variant="outlined" [uiPopoverTrigger]="filter">Applications</button>
<ui-popover #filter>
    <fieldset>
        <legend>Applications</legend>
        <label><input type="checkbox" /> Api</label>
    </fieldset>
</ui-popover>
```

Its content follows the trigger in the tab order. `close()` closes it from code. Near the edge of the screen its content wraps, and it opens above its trigger when there is no space below. The corner radius is the token `--radius-popover`.

## Snackbar
A short message at the bottom of the screen, like "Saved.", which screen readers announce without moving the focus:

```ts
inject(SnackbarService).open('Saved the order.');
inject(SnackbarService).open('Deleted the order.', { duration: 8000 });
inject(SnackbarService).open('Couldn\'t save the order.', { color: 'error' });
```

It hides itself after five seconds, so use it only for information the user doesn't have to act on. One message shows at a time: a new one replaces the one before. Its `color` is `neutral`, in the colors of the text and the surface swapped, or `primary`, `secondary`, `error` or `success`, with the on- color of it as its text. Let the message say what happened as well, the color alone doesn't for everyone. Change the duration and the color for the whole app with `provideSnackbarConfig({ duration, color })`. Its corner radius is the token `--radius-snackbar`.

## Result
A centered page or section that tells the result of something, like the thanks for an order, a payment that went through or failed, maintenance or an error: an icon of its tone, a heading, your text and its actions:

```html
<ui-result tone="success" heading="Thank you for your booking">
    <p>We sent the confirmation to your email address.</p>
    <ui-result-actions>
        <a ui-button routerLink="/bookings">Show my booking</a>
        <a ui-button variant="outlined" routerLink="/">Back to the start page</a>
    </ui-result-actions>
</ui-result>
```

| Input | Values | Default |
|---|---|---|
| `heading` | `string` | required — the heading, which says the result in words |
| `tone` | `'neutral'` \| `'info'` \| `'success'` \| `'warning'` \| `'error'` | `'neutral'` — sets the icon and its color; the tones of a [callout](#callout), without `promo`, as a result is never an offer |
| `headingLevel` | `1` to `6` | `1` — such a page is usually all a page shows; lower it when the result is a section of one |
| `icon` | `IconDefinition` | the one of the tone — like a wrench for maintenance |

The icon is in a circle filled with the color of the tone, and every tone has an icon of its own, so the color is never the only cue; it is decorative, as the heading says the result. The actions stand next to each other and wrap on a narrow screen. Change the defaults with `provideResultConfig({ tone, headingLevel, icons })`, where `icons` changes the icon of single tones.

## Back to top
A button in the bottom end corner of the screen that goes back to the top of the page, for long pages. Put it once in the layout of your app:

```html
<router-outlet />
<ui-back-to-top />
```

It shows once the page is scrolled further than the height of the screen, and scrolls smoothly, unless the user prefers reduced motion. It moves the focus to the start of the page as well, so the next Tab goes to the first element of the page, not on from the bottom. It floats over the content, filled and raised by a shadow, below [snackbars](#snackbar), which cover it while they show. While it is on the page, the page has scroll padding at the bottom, so an element that is scrolled into view, like by the focus, never ends up under it. It shows an arrow and is named "Back to top" for screen readers.

| Input | Values | Default |
|---|---|---|
| `color` | `primary`, `secondary`, `error`, `success` | `secondary` — the color it is filled with |

It is round, which sets it apart from the buttons of the page; the token `--radius-floating-button` changes that, like to `var(--radius-button)` to match them. Change the color and the name for the whole app with `provideBackToTopConfig({ color, label })`, like to translate it. The button of the privacy settings of [ngx-tracking](https://www.npmjs.com/package/@service-soft/ngx-tracking) takes the other corner, and looks the same.

## News ticker
A bar of headlines that move through it from the end to the start, like the latest news on a home page. Each headline holds your own [link](#link), so `routerLink`, middle clicks and crawlers work like with any link:

```html
<ui-news-ticker color="secondary">
    @for (post of posts(); track post.id) {
        <ui-news-ticker-item><a ui-link appearance="subtle" [routerLink]="['/news', post.slug]">{{ post.title }}</a></ui-news-ticker-item>
    }
    <ui-news-ticker-actions><a ui-button size="sm" routerLink="/news">All news</a></ui-news-ticker-actions>
</ui-news-ticker>
```

| Input | Values | Default |
|---|---|---|
| `color` | `'neutral'` \| `'primary'` \| `'secondary'` | `'neutral'` — the background; a theme color is a [colored surface](#colored-surfaces), whose headlines, button and actions take its on- colors |
| `icon` | `IconDefinition` \| `undefined` | a bullhorn — the icon at the start, `undefined` for none |
| `speed` | `number` | `50` — how fast the headlines move, in pixels per second, however many there are |
| `label` | `string` | `'News'` — what screen readers call the ticker; give each one its own when a page has more than one |

A link with `appearance="subtle"` keeps the color of the ticker and is underlined on hover. A line separates the headlines, and `<ui-news-ticker-actions>` stay at the end, where they don't move. The headlines move in from the end and out at the start, and start over; screen readers read each of them once. Moving content needs a way to stop it (WCAG 2.2.2), so a button stops and moves them; hovering them stops them as well, so one can be clicked. While the focus of a keyboard is on a headline, and when the user prefers reduced motion, they stand still and wrap, so every one of them can be read; with reduced motion there is no button. The animation is the token `--animate-news-ticker`, and `--animate-news-ticker-rtl` in right-to-left. Change the defaults and the texts with `provideNewsTickerConfig({ color, icon, speed, label, pauseLabel, playLabel })`.

## Table
A table of rows a page at a time, like the ones zibri answers in pages. The columns come from a config, a column can be ordered by and filtered, and a cell can have a template of its own. The table only says what the user wants: bind the page, the page size, the order and the filters, load the rows they ask for and give them to `rows`, with how many there are in total:

```html
<ui-table
    label="Customers"
    [columns]="columns"
    [rows]="result().items"
    [totalAmount]="result().totalAmount"
    [rowKey]="getId"
    selectable
    opens
    [actions]="actions"
    [(pageSize)]="pageSize"
    [(page)]="page"
    [(order)]="order"
    [(filters)]="filters"
    [(selected)]="selected"
    (opened)="open($event)"
/>
<ng-template #status let-customer><ui-status-badge [status]="customer.status" /></ng-template>
<ng-template #actions let-customer><button ui-button type="button" variant="text" (click)="delete(customer)">Delete</button></ng-template>
```

```ts
protected readonly status: Signal<TemplateRef<TableCellContext<Customer>>> = viewChild.required('status');

protected readonly columns: Signal<TableColumn<Customer>[]> = computed(() => [
    { key: 'name', label: 'Name', value: customer => customer.name, sortable: true, filter: { type: 'text' } },
    { key: 'orders', label: 'Orders', value: customer => String(customer.orders), sortable: true, align: 'end' },
    {
        key: 'status',
        label: 'Status',
        value: customer => customer.status,
        cell: this.status(),
        filter: { type: 'select', options: [{ label: 'Active', value: 'active' }, { label: 'Paused', value: 'paused' }] }
    }
]);
```

| Input | Values | Default |
|---|---|---|
| `label` | `string` | required — what the table shows, above it, which screen readers say on entering it |
| `hideLabel` | `boolean` | `false` — whether only screen readers read the label, like when a heading above the table says the same |
| `required` | `boolean` | `false` — whether the label is marked as required with a `*`, like a table of the items of a form that needs at least one |
| `invalid` | `boolean` | `false` — whether the frame shows in the error color, like an invalid input; say what is wrong in a text as well |
| `columns` | `TableColumn<T>[]` | required — `key`, `label`, `value(row)` (the text of a cell), `sortable`, `filter` (`{ type: 'text' }` or `{ type: 'select', options }`), `cell` (a template that gets the row as `let-row`), `align` (`'start'` or `'end'`, for numbers) |
| `rows` | `T[]` | required — the rows of the current page |
| `totalAmount` | `number` | required — how many rows there are on all pages together |
| `pageSize` | `number` | `10` — the user changes it below the table, bind it with `[(pageSize)]` |
| `pageSizes` | `number[]` | `[10, 25, 50, 100]` — the page sizes the user can choose from; the current one is always among them |
| `variant` | `flat`, `outlined`, `card` | `outlined` — no frame, a border around header, rows and footer, or a raised card |
| `striped` | `boolean` | `false` — whether every second row has a slightly different background |
| `rowKey` | `(row: T) => unknown` | the row itself — what identifies a row, like its id, which keeps it selected when it is loaded again |
| `selectable` | `boolean` | `false` — whether the rows have checkboxes that select them |
| `opens` | `boolean` | `false` — whether the rows open, which `(opened)` says with the row |
| `actions` | `TemplateRef` | none — the actions of a row, like a menu; the template gets the row as `let-row` |
| `loading` | `boolean` | `false` — whether the rows load, see below |
| `page` | `number` | `1` — bind it with `[(page)]` |
| `order` | `TableOrder \| undefined` | `undefined` — `{ key, direction: 'ASC' \| 'DESC' }`, bind it with `[(order)]` |
| `filters` | `TableFilters` | `{}` — the text or the option value of each filtered column, by its key; bind it with `[(filters)]` |
| `selected` | `T[]` | `[]` — the selected rows of every page, bind it with `[(selected)]` |

A `ui-table-actions` inside of the table, like with a button that creates a row, shows on the line of its label, at the end. Everything else inside of it, like a description or the inputs that add a row, shows below the label, in the frame of the table, so it is clear that it belongs to the table:

```html
<ui-table label="Customers" [columns]="columns" [rows]="result().items" [totalAmount]="result().totalAmount">
    <ui-table-actions>
        <button ui-button type="button" (click)="create()">Create</button>
    </ui-table-actions>
    <p>Everyone who ordered in the last twelve months.</p>
</ui-table>
```

Angular decides which of the two an `@if` or `@for` goes to by its only element, so a block with more than one element goes below the label as a whole. A component that wraps the table passes both on with `<ng-content select="ui-table-actions" ngProjectAs="ui-table-actions" />` and `<ng-content />`.

A click on a sortable header orders by it ascending, then descending, then not at all; screen readers hear the order through `aria-sort`. A column with a filter has a search button in its header, which opens the filter in a popover: a text filters while the user types and the popover closes on Enter, a select closes it once an option is chosen. A dot on the button marks every filtered column, and a badge in the footer says what it is filtered by, like "Name: al". A click on a badge removes its filter and leaves the focus on the next badge, or on the button of the filter once none is left. A changed order or filter goes back to the first page. The checkbox in the header selects or deselects every row of the page and shows a dash while only some are selected; rows of other pages stay as they are. A row opens by its first value, which is a button for keyboard users, or by a click anywhere on it that isn't on its checkbox or its actions. The footer below the rows shows while the table has rows or is filtered. It holds the pagination once there is more than one page, which rows the page shows, like "Showing 21–30 of 100", a select of the page size once the rows don't all fit on the smallest page, and the badges of the filters. Screen readers call the pagination "Pages of" the label of the table, so several tables on a page can be told apart, and announce which rows the page shows when that changes, like after a filter. A changed page size goes to the page that holds the first row of the current one, so it stays in view.

Without rows, the table shows a compact [empty state](#empty-state) with the `noRowsLabel`, as no results while filters are set. Put a `<ui-empty-state>` of your own inside of the table, like one with a button that creates the first row, and it shows instead; `ui-local-table` and the table of `@service-soft/ngx-entity` pass it on the same way:

```html
<ui-table label="Customers" [columns]="columns" [rows]="rows()" [totalAmount]="total()">
    <ui-empty-state size="compact" title="No customers yet">
        <ui-empty-state-actions><button ui-button type="button" size="sm" (click)="create()">Add a customer</button></ui-empty-state-actions>
    </ui-empty-state>
</ui-table>
```

While `loading` is true, a [spinner](#spinner) covers the rows of the last page, so the table keeps its height while the next one loads, and takes the place of the empty state while the first one does. The rows under it are `inert`, so they can't be used meanwhile, and the table is `aria-busy`, so screen readers wait for it. The header stays usable: ordering or filtering again asks for another page.

The backgrounds of the header and the footer are the tokens `--color-table-header` and `--color-table-footer`, calculated from `--color-surface-container`; the stripes are `--color-primary-faint`, a faint wash of your primary color. All of them follow your theme; their content is `on-surface`, `on-surface-variant` and `primary`, which `ThemeUtilities.validateContrast` checks on each. The corner radius of an outlined table and a card is `--radius-table`.

On a phone every row is a card of its values, each after the label of its column, and the header only shows the columns to order or filter by, so the page never scrolls sideways. Wider than its frame, the table scrolls sideways inside of it, and the frame is a [scroll region](#scroll-region) the keyboard reaches. Change the texts, the page sizes, the variant and the stripes with `provideTableConfig({ pageSize, pageSizes, variant, striped, selectAllLabel, selectRowLabel, filterLabel, allLabel, filtersLabel, removeFilterLabel, paginationLabel, rangeLabel, pageSizeLabel, actionsLabel, noRowsLabel, loadingLabel })`; `rangeLabel` takes the number of the first and the last row of the page and how many there are.

## Scroll region
`uiScrollRegion` is for a box of your own that scrolls sideways, like around a wide table: while its content is wider than it, the box takes the focus, so keyboard users scroll it with the arrow keys, and is a region named by the label you give it, so screen readers say what they are in. While everything fits, it is a plain box without a tab stop. The browser measures it after the first render, the server renders a plain box. `ui-table` uses it already.

```html
<div class="overflow-x-auto" uiScrollRegion="Opening hours">
    <table>…</table>
</div>
```

## Local table
A [table](#table) that gets all of its rows at once and orders, filters and pages them itself, for a list the app already has in full. It takes the inputs and the content of `ui-table` except `totalAmount`, and `rows` are all of them:

```html
<ui-local-table label="Orders" selectable [columns]="columns" [rows]="orders()" [actions]="actions" [(selected)]="selected" />
```

`page`, `pageSize`, `order` and `filters` can be bound two-way to keep them, like in the url, but don't have to be. Its columns are `LocalTableColumn<T>`, a column of the table with two more optional functions for when the text of a cell isn't enough:

| Property | Values | Default |
|---|---|---|
| `compare` | `(a: T, b: T) => number` | compares the texts, numbers in them as numbers — give it for values whose text doesn't order, like a formatted date: `(a, b) => a.date.getTime() - b.date.getTime()` |
| `matches` | `(row: T, filter: unknown) => boolean` | a text filter matches a text that contains it, ignoring case; a select filter matches the text that is the label of the chosen option |

Once the current page has no rows left, like after deleting the last row of the last page, the last page that has rows shows. `LocalTableUtilities.findMatchingRows` and `resolveOrderedRows` filter and order rows the same way outside of the table.

## Tabs
Tabs show one of several sections of content at a time, like the parts of a long form. Every `ui-tab` inside `ui-tabs` is one of them: its `label` shows in the list of tabs, its content while it is selected:

```html
<ui-tabs [(selected)]="tab">
    <ui-tab value="general" label="General">…</ui-tab>
    <ui-tab value="address" label="Address">…</ui-tab>
    <ui-tab value="billing" label="Billing" [disabled]="!isAdmin()">…</ui-tab>
</ui-tabs>
```

| Input | Of | Values | Default |
|---|---|---|---|
| `selected` | `ui-tabs` | `string \| undefined` | `undefined` — the value of the selected tab, bind it with `[(selected)]`. While it is `undefined`, the first tab that isn't disabled shows |
| `variant` | `ui-tabs` | `underlined`, `filled` | `underlined` — the selected tab marked by a bar below it, or the tabs in a strip of the container color with the selected one filled like a filled button |
| `color` | `ui-tabs` | `neutral`, `primary`, `secondary` | `primary` — underlined, the color of the label of the selected tab and the bar below it; filled, the color the selected tab is filled with, or the surface while neutral |
| `value` | `ui-tab` | `string` | required — identifies the tab |
| `label` | `ui-tab` | `string` | required — what the tab shows in the list |
| `disabled` | `ui-tab` | `boolean` | `false` — whether the tab can't be selected |

The arrow keys move through the tabs and select them, Home and End go to the first and the last one, and Tab goes on into the content. A disabled tab gets focus, so keyboard and screen reader users learn it is there, but isn't selected. More tabs than fit scroll sideways. Change the default `variant` and `color` with `provideTabsConfig({ variant, color })`; the corner radius of the strip of filled tabs and of the selected tab in it is the token `--radius-tabs`. The content of every tab is rendered right away and stays, hidden and inert while its tab isn't selected, so a form spread over tabs validates the fields of every tab, also of one the user never opened, and keeps what the user typed. It is built on the tabs of [`@angular/aria`](https://angular.dev/guide/aria/overview), the optional peer of ui that only this entry point and the inputs with a list load.

## Event calendar
A calendar of events, like the trainings and matches of a club or the opening hours of a practice over the holidays. It shows a month as a grid of its weeks, whose days show the titles of their events, or as a list of the days of the month with events. Buttons show the month before and after it and today, and switch between the month and the list. The events are yours, so load the ones of the days it shows:

```html
<ui-event-calendar [events]="events()" [(month)]="month" (rangeChange)="range.set($event)" />
```

```ts
readonly month: WritableSignal<Date> = signal(new Date());
readonly range: WritableSignal<EventCalendarRange | undefined> = signal(undefined);
readonly events: ResourceRef<EventCalendarEvent[]> = resource({ params: () => this.range(), loader: ({ params }) => this.api.findEvents(params) });
```

| Input | Values | Default |
|---|---|---|
| `events` | `EventCalendarEvent[]` | `[]` — the events, of at least the days it shows |
| `month` | `Date` | the current month — any moment of the month it shows, bind it with `[(month)]` to keep it, like in the url |
| `view` | `'month'` \| `'agenda'` | `'month'` — the grid of the month or the list of its days with events, bind it with `[(view)]` |
| `color` | `'neutral'` \| `'primary'` \| `'secondary'` \| `'error'` \| `'success'` \| `'warning'` | `'primary'` — the color of the events without a category |
| `headerColor` | `'neutral'` \| `'primary'` \| `'secondary'` | `'primary'` — the header with the month and its buttons, like the calendar of [Input date](#input-date), whose look it shares: a [colored surface](#colored-surfaces) strip, and the days as circles, filled while selected and with a ring for today |

`rangeChange` emits the days it shows as an `EventCalendarRange`, `{ start, end }` from midnight of the first day to midnight after the last, once it starts and whenever they change: the six weeks around the month in the grid, the month in the list. The events it needs are the ones that start before `end` and end after `start`.

| Event | Values | |
|---|---|---|
| `title` | `string` | — what it is called |
| `start`, `end` | `Date` | — when it starts and ends; without an `end` it ends where it starts. An event that ends at midnight isn't on the day that starts then |
| `allDay` | `boolean` | `false` — whether it lasts all of its days; `start` and `end` are then any moment of its first and last day |
| `location`, `description` | `string` | — where it takes place and more about it, shown with its line breaks |
| `category` | `{ label: string, color }` | — what kind of event it is: its color, and its label next to the event, so the color isn't the only thing that tells categories apart |
| `url` | `string` | — the address of its page, like its registration |
| `id` | `string` | its title and start — what identifies it, also in the calendar file |

The arrow keys move through the days of the month, Home and End to the start and end of a week, and the events of the day they are on show below the month, with when they take place in `<time>` elements, their category, location, description, a link to their page (`linkLabel`) and one that downloads them as an iCalendar file (`addToCalendarLabel`), which calendar apps like the one of a phone import. A day shows `maxEventsPerDay` events, then how many more it has (`moreEventsLabel`), and screen readers read its date, how many events it has and their titles (`eventCountLabel`). Below a width of 42rem of the calendar itself, not of the screen, the days show a dot for each event instead of their titles; the list puts the date of a day above its events where it is narrower than 36rem.

Dates, times and the names of months and days are in the language of the app (`LOCALE_ID`), in the time zone of the browser. Change the default `view`, `color`, `headerColor`, `firstDayOfWeek` (`1`, Monday), `maxEventsPerDay` (`2`) and every text with `provideEventCalendarConfig`. The events of a day of the month are as wide as the day, and their titles wrap. The corner radius is the token `--radius-card`. `EventCalendarUtilities` finds the events of a day (`findEventsOfDay`), resolves the days of a month (`resolveRange`) and writes an event as an iCalendar file (`resolveCalendarFile`, `resolveCalendarFileUrl`). It is built on the grid of [`@angular/aria`](https://angular.dev/guide/aria/overview).

## Date period
A period of dates in the language of your app (`LOCALE_ID`), like "02/2022 – 03/2024", "02/2022 – today" for one that is still going on, or a single date. The pipe writes it as text, the component as `<time>` elements, which give search engines the dates themselves:

```html
<ui-date-period [start]="project.start" [end]="project.end ?? 'open'" />
{{ project.start | uiDatePeriod: project.end : { month: 'short', year: 'numeric' } }}
```

| Input | Values | Default |
|---|---|---|
| `start` | `Date` \| `string` \| `number` | — required, when it started, or the date for a single one |
| `end` | `Date` \| `string` \| `number` \| `'open'` \| `undefined` | — when it ended, `'open'` for a period that is still going on, nothing for a single date |
| `format` | `Intl.DateTimeFormatOptions` \| `(date, locale) => string` | `{ month: '2-digit', year: 'numeric' }` — how the dates are written, like `{ month: 'short', year: 'numeric' }` for "Feb 2022", or a function of your own |

The pipe takes the same as its arguments: `start | uiDatePeriod: end : format`. A string without a time, like `'2022-02'` or `'2022-02-14'`, is a day of the local calendar, not midnight in UTC, which would be the day before west of it. A period whose start and end look the same, like two days of one month written as months, shows as one date. Change the `format`, the `openEndLabel` (`'today'`) and the `separator` (`' – '`) for the whole app with `provideDatePeriodConfig`. `DatePeriodUtilities.resolveParts` gives you the texts and `datetime` values for markup of your own.

## Byline
The small row of facts about an article, on its card or its page: who wrote it, when, how long it takes to read and its category, separated by dots. Only what you set shows:

```html
<ui-byline author="Ada Lovelace" [date]="post.published" [readingTime]="5" category="Club news" />
```

| Input | Values | Default |
|---|---|---|
| `author` | `string` | — the name of the person who wrote it |
| `showAvatar` | `boolean` | `false` — an [avatar](#avatar) in front of the name, with the initials without a picture |
| `avatar` | `string` | — the url of a picture of the author |
| `date` | `Date` \| `string` \| `number` | — when it was published, as a `<time>` element written like a [date period](#date-period) |
| `dateFormat` | `Intl.DateTimeFormatOptions` \| `(date, locale) => string` | `{ dateStyle: 'medium' }` |
| `readingTime` | `number` | — the minutes it takes to read, like "5 min read" |
| `category` | `string` | — the category it belongs to |
| `items` | `BylineItem[]` | `[]` — entries of your own after the others, `{ text, icon? }`, like the number of comments |

It is one paragraph, which screen readers read as one line; the dots are decorative. Change `showAvatar`, `dateFormat` and `readingTimeLabel` (`minutes => '5 min read'`) with `provideBylineConfig`.

## Article card
An article on a [card](#card), like a post of a club: its cover image, a category, the title as your own link, and your content below it, like an excerpt and a [byline](#byline):

```html
<div class="grid gap-4 md:grid-cols-3">
    @for (post of posts(); track post.id) {
        <ui-article-card [image]="{ src: post.image, alt: '' }" [category]="post.category">
            <a uiArticleCardLink [routerLink]="['/news', post.slug]">{{ post.title }}</a>
            <p>{{ post.excerpt }}</p>
            <ui-byline [author]="post.author" [date]="post.published" />
        </ui-article-card>
    }
</div>
```

| Input | Values | Default |
|---|---|---|
| `image` | `{ src, alt, priority? }` | — the cover image, drawn with `NgOptimizedImage`, so it can't be a data url; `priority` for a card at the top of the page |
| `category` | `string` | — a badge above the title |
| `headingLevel` | `1` to `6` | `2` — the level of the heading that holds the link, which fits the page |
| `layout` | `'vertical'` \| `'horizontal'` | `'vertical'` — the image above the text, or next to it once the card is at least 36rem wide |
| `variant`, `color` | like the [card](#card) | the ones of `provideCardConfig` |

The link stays yours, so `routerLink`, middle clicks and crawlers work as on any link, and stretches over the whole card: a click, a middle click or the context menu anywhere on the card follow it, and its focus ring goes around the card. Your content lies above it, so its text can be selected; a plain click on it that selects nothing follows the link as well, and links or buttons inside it keep doing their own thing. The last of several children of your content, like the byline, sits at the bottom of the card, so the bylines of cards next to each other line up. The grid is yours; every card is as high as the highest of its row. Change the default `layout` and `headingLevel` with `provideArticleCardConfig`.

## Showcase card
Something you show off on a [card](#card): a reference, a project, an event or a product, with its image, title, period, summary, tags and logos, a longer text the user opens, and your links at the bottom:

```html
<ui-showcase-card title="A website for a sports club" start="2022-02" end="open" summary="…" [tags]="['Angular', 'SEO']" [logos]="logos">
    <ui-showcase-card-details><p>We moved more than 400 pages…</p></ui-showcase-card-details>
    <a ui-link routerLink="/references/club">Read more</a>
</ui-showcase-card>
```

| Input | Values | Default |
|---|---|---|
| `title` | `string` | — required, the heading of the card |
| `image` | `{ src, alt, priority? }` | — the image at the top, drawn with `NgOptimizedImage` |
| `start`, `end`, `periodFormat` | like the [date period](#date-period) | — the period below the title, like "02/2022 – today" |
| `summary` | `string` | — a short text below the title |
| `tags` | `string[]` | `[]` — keywords, as a list of neutral [badges](#badge) |
| `logos` | `{ src, alt, width, height }[]` | `[]` — logos that belong to it, 2rem high |
| `headingLevel` | `1` to `6` | `2` |
| `variant`, `color` | like the [card](#card) | the ones of `provideCardConfig` |

`<ui-showcase-card-details>` is an [expandable text](#expandable-text): its first `lines` show below the summary, as a teaser of the rest, with a button that shows all of it in place. Everything else you put inside, like links and buttons, sits at the bottom, so the ones of cards next to each other line up. Change `headingLevel` and `tagsLabel` (what screen readers call the tags, `'Tags'`) with `provideShowcaseCardConfig`, the lines and the texts of the button with `provideExpandableTextConfig`.

## Rich text
Html from elsewhere, like the content of a post from a cms, in the look of your app: headings, paragraphs, lists, links, quotes, code, tables, images and figures follow the type scale and the tokens, also in dark mode and on [colored surfaces](#colored-surfaces):

```html
<ui-rich-text class="max-w-prose" [html]="post.content" />
```

Its headings start at the level that fits the page, like `<h2>` below the `<h1>` of the article. Code wraps instead of scrolling, the header cells of tables are `surface-container`, and images never get wider than the text. The corners of images and code blocks are the token `--radius-rich-text`.

By default the sanitizer of Angular makes the html safe to show. It is strict: it removes ids, inline styles and every element it doesn't know, like iframes. For a less strict one, install [DOMPurify](https://github.com/cure53/DOMPurify) and provide it; `@service-soft/ui` doesn't depend on it, and only the pages that show rich texts load it:

```ts
import DOMPurify from 'dompurify';
import { provideRichTextDomPurify } from '@service-soft/ui/rich-text';

provideRichTextDomPurify(DOMPurify, { config: { ADD_TAGS: ['iframe'] } })
```

DOMPurify needs a dom, which a page rendered on the server doesn't have. Without one, the sanitizer of Angular sanitizes there, and DOMPurify once the page runs in the browser, which may show what Angular removed a moment later. For the same html on both, give it a dom on the server, like the one of [jsdom](https://github.com/jsdom/jsdom): `provideRichTextDomPurify(DOMPurify, { serverWindow: new JSDOM('').window })` in the config of the server only. Any other sanitizer is a function that gets the html and returns it safe: `provideRichTextConfig({ sanitize: html => mySanitizer(html) })`. The rich text trusts what it returns.

## Table of contents
Links to the sections of a page, nested by their levels, like next to a legal text. While the page scrolls, the link of the section that is being read is highlighted and has `aria-current`:

```html
<aside class="md:sticky md:top-4"><ui-table-of-contents [container]="text" /></aside>
<article #text>…</article>
```

| Input | Values | Default |
|---|---|---|
| `container` | `HTMLElement` | — the element whose headings become the links |
| `items` | `TableOfContentsItem[]` | — the sections as data, `{ name, fragment, children? }`, named like the anchors of [ngx-navigation](https://www.npmjs.com/package/@service-soft/ngx-navigation); they take the place of the headings of the container |
| `levels` | `(1 \| 2 \| 3 \| 4 \| 5 \| 6)[]` | `[2, 3]` — the levels of the headings that become links |
| `label` | `string` | `'On this page'` — the title above the links, which names the navigation |
| `spy` | `boolean` | `true` — whether the section that is being read is highlighted |

A heading without an id gets one from its text, like `cookies-and-tracking` for "Cookies and tracking", the same on every render, so links to it stay valid; `TableOfContentsUtilities.resolveSlug` writes them. The links go to the path of the page with the fragment, not to `#cookies` alone, which the `<base href>` of an Angular app would turn into a link to the start page. The container is read in the browser after it rendered, and again when its content changes; for links that are part of the html the server renders, give the `items`. The section that is being read is the one whose heading is in the top third of the screen, observed with an `IntersectionObserver`. Give the headings a `scroll-mt-*` when a sticky header would cover them. Change `label`, `levels` and `spy` with `provideTableOfContentsConfig`. `ngx-nav-anchors` of [ngx-navigation](https://www.npmjs.com/package/@service-soft/ngx-navigation) links to the sections given in the data of a route instead, as one row below the navbar.

## Footnotes
Footnotes or sources of a text: `<ui-footnote>` stands where its reference is, and shows its number there as a superscript link; its content shows in the numbered list it belongs to, which links back:

```html
<p>The club was founded in 1920<ui-footnote [list]="sources">Chronicle of the club, page 4.</ui-footnote>.</p>
<h2>Sources</h2>
<ui-footnotes #sources idPrefix="sources" label="Sources" />
```

The footnotes are numbered in the order of their references in the page, and again when one goes away. A page can have several lists, each with its own numbers; give each its own `label`, which names it for screen readers (`'Footnotes'` by default), and an `idPrefix` for links that stay the same, like `#sources-note-1`. Screen readers read a reference as "Footnote 1" and the text of the footnote as its description, so they hear the source without leaving the text; the links have the roles `doc-noteref` and `doc-backlink`. The list renders on the server as well; put it after the text. Change `label`, `referenceLabel` and `backLabel` with `provideFootnotesConfig`.

## Search toolbar
The bar above a list that the user searches and filters: a search, your own controls next to it, and how many results there are below it, which screen readers announce whenever it changes. On a narrow screen the controls wrap below the search:

```html
<ui-search-toolbar [resultCount]="results().length" [(search)]="query">
    <button ui-filter-button type="button" variant="outlined" [count]="activeFilters()" (click)="filters.open()">Filters</button>
</ui-search-toolbar>
```

| Input | Values | Default |
|---|---|---|
| `search` | `string` | `''` — the text of the search, bind it with `[(search)]`; it changes with every key |
| `searchLabel` | `string` | `'Search'` — the name of the search, which shows in it while it is empty |
| `resultCount` | `number` | — how many results there are; without it, nothing shows below the search |

The search is an [input string](#input-string) of `type="search"`, with its magnifier and the button that empties it. `button[ui-filter-button]` is a [button](#button) with a funnel in front of its text and the number of active filters, `count`, as a badge after it, which screen readers read as "Filters (2 active)". It is your own button, so it opens whatever holds your filters, like a [drawer](#drawer) or a [popover](#popover). Change `searchLabel`, `resultCountLabel` (`count => '12 results'`) and `activeFiltersLabel` (`count => '2 active'`) with `provideSearchToolbarConfig`.

## Filter tiles
A row of tiles that filter a list, like the categories of the treatments of a dental practice, with a tile that shows everything first. Each tile has a label, and optionally an icon and how many items it has:

```html
<ui-filter-tiles label="Categories" [options]="categories" [allCount]="treatments.length" [(value)]="chosen" />
```

| Input | Values | Default |
|---|---|---|
| `label` | `string` | — required, what screen readers call the group |
| `options` | `FilterTileOption<T>[]` | — required, `{ value, label, icon?, count? }` |
| `value` | `T[]` | `[]` — the chosen values, empty while everything shows, bind it with `[(value)]` |
| `multiple` | `boolean` | `false` — whether several tiles can be chosen at once |
| `allCount` | `number` | — how many items there are in total |
| `allLabel` | `string` | `'All'` |
| `color` | `'primary'` \| `'secondary'` | `'primary'` — the text of the tiles and the fill of the chosen ones |

The tiles are toggle buttons, so screen readers say which ones are chosen, and a chosen one is filled, not only in another color. Without `multiple`, choosing a tile replaces the one that was chosen, and choosing it again shows everything. The value is always a list, so the same filter works with both: `items.filter(item => chosen().length === 0 || chosen().includes(item.category))`. The tile of everything has an icon while the others have them, `allIcon` of the config. The corner radius is the token `--radius-filter-tile`. Change `color`, `allLabel`, `allIcon` and `countLabel` (`count => '12 items'`) with `provideFilterTilesConfig`.

## Category overview
Items grouped under the headings of their categories, each on a small card with a check in front of its title and text, like the treatments of a dental practice. Filter its groups with [filter tiles](#filter-tiles):

```html
<ui-category-overview [groups]="[{ name: 'Prophylaxis', id: 'prophylaxis', items: [{ title: 'Teeth cleaning', text: 'Removes plaque.' }] }]" />
```

| Input | Values | Default |
|---|---|---|
| `groups` | `CategoryOverviewGroup[]` | — required, `{ name, id?, items: { title, text? }[] }`; the `id` is the one of its section, where a link to it leads |
| `headingLevel` | `1` to `5` | `2` — the level of the headings of the categories; the titles of the items are one level below |
| `icon` | `IconDefinition` | a check in a circle |

The cards of a category stand next to each other where the overview, not the screen, is wide enough. Change `headingLevel` and `icon` with `provideCategoryOverviewConfig`.

## Gallery
Pictures as a grid of thumbnails, each of which opens the picture large in a [dialog](#dialog) over the whole screen, with its caption, where it is among the others, like "3 / 12", and buttons to the one before and after:

```html
<ui-gallery [images]="[{ src: '/photos/party-1.jpg', alt: 'The band on stage', caption: 'Photo: Ada Lovelace' }]" />
```

Every picture needs an `alt`, which names the button of its thumbnail and is read when it opens; development builds report a picture without one to the `ErrorHandler`. The pictures are drawn with `NgOptimizedImage`, so they can't be data urls, and only the one that is open loads large. The arrow keys show the picture before and after as well, the other way round in a right-to-left language, and after the last comes the first. The dialog is a native one: the browser keeps the focus inside, closes it on escape and returns the focus to the thumbnail. Screen readers hear "Picture 3 of 12" and the alt of every picture that shows. The grid has two to four columns by its own width, the corner radius of the thumbnails is the token `--radius-gallery`. Change the texts with `provideGalleryConfig({ label, previousLabel, nextLabel, closeLabel, positionLabel })`.

## Badge
A short label nothing happens on, like the category of an article, a tag or "Recommended". An icon of your own inside it is sized and colored with its text:

```html
<ui-badge color="primary">Club news</ui-badge>
```

| Input | Values | Default |
|---|---|---|
| `color` | `'neutral'` \| `'primary'` \| `'secondary'` \| `'error'` \| `'success'` | `'primary'` |
| `variant` | `'filled'` \| `'tinted'` | `'tinted'` — filled with its color, for something that has to be seen, or its color as text on a tint of it, for labels; a tinted neutral badge has a border, like a chip |
| `size` | `'sm'` \| `'md'` | `'sm'` — small next to a title, medium for a list of tags |

It only uses pairs of colors whose contrast is checked, and on a [colored surface](#colored-surfaces) it takes the colors of the surface, like a button; the status colors keep theirs. A long label wraps instead of being cut off. Several badges of a kind, like tags, are a list, which screen readers count, named by an `aria-label`:

```html
<ul class="flex flex-wrap gap-2" aria-label="Tags">
    @for (tag of tags; track tag) {
        <li class="flex"><ui-badge color="neutral" size="md">{{ tag }}</ui-badge></li>
    }
</ul>
```

For something the user removes or chooses, use the chips of the [chips input](#input-chips) or a [button](#button). The corner radius is the token `--radius-badge`. Change the defaults with `provideBadgeConfig({ color, variant, size })`.

## Expandable text
A longer text that shows its first lines, with a "Read more" button that shows all of it in place, like the description of a project. The last line fades out while it is closed:

```html
<ui-expandable-text [lines]="3"><p>…</p><p>…</p></ui-expandable-text>
```

| Input | Values | Default |
|---|---|---|
| `lines` | `1` to `6` | `3` — how many lines show while it is closed |
| `expanded` | `boolean` | `false` — whether all of it shows, bind it with `[(expanded)]` |
| `moreLabel`, `lessLabel` | `string` | `'Read more'`, `'Show less'` — the text of the button |

The whole text is always in the page, it is only cut off visually with `line-clamp`, so screen readers and search engines read all of it, and the search of the browser finds words in the hidden part, though it can't show them until the text is open. `hidden="until-found"`, which would open it, hides the whole element and isn't in every browser this library supports, so it isn't used. The button has `aria-expanded` and `aria-controls`, and only shows when the text has more lines, which the browser measures after rendering and again when the width changes. A page rendered on the server can't measure, so it shows the button, as the text of an expandable text is usually longer; the browser takes it away if the text fits. The fade is a mask, so it works on every background. Opening it doesn't animate. Change the defaults with `provideExpandableTextConfig({ lines, moreLabel, lessLabel })`.

# Components given as a map
A component that renders data with a component per kind of item, like a navbar with a component for each type of element, takes them as a map instead of importing every possible one itself: `<x [components]="{ link: LinkComponent }">`. Only the components a page passes end up in its bundle, which matters on pages that depend on their loading time, like for SEO.

`ComponentMapUtilities.validate(components, usedKeys, owner)` of `@service-soft/ui/component-map` checks such a map: it throws for a key the data uses that has no component, and for a component whose key the data doesn't use, as that one only makes the bundle bigger. Call it in development builds only, so production builds leave it out:

```ts
declare const ngDevMode: unknown;

if (typeof ngDevMode === 'undefined' || ngDevMode) {
    ComponentMapUtilities.validate(this.components(), this.items().map(item => item.type), 'The navbar');
}
```

# License
MIT.
