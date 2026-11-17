# ngx-change-sets
Shows the change sets of an entity as its history, like the ones the `ChangeSetRepository` of [zibri](https://www.npmjs.com/package/zibri) keeps: what happened, when and by whom, and every value before and after. The user can undo a single change set, or roll back to the state after one, after confirming it.

It is built on [@service-soft/ui](https://www.npmjs.com/package/@service-soft/ui) and styled with Tailwind CSS. It uses native `<details>`, `<dialog>` and popover elements, and ships no css of its own.

# Table of Contents
- [ngx-change-sets](#ngx-change-sets)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
- [Setup](#setup)
- [Usage](#usage)
- [Configuration](#configuration)
- [Moving from ngx-material-change-sets](#moving-from-ngx-material-change-sets)
- [License](#license)

# Requirements
Angular 22 and Tailwind CSS 4. The change sets, like `ChangeSetEntity` and `ChangeSetType`, come from [zibri-contract](https://www.npmjs.com/package/zibri-contract), the package zibri declares them in.

```sh
npm install @service-soft/ngx-change-sets @service-soft/ui zibri-contract
```

# Setup
Your Tailwind generates the css. Add both packages to your global stylesheet:

```css
@import "tailwindcss";
@import "@service-soft/ui";
@import "@service-soft/ngx-change-sets";
```

The colors, fonts and radii come from the design tokens of `@service-soft/ui`. See its README for how to override them and how dark mode works.

Extend the `ChangeSetService` and provide it, together with `HttpClient`, which it sends the requests with. `openCreatedBy` is called when the user clicks the name of who made a change set:

```ts
@Service({ autoProvided: false })
export class MyChangeSetService extends ChangeSetService {
    private readonly router: Router = inject(Router);

    override openCreatedBy(changeSet: ChangeSet): void {
        void this.router.navigate(['/users', changeSet.createdBy]);
    }
}

// app.config.ts
providers: [provideHttpClient(), provideChangeSetService(MyChangeSetService)]
```

By default it resets with a `POST` to `${changeSetsApiBaseUrl}/${changeSet.changeSetEntityId}/reset` and rolls back with a `POST` to `.../rollback`, both with `{ changeSetId }` as the body. zibri has no routes for change sets, so write them in your zibri app, with the methods of its `ChangeSetRepository`:

| Route | Calls | Answers |
|---|---|---|
| `POST …/:id/reset` | `resetSingleChangeSetById(id, changeSetId)`, which undoes the change set and keeps the ones after it | its `ResetChangeSetResult`, `{ entity, changedValues }`, with the change sets of the entity |
| `POST …/:id/rollback` | `rollbackToChangeSetById(id, changeSetId)`, which undoes every change set after it and leaves the entity as it made it | the entity, with its change sets |

The entity comes with its change sets, which the component shows, like `ChangeSetEntity` of zibri, and their `createdAt` in nanoseconds, as zibri sends a `bigint`: as a string. Override `resetChangeSet` and `rollbackToChangeSet` for other endpoints, and `resolveCreatedByName` to show the name of a user instead of the id in `createdBy`.

# Usage
```ts
import { ChangeSetsComponent } from '@service-soft/ngx-change-sets/change-sets';
```

```html
<ngx-change-sets changeSetsApiBaseUrl="/api/orders" [(entity)]="order" />
```

| Input | Values | Default |
|---|---|---|
| `entity` | `ChangeSetEntity` | required — bind it with `[(entity)]` to get the entity back after undoing |
| `changeSetsApiBaseUrl` | `string` | required — passed on to the `ChangeSetService` |
| `canResetAndRollback` | `boolean` | `true` — whether the user can undo change sets |
| `canOpenCreatedBy` | `boolean` | `true` — whether the name of who made a change set is a button that calls `openCreatedBy` |

The newest change sets show first, to the nanosecond, 10 at a time. "Show more" adds the next ones and moves the focus to the first new one. The creation can't be reset on its own, and the newest change set is the state already, so it offers no rollback.

# Configuration
`provideChangeSetsConfig` sets the defaults for the whole app, or for a part of it when you add it to the providers of a component. Values you leave out keep the defaults of the parent, labels and dialog texts included:

```ts
provideChangeSetsConfig({
    dateFormat: 'MM/dd/yyyy h:mm a',
    labels: { types: { [ChangeSetType.UPDATE]: 'Edited' } }
})
```

| Option | Default |
|---|---|
| `dateFormat` | `'dd.MM.yyyy HH:mm'` — the date of a change set, in the format of Angular's `DatePipe` |
| `valueDateFormat` | `'dd.MM.yyyy HH:mm'` — dates among the changed values |
| `pageSize` | `10` — how many change sets show at first, and how many each "show more" adds |
| `canResetAndRollback` | `true` |
| `canOpenCreatedBy` | `true` |
| `showEmptyCreatedBy` | `false` — whether change sets without `createdBy` show the name `resolveCreatedByName` returns, like `'System'` |
| `labels` | the English texts of the component, to translate them |
| `resetConfirmDialogData`, `rollbackConfirmDialogData` | the title, text and buttons of the questions before undoing |

# Moving from ngx-material-change-sets
- It needs `@service-soft/ui` and Tailwind instead of Angular Material and the Font Awesome packages. Import from `@service-soft/ngx-change-sets/change-sets`.
- `<ngx-mat-change-sets [entity]>` is `<ngx-change-sets [(entity)]>`. The `config` input is gone: the labels, formats and dialog texts are set with `provideChangeSetsConfig`, and `canResetAndRollback` and `canOpenCreatedBy` are inputs, which only take booleans.
- `BaseChangeSetService` is `ChangeSetService`. It injects `HttpClient` itself, so your class needs no constructor, and it is provided with `provideChangeSetService(MyChangeSetService)` instead of the `NGX_CHANGE_SET_SERVICE` token. Its label and format properties moved to `provideChangeSetsConfig`.
- `getDisplayValueForCreatedBy` is `resolveCreatedByName`, `displayValueForEmptyCreatedBy` is `showEmptyCreatedBy`. `getOperationName` is replaced by the labels in `labels.types`, and `shortDateFormat` is gone: long dates wrap on narrow screens instead.
- `ConfirmDialogData` comes from `@service-soft/ui/dialog` and needs a `title`, which names the dialog for screen readers.
- `ChangeValuePipe` and `ValueType` are no longer exported. Only ISO date strings among the values are shown as dates now, not every string `new Date()` accepts, like `'1'`.
- The change sets are the ones of zibri instead of lbx-change-sets: `createdAt` is a string of nanoseconds, `createdBy` and the values of a change may be `null`, and reset answers `{ entity, changedValues }` instead of the entity.
- A rollback leaves the entity as the change set it rolls back to made it, and keeps that change set, like `rollbackToChangeSet` of zibri. The default texts of its dialog say so.
- `ChangeSetSoftDeleteEntity` is `SoftDeleteEntity`, with the `deletedWith` of zibri.

# License
MIT. The icons are [Font Awesome Free](https://fontawesome.com) icons, licensed under CC BY 4.0.
