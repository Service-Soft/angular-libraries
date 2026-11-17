# Code style

Conventions for every library in this repository. Read this before your first change.

Where this and the surrounding code disagree, this wins — the code predates some of it. Where this
and the linter disagree, the linter wins and this file is wrong; open an issue.

# Table of Contents

- [Code style](#code-style)
- [Table of Contents](#table-of-contents)
- [The linter decides most of it](#the-linter-decides-most-of-it)
- [Naming](#naming)
  - [A function's verb says what it costs to call it.](#a-functions-verb-says-what-it-costs-to-call-it)
  - [Names should be precise](#names-should-be-precise)
- [Files](#files)
- [Shape of the code](#shape-of-the-code)
- [Angular](#angular)
- [Styling](#styling)
- [Accessibility](#accessibility)
- [Types](#types)
- [Comments and JSDoc](#comments-and-jsdoc)
- [Tests](#tests)

# The linter decides most of it

Casing, import order, line length, member ordering and required JSDoc are all rules, not prose.
Run `npm run lint` and `npm test` before you open a pull request.

**Warnings are errors.** Linting runs with `eslint --max-warnings=0`, so there is no such thing as a
warning you can leave behind.

If a rule fires, try to fix the code — enumerate the missing switch cases, write the missing JSDoc,
narrow the type. A rule that genuinely needs to be disabled should always be the last resort.

Nothing the linter already checks is repeated below.

# Naming

## A function's verb says what it costs to call it.

| Verb | Use it when |
|---|---|
| `getX` | The value is already there and you are handing it over |
| `findX` / `findXs` | You are looking for it, and it may not be there |
| `resolveX` | Work happens before you can answer — a lookup, a computation, a round trip |
| `validateX` | You are checking something, and the caller learns nothing except that it was wrong |

`getX` and `resolveX` divide on effort, not on where the value lives. A getter that walks an
inheritance chain or does a http request is a `resolveX`, however cheap it looks from the outside.

**`validateX` is the only verb for checking.** Not `assertX`, not `requireX`, not `ensureX`, not
`checkX` — they all describe the same function, one that returns nothing and throws when it has
something to say, and several names for it means nobody can search for the checks.

## Names should be precise
Always prefer `calculateInvoiceTotalNet` over `calculateTotal`. The only restriction to this is when the function is already grouped by something:

`InvoiceUtilities.calculateInvoiceTotalNet` is unnecessary verbose, here it should be `InvoiceUtilities.calculateTotalNet`.

The same goes for inputs, outputs and properties: the component or class they belong to is their context, so they
don't repeat it. The color of the calendar of `ui-input-date` is its input `color`, not `calendarColor` — a date input
has no other color. Only a name that is shared by several things says which one it means, like the key
`calendarColor` of `InputConfig`, which holds the defaults of every input.

# Files

**One exported concept per file**, named after it in kebab-case, with a suffix saying what kind of
thing it is:

| Suffix | Holds |
|---|---|
| `.component.ts` | A component |
| `.component.html` | The template of the component of the same name |
| `.directive.ts` | A directive |
| `.pipe.ts` | A pipe |
| `.service.ts` | An injectable service |
| `.guard.ts` | A route guard |
| `.interceptor.ts` | A http interceptor |
| `.model.ts` | A class or type describing data — an entity, a config shape, an options object |
| `.provider.ts` | An injection token together with its default and its `provideX` function |
| `.utilities.ts` | A class of related static methods |
| `.function.ts` | A single exported function that belongs to no class |
| `.decorator.ts` | A decorator |
| `.error.ts` | An error class |
| `.enum.ts` | An enum |
| `.type.ts` | A standalone type alias |
| `.spec.ts` | Tests for the file of the same name |
| `.stories.ts` | The Storybook stories of the component of the same name |

**Templates live in their own file**, referenced by a path relative to the component. No inline
templates.

**A test sits next to what it tests.** `my.component.ts` and `my.component.spec.ts` share a directory.

# Shape of the code

**Unused code must never end up in a consumers bundle.** Libraries here are used on websites that
depend on SEO. Every component lives in its own secondary entry point (`my-lib/button`), providers
are tree-shakeable, and nothing runs at import time.

**Separate what the user configures from what is used internally.** Every input a user can make has
two models: the public one only requires the values that have no sensible default, the internal one
requires everything and is the only one used inside the library. That way components stay highly
configurable without requiring the whole configuration, and newly added options are not (as easily)
forgotten somewhere.

**Every input with a default can be configured app-wide.** A component reads the defaults of its
inputs from an `X_CONFIG` injection token, and `provideXConfig(Partial<XConfig>)` changes them. It
merges with the config of the parent injector, so it works in the application config as well as in
a component or route for only that part of the app. See [the button](./projects/ui/button/button-config.provider.ts).

**Group related functions into a utility class with static methods**, not a directory of loose
exports. Put the entry points first and the steps they are built from below as `private static`. A
standalone `.function.ts` is for something that genuinely belongs to no group — and when a second one
appears next to it, they become a class.

**Extend an existing helper rather than adding a sibling.** Search the existing utilities for the
concept before you design anything.

**Fix the cause.** A guard that hides a wrong value, a retry around something that should not fail, a
second way to say what is already declared — each leaves the defect in place and adds a thing to
maintain. If the real fix is out of scope, say so and leave the problem visible.

**Touch only what your change needs.** Do not reformat, rename or improve adjacent code. Remove
imports and variables *your* change orphaned; leave pre-existing dead code alone and mention it.

# Angular

**Rely on the defaults.** Components are standalone and `OnPush` without saying so: never set
`standalone: true` or `changeDetection`.

**State is signals.** `input()`, `output()` and `model()` instead of their decorators, `model()` rather
than an `input()` paired with an `output()`, `computed()` for anything derived and `linkedSignal()` for
derived state that must stay writable. Change a signal with `set` or `update`, and keep the
transformations pure.

**A component is an element, like `<ui-dialog>`**, and renders the native element it is built on
inside its template. Its host gets `contents` when it would only add an empty box to the layout. Two
exceptions keep an attribute selector on the native element:
- **Buttons and links**, `button[ui-button]` and `a[ui-button]`: their own attributes are the api, like
  `type`, `disabled`, `aria-label`, `href` and `routerLink`. A link inside a wrapper is no link for
  middle clicks, new tabs and crawlers.
- **Directives that only add behaviour to an element of the consumer**, like `button[uiMenuTrigger]`.

A wrapped native element gets nothing from attributes on the component's element, so everything a
consumer may set on it, like `disabled` or an accessible name, is an input of the component; the name
is `label`, because `aria-label` would stay on the component's element.

**Host bindings go in the `host` object** of `@Component` or `@Directive`, never in `@HostBinding` or
`@HostListener`.

**Inject with `inject()`**, not the constructor. A singleton service uses `@Service` (or
`@Injectable({ providedIn: 'root' })`), which keeps it out of the bundle until something injects it.

**Templates stay simple.** Logic belongs in a `computed()`, not the template. Use the native control
flow (`@if`, `@for`, `@switch`), `class` and `style` bindings instead of `ngClass` and `ngStyle`, the
`async` pipe for observables, and import only the directives and pipes a template uses — never
`CommonModule`. Templates can't reach globals like `Date` or `window`; the component exposes what
they need.

**Forms stay as close to native html as possible.** A control is a component whose value is a
`model()`, bound with `[(value)]`, around a native element. The browser validates that element with its
native attributes, like `required` or `pattern`, so validity, `checkValidity()`, `:user-invalid` and
blocking an invalid submit all work like in plain html. Rules the browser can't check use
`setCustomValidity()`. No library depends on `@angular/forms`.

**A control is self-contained.** It renders its own label, hint and error, and finds nothing outside of
itself: no parent form, no neighbouring directive. What a consumer controls is an input, like
`required`. The only thing it reacts to is the native `invalid` event of its own element,
where it shows its error instead of the popup of the browser.

**A control passes everything on to its native element.** Attributes on the component's own element
don't reach the `<input>` inside, so what a consumer may set, like `type` or `placeholder`, is an input
of the component, named like the native attribute. The native element gets the label through `for`,
`aria-invalid` while the error shows and `aria-describedby` pointing to the hint or error. The id input
is `inputId`, because an `id` would end up on the component's element as well.

**One control per kind of value, each in its own entry point**, named after the value:
`@service-soft/ui/input-string`, `@service-soft/ui/input-number`, later `@service-soft/ui/input-date`. Only the pages that use a control
load it.

**Static images use `NgOptimizedImage`**, except inline base64 images, which it does not support.

# Styling

Libraries are styled with Tailwind, and the **consumer's** Tailwind generates the css: every library
ships a `tailwind.css` containing `@source "./fesm2022";`, exported under the `style` condition of the
package. There is no `@angular/material` and no prebuilt css.

**Classes are complete, literal strings in templates, in `host.class` or in a `*_CLASSES` constant.**
Tailwind finds classes by reading text, and the linter only checks those places, so a class built
from pieces (`'bg-' + color`) or kept anywhere else is invisible to both. Classes that depend on an
input live in a module level constant like `VARIANT_CLASSES`, mapping every value to its complete
class list, and the component joins the lists it needs.

**Only use the shared tokens from [ui](./projects/ui/theme.css)** (`@service-soft/ui`). The linter rejects
Tailwind's built-in colors, fonts, text sizes and shadows, and every token ui does not define, so `bg-primary`
passes while `bg-blue-500` and `bg-primaryColor` do not. Text uses a role of the type scale
(`text-title`, `text-body`, `text-label`, …), which sets size, line height and weight together, and
headings add `font-heading`. Shadows are one of the elevation levels `shadow-1` to `shadow-5`, and
an elevated element that can be hovered rises one level. Font weights, spacing and sizes stay Tailwind's. If a token is missing, add it to ui — no other project defines tokens with
`@theme`, which a test checks. Token names are public api: renaming one is a breaking change of every
library.

**What a consumer may want to change about one component is a component token**, named after the
component in Tailwind's namespace, like `--radius-button` for `rounded-button`. It lives in ui's
theme like every other token.

**A color too light to be text on a surface gets a `-text` token** for that, like `secondary-text`
next to `secondary`. Use it for text and focus rings on surfaces; the color itself stays for fills
and decorative borders.

**Dark mode lives in the tokens, never in components.** Every color token in ui is
`light-dark(<light>, <dark>)`, and components use the tokens without a `dark:` variant. A new color
token needs both values, and both pass the contrast requirements, which are checked in each mode.
`light-dark()` follows `color-scheme`, which ui sets to the operating system on `:root` and to a
fixed mode with the classes `.light` and `.dark`.

**A new token comes with its contrast requirement.** When it is shown on top of another token, add the
pair to the requirements in [testing/theme](./projects/testing/theme/theme.utilities.ts), which is
what checks our defaults.

**No arbitrary colors or css variables in classes**, like `bg-[#f00]` or `text-(--my-color)`. They
bypass the tokens. Arbitrary sizes like `w-[37px]` are fine.

**Never lower the opacity of content**, like `text-on-surface/80`. The contrast of a blended color
can't be checked; use `on-surface-variant` or add a token instead. Disabled elements are the
exception, WCAG does not require contrast for them.

**States only switch between checked pairs.** Hover, focus and active states must not create a color
combination the contrast requirements don't cover. A filled element hovers with `X-hover` and is
pressed with `X-pressed`, colored text on a surface hovers with `X-tint` behind it and is pressed with
`X-tint-pressed`. Both are calculated from `X` with `color-mix()` in ui's
theme, so they follow a consumer's overrides, and have their own contrast requirements. Never use an
opacity modifier for a state.

**Consumers customise through tokens and inputs**, not by adding classes. Which of two conflicting
classes wins depends on their order in the stylesheet, not in the `class` attribute, so a consumer's
class can't reliably override one of the library's.

# Accessibility

**Every component passes all AXE checks and meets WCAG AA**, including focus management, color
contrast and ARIA attributes.

**Behaviour comes from the browser first.** Native elements and apis bring keyboard handling, focus
and ARIA state that work everywhere and cost no code: `<details>` for sections that open, `<dialog>`
with `showModal()` for modals, popovers with CSS anchor positioning for menus. Where the browser has
nothing, `@angular/aria` and `@angular/cdk` may be used; never write keyboard navigation, focus
trapping or ARIA state by hand.

**Contrast is the consumer's theme, but our defaults must pass.** Every color token comes with an
`on-` token for content on top of it (`primary` / `on-primary`), and `npm test` checks that the
defaults in ui meet WCAG AA with `ThemeUtilities.validateContrast`.

**Every component has stories for all its variants and states.** `npm test` builds Storybook and runs
AXE on every story in Chromium, in light and in dark mode, so a violation is a failing test. The Theme
button in the Storybook toolbar switches the mode. The Accessibility panel of
`npm run storybook` shows the same checks while you work. Overlays render outside the story's root,
so the whole page is checked, without the rules about page structure in
[page-level-rules.ts](./projects/ui/.storybook/page-level-rules.ts).

**Focus is always visible.** Every interactive element gets a `focus-visible:` outline in a color
whose contrast to the surfaces is checked, offset from the element so it never depends on the
element's own color.

**Shapes survive forced colors mode.** Contrast themes like the ones in Windows remove backgrounds and
replace every color, but they draw borders. An element whose shape is only a background, like a filled
button, gets a `border-transparent` border, so it keeps its outline there.

**Text is never clipped.** Elements with text use `min-h-*`, not a fixed height, and no
`whitespace-nowrap`: larger text, increased text spacing and a 320px wide screen (WCAG 1.4.4, 1.4.10,
1.4.12) then make the element grow instead of overflowing it. Sizes are in `rem`, which is what
Tailwind uses anyway.

**Targets are at least 24×24px** (WCAG 2.5.8), including the smallest size of a component.

**Icons are svgs drawn in the text color.** Sized in `em`, so they grow with the text, and colored by
the text through `currentColor`, whose contrast is already checked. Where the consumer decides the
icon, like in a button, the component takes it as projected content and styles the `svg` inside. Where
the component decides it, like the type of a change set, it imports single icons from
`@fortawesome/free-solid-svg-icons` and draws them with `<ui-icon>`. Single imports leave every
other icon out of the bundle, and only the pages that show the component load its icons. No library
uses Font Awesome's own components or its svg core, which would add their runtime to every page.
Icons next to text that says the same are decorative; an icon that stands for text gets a `label`.
A control that can show only an icon validates in development builds that it has an `aria-label` or
`aria-labelledby`, guarded by `ngDevMode` so production builds leave the check out.

**Color is never the only cue.** An error, a selection or a required field also shows it in text, an
icon or a shape, for everyone who can't tell the colors apart.

**Every feature works in Chromium, Firefox and Safari.** Not supporting Firefox is never an option, not even as
a progressive enhancement that only Chromium gets. A CSS or browser api that one of them lacks, like `interpolate-size`,
is not used; find the technique that works in all of them.

**Movement respects `prefers-reduced-motion`.** Animations that move, scale or slide something only run
with `motion-safe:`. Fading a color, like a hover, is not movement and needs no variant.

# Types

**Be strict.** No implicit `any`, no widening a type to make a call compile. If a type is genuinely
unknown, it is `unknown`.

**`as SomeType` means the model is wrong.** Before writing a cast, find the shape that does not need
one — usually a type that was never split.

**`as never` is never the answer, least of all in a test.** A cast in a test means the test data does
not match what the code takes, which is the thing worth knowing.

**Prefer a named type to an inline one**, and declare the type of every non-trivial local.

# Comments and JSDoc

These are two different audiences and the split is strict.

**JSDoc is published.** It is shown to every consumer of the library, and the people reading it have
never seen this repository. It states what the thing does and what a caller gets. It never names a
past bug or an implementation detail.

**Inline `//` comments are not published, and are where the reasoning goes.** Why this approach and
not the obvious one, what was tried and failed, which invariant a line is holding up. Write them for
whoever has to change this in a year.

Comment density matches the surrounding file. A comment restating the code is noise; a comment
explaining a decision is the most valuable line on the screen.

# Tests

**Test the whole thing working, not each piece alone.** Bugs live between the parts. Render the real
component with its real dependencies; focused unit tests are right for genuinely pure logic — add them
as well, not instead.

**Use the least mocking you can.** A mock permanently diverges the test from what ships. Mock only a
boundary that cannot run in the test at all, such as a remote api.

**Never record a bug as an accepted difference.** Tests exist to show bugs; a suite that is never red
is not a suite that is passing. Leave it red and report it.

**Tests that span packages live in [tests](./tests)** and run with `npm run test:workspace`, as part of
`npm test`. They build
the libraries and the showcase for real, and the showcase consumes the libraries from `node_modules`
exactly like an external project would. The styling tests also print the css size of each scan
strategy, which is the number to watch when a library grows.