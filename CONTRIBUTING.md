# Contributing to Angular Libraries
Thank you for considering to contribute to this project!

It is open for discussion to change anything regarding contributing, linting, workflow etc. at any point in time.

All development is done using github.

# Table of Contents
- [Contributing to Angular Libraries](#contributing-to-angular-libraries)
- [Table of Contents](#table-of-contents)
- [Create an issue](#create-an-issue)
  - [Special Notes for bugs](#special-notes-for-bugs)
- [Writing code](#writing-code)
  - [Adding a library](#adding-a-library)
- [Workflow for submitting Code Changes](#workflow-for-submitting-code-changes)
- [Releasing](#releasing)
- [License](#license)

# Create an issue
If you want to ask a question, need a new feature, found gaps in the documentation, found a bug, found code that can be refactored etc. you first have to start with creating an Issue.

Please check if there already is an issue for your problem.

Right now there are no specific guidelines for Issues, other than that their name and description should include enough details so that everyone knows what the issue is about.

## Special Notes for bugs
Great Bug Reports tend to have:

- A quick summary
- Steps to reproduce (be specific and try to give sample code if possible)
- What you expected would happen
- What actually happens
- Additional info (eg. why you think this might be happening, or workarounds you tried that did/did not work)

# Writing code
Read [CODE_STYLE.md](./CODE_STYLE.md) before your first change. It covers the conventions this repository follows for file naming, types, comments, documentation and tests, and applies to every library here.

## Adding a library
Every library is published under the `@service-soft` npm organisation. Start with `npx ng generate library <name>`, with the name without the scope, then:

1. In the library's `package.json`, set the name to `@service-soft/<name>`, the version to the one of the other libraries (see [Releasing](#releasing)) and add `"publishConfig": { "access": "public" }`, since scoped packages are private by default. Add `"license": "MIT"` and `"repository": { "type": "git", "url": "git+https://github.com/Service-Soft/angular-libraries.git", "directory": "projects/<name>" }`, which npm shows next to the README. Copy the root `LICENSE.md` into the library as `LICENSE`: the build only takes a license from the library's own folder, and `tests/license.spec.ts` checks the copy is the same.
2. Delete `src/lib`. Every component gets its own entry point instead: a directory next to `src` with an `ng-package.json` (`{ "lib": { "entryFile": "public-api.ts" } }`) and a `public-api.ts`.
3. In `angular.json`, set the project's `sourceRoot` to its root, so `ng test` finds the tests inside the entry points, and its `prefix` to the library's prefix.
4. In the library's `tsconfig.lib.json`, include `**/*.ts` and exclude `**/*.spec.ts` and `**/*.stories.ts`, and set `"paths": {}`: the paths of the root `tsconfig.json` point to the sources of the other libraries, which the build would compile into this one. Without them, `@service-soft/ui` resolves from `node_modules` like for a consumer. In its `tsconfig.spec.json`, include `**/*.spec.ts` and `**/*.d.ts`.
5. In the root `tsconfig.json`, map `@service-soft/<name>` and `@service-soft/<name>/*` to the sources (`./projects/<name>/*/public-api.ts`), so linting works without a build.
6. In `eslint.config.mjs`, set the library's prefix for `angular/component-selector` and `angular/directive-selector`.
7. Add a `tailwind.css` containing `@source "./fesm2022";`, list it under `assets` in `ng-package.json` and export it in `package.json` (`"exports": { ".": { "style": "./tailwind.css" } }`).
8. In `tests/global-setup.ts`, build the library after `ui` is linked and link it into `node_modules` as `@service-soft/<name>`, so the showcase consumes it like an external project. To build it on its own, build and link `ui` first by running `npm run test:workspace` once. Add it to the libraries of `tests/entry-points.spec.ts`, and to `LIBRARIES` in `.github/workflows/cd.yml`, after the libraries it depends on.
9. Add its stories to the one Storybook in `projects/ui/.storybook`: its folder to `stories` in `main.ts`, to `include` and `exclude` in `tsconfig.json`, and as `@source` in `styles.css`. AXE then checks them with all others.
10. Write its documentation in a `README.md` in the library's root. The build copies it into the package, so it is also its page on npm: it has to work on its own, with links to other packages on npm instead of to files in this repository. The root README only gets a row in its packages table that links to it.

# Workflow for submitting Code Changes
1. Create an issue if it not already exists.
2. Create a branch for that specific issue (The best way to this is directly inside the issue on the right side under "Development". That way the issue and the branch are automatically linked)
3. Checkout the new branch
4. Add your code
5. Update / add tests.
6. Update the documentation.
7. Check that tests and linting passes.
   1. For tests: `npm test`. The accessibility tests run in Chromium, install it once with `npx playwright install --only-shell chromium`
   2. For linting: `npm run lint` / `npm run lint:fix`
8. Rebase to dev and solve any merge-conflicts (`git rebase dev`)
9. Issue that pull request!

# Releasing
Every library is released with the same version, and its major is always the major of Angular it is built for, whether a
release has breaking changes or not: `22.x.x` is for Angular 22. A new major of Angular starts the next major, a release
in between only bumps the minor or the patch.

1. Bump every published library: `npm run release:bump -- <major.minor.patch>`. It sets the version of each library that
   isn't `"private"` (so not `testing`), and the ranges the libraries require each other in to `^<version>`.
2. Merge a pull request with the bump into `release` (a fix for an older major goes into `release-<major>`). The `CD`
   workflow then runs `npm test`, which builds every library into `dist`, and publishes each one the registry doesn't
   have at that version yet, in the order they depend on each other (`LIBRARIES` in `.github/workflows/cd.yml`), with
   provenance and under the npm tag `latest`, `latest-<major>` for an older major or `next` for a prerelease. Then it
   tags the commit and creates the GitHub release. A release that stopped halfway is finished by running it again.

The workflow publishes through npm's trusted publishing, which is set up per package on npmjs.com (the `cd.yml` workflow
of `Service-Soft/angular-libraries`). A package the registry has never seen can't be set up, so the first version of a
new library is published by hand from its build: `npm publish ./dist/<name>`.

A library that moved from an older, unscoped package (like `ngx-material-navigation`) gets one last release of the old
package, whose README says where it moved, and then `npm deprecate <old-package> "Moved to @service-soft/<name>"`. Don't
unpublish the old package: existing projects still install it.

# License
By contributing to this project, you agree that your contributions will be licensed under its MIT License.