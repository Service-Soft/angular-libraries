# Angular Libraries
Angular libraries that are styled with Tailwind CSS and themed through one shared set of design tokens.

Every component lives in its own entry point, so a project only ships the code of the components it imports.

# Table of Contents
- [Angular Libraries](#angular-libraries)
- [Table of Contents](#table-of-contents)
- [Packages](#packages)
- [Development](#development)

# Packages
Each package documents itself in its README, which is also its page on npm.

| Package | Does |
|---|---|
| [@service-soft/ui](./projects/ui/README.md) | The design system every other library builds on: the design tokens, theming, dark mode and the basic components, like buttons, inputs, dialogs and menus |
| [@service-soft/ngx-auth](./projects/ngx-auth/README.md) | Logs in at the auth routes of zibri with tokens or cookies, a second factor and password resets, protects routes by login and permission in a tenant, and has the pages for the login and passwords |
| [@service-soft/ngx-change-sets](./projects/ngx-change-sets/README.md) | Shows the change sets of an entity as its history, like the ones zibri keeps, and lets the user undo them |
| [@service-soft/ngx-ecommerce](./projects/ngx-ecommerce/README.md) | Lets the user add extras to a booking or order, like breakfast per day or a second bike, and sums up an order with its discounts, taxes and total, in the currency and language of the app |
| [@service-soft/ngx-entity](./projects/ngx-entity/README.md) | Describes the entities of an app with decorators like zibri's and builds their forms from them, on a grid of 12 columns with rows and tabs, reads and writes them at the routes of zibri, and shows them in tables a page at a time, with the filters and orders the server allows, which create, edit and delete them in dialogs or on pages of their own, asking before changes are lost |
| [@service-soft/ngx-error-handling](./projects/ngx-error-handling/README.md) | Hands every error nothing caught to several handlers, and shows it in a dialog, with the message of zibri, the problems of the values it refused and the reference of the request |
| [@service-soft/ngx-navigation](./projects/ngx-navigation/README.md) | Builds the navigation from rows of elements: a navbar whose elements move into a drawer on smaller screens, a footer, breadcrumbs from the routes, links to the sections of a page and a page for unknown urls, with the routes defined in the elements if you like |
| [@service-soft/ngx-persistence-logger](./projects/ngx-persistence-logger/README.md) | Logs to the console and sends the logs to a backend like the logs of zibri, and shows the logs of all applications in a log history with filters and pages |
| [@service-soft/ngx-pwa](./projects/ngx-pwa/README.md) | Keeps the changes the user makes offline and syncs them later, says when the user is offline, turns push notifications on and off, and offers to reload once a new version is ready |
| [@service-soft/ngx-tracking](./projects/ngx-tracking/README.md) | Asks for consent in a GDPR compliant dialog and tracks only what the user allowed: Google Analytics, Google Tag Manager, the Meta Pixel or your own backend, and a funnel to show the results |

# Development
| Command | Does |
|---|---|
| `npx ng build <project>` | Builds a library or the showcase |
| `npm run lint` | Lints the whole workspace |
| `npm test` | Runs the unit tests of every library, then builds the libraries, the showcase and Storybook, tests how they work together and runs AXE on every story in Chromium (install it once with `npx playwright install --only-shell chromium`) |
| `npm run storybook` | Starts Storybook for every library on port 6006, with an accessibility panel on every story |

Read [CONTRIBUTING.md](./CONTRIBUTING.md) and [CODE_STYLE.md](./CODE_STYLE.md) before your first change.
