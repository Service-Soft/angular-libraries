# ngx-entity
Describes the entities of your app once, with decorators like the ones of [zibri](https://www.npmjs.com/package/zibri), and builds the forms of them from that: the fields with their labels and rules, laid out on a grid of 12 columns, in rows and tabs. A service reads and writes them at the routes of a `CrudController` of zibri, with pages, filters and orders typed by the same configs the controller takes.

It is built on [@service-soft/ui](https://www.npmjs.com/package/@service-soft/ui) and styled with Tailwind CSS. It ships no css of its own, and each kind of field is its own chunk, which a page only loads once it shows a property of that kind.

A table shows the entities a page at a time from the server, with the columns, orders and filters the service allows, and creates, edits and deletes them, in dialogs or on pages of their own, which ask before changes are lost.

# Table of Contents
- [ngx-entity](#ngx-entity)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
- [Setup](#setup)
- [Describing an entity](#describing-an-entity)
  - [Every property](#every-property)
  - [Strings](#strings)
  - [Numbers](#numbers)
  - [Booleans](#booleans)
  - [Dates](#dates)
  - [Objects](#objects)
  - [Arrays](#arrays)
  - [Relations](#relations)
- [Reading and writing entities](#reading-and-writing-entities)
- [The table of an entity](#the-table-of-an-entity)
- [The form of an entity](#the-form-of-an-entity)
- [Pages of an entity](#pages-of-an-entity)
- [Leaving unsaved changes](#leaving-unsaved-changes)
- [Fields of your own](#fields-of-your-own)
- [Configuration](#configuration)
- [Moving from ngx-material-entity](#moving-from-ngx-material-entity)
- [License](#license)

# Requirements
Angular 22 and Tailwind CSS 4. The models shared with zibri, like `PaginationResult`, `FilterConfig` and `ValidationProblem`, come from [zibri-contract](https://www.npmjs.com/package/zibri-contract).

```sh
npm install @service-soft/ngx-entity @service-soft/ui @service-soft/ngx-error-handling zibri-contract
```

The decorators need `"experimentalDecorators": true` in your `tsconfig.json`, like zibri.

# Setup
Your Tailwind generates the css. Add both packages to your global stylesheet:

```css
@import "tailwindcss";
@import "@service-soft/ui";
@import "@service-soft/ngx-entity";
```

The colors, fonts and radii come from the design tokens of `@service-soft/ui`. See its README for how to override them and how dark mode works. The service sends its requests with `HttpClient`, so provide it with `provideHttpClient()`.

# Describing an entity
A class with a decorator on every property the forms show, from `@service-soft/ngx-entity/entity`. The decorators take zibri's option names, so a class reads like its zibri twin, and add what a form needs, like the label:

```ts
export class Task {
    @Property.string({ displayName: 'Id', format: 'uuid', omitForCreate: true, readonly: true })
    id!: string;

    @Property.string({ displayName: 'Title', minLength: 3, position: { row: 1, order: 1 } })
    title!: string;

    @Property.string({ displayName: 'Status', enum: TaskStatus, default: TaskStatus.OPEN, position: { row: 1, order: 2 } })
    status!: TaskStatus;

    @Property.boolean({ displayName: 'Done', readonly: task => task.status === TaskStatus.ARCHIVED })
    done!: boolean;

    @Property.date({ displayName: 'Due', required: false, after: () => new Date(), position: { tab: 2, tabName: 'Schedule' } })
    dueAt?: Date;
}
```

The entities themselves don't have to be instances of the class: the class only holds what the decorators say, so the plain json of a server works. A rule that depends on the entity, like `readonly` above, is a function of its values, typed by the class the decorator is in. It gets the values of the form, so any of them may still be missing.

## Every property
| Option | Values | Default |
|---|---|---|
| `displayName` | `string` | required — the label of the field and the header of its column |
| `description` | `string` | none — a hint below the field |
| `required` | `boolean` or a function of the entity | `true`, like in zibri. A read only field is never required in a form |
| `display` | `boolean` or a function of the entity | `true` — whether the form shows the field |
| `readonly` | `boolean` or a function of the entity | `false` — whether the field shows its value without letting the user change it |
| `omitForCreate` | `boolean` | `false` — whether the form that creates an entity leaves the field out, like an id the server sets |
| `omitForUpdate` | `boolean` | `false` — whether the form that edits an entity leaves the field out |
| `defaultWidths` | `[lg, md, sm]`, each `1` to `12` | `[6, 6, 12]` — the columns the field takes on large, medium and small screens |
| `position` | `{ tab?, tabName?, row?, order? }` | none — see [the form](#the-form-of-an-entity) |
| `default` | a value, or a function that creates it | none — the value a new entity starts with |

## Strings
`@Property.string` takes `minLength`, `maxLength`, `regex` (a `RegExp` or its source, matching the whole value), `format` (`'uuid'`, `'email'` or `'phone'`, which sets the type of the input), `password` and `enum`, which makes the field a select of the values of the enum. `displayStyle: 'textarea'` gives a field of several lines instead of one. `displayStyle: 'autocomplete'` with `options`, a list of strings or a function of the entity that returns one, suggests the options that contain the text; any text is the value, with the rules of the string, unless `restrictToOptions: true` makes only an option one.

`password: true`, like zibri's password strings, makes it the field of a new password: hidden, with how hard it is to guess (`passwordStrength: false` turns that off) and a second input that has to repeat it (`confirmation: false` turns that off, `confirmationDisplayName` names it). Only the password is sent. The service leaves it out of what the server answers, which would be its hash, so the form of an existing entity starts empty, isn't required there, and keeps the stored password while it stays empty. The texts are `provideEntityPasswordFieldConfig({ confirmationLabel, mismatchMessage })` of `@service-soft/ngx-entity/field-password`; the ones of the strength are `passwordStrengthLabels` of `provideInputConfig`.

## Numbers
`@Property.number` takes `min`, `max`, `format` (`'number'`, or `'integer'` for whole numbers) and `enum`, which makes the field a select that shows the names of the members. `displayStyle: 'slider'` shows a slider between `min` and `max`, which it needs both of; without a `default` it starts at `min`, since it always shows a value.

## Booleans
`@Property.boolean` is `false` by default, as an unchecked checkbox is. `required` only says that the property is sent, which it always is; `mustBeChecked`, a boolean or a function of the entity, makes the user check it, like accepting the terms. `displayStyle` is `'checkbox'` or `'switch'`, by default what the inputs of ui use.

## Dates
`@Property.date` takes `after` and `before`, the earliest and latest date, each a date or a function of the entity, like an end after the start: `after: event => event.startsAt`. `displayStyle: 'datetime'` asks for a time as well as the day. The json of a server has no dates, so the service turns the strings of date properties into dates.

`@Property.dateRange` is a `DateRange`, `{ start, end }`, which on the server is an object with these two dates. The field has an input for each, the end not before the start, and takes `after`, `before` and `displayStyle` like a date. It needs both dates or neither, also when it isn't required. The labels of its inputs are `provideEntityDateRangeFieldConfig({ startLabel, endLabel })` of `@service-soft/ngx-entity/field-date-range`.

## Objects
`@Property.object({ displayName: 'Address', cls: () => Address })`, like zibri's, is an object whose class has decorated properties of its own. The form shows their fields in a group with its label, laid out by their positions like the ones of the entity, and as wide as the form by default. Their conditions get the object, not the entity, and the problems of the server show at them by their path, like `address.city`. A new entity starts with the defaults of the class. An object with `required: false` starts empty instead: its fields are only required once one of them has a value, and while all are empty it is left out, so it is sent as missing. A table shows the texts of its values, and doesn't order by it: zibri orders by the properties inside an object.

`displayStyle: 'dropdown'` with `options: [{ label: 'Head office', value: headOffice }]`, or a function of the entity that returns them, is a select of fixed objects instead. An object equal to an option, like the copy the server answers, shows as that option, in the form and in the table.

## Arrays
`@Property.array({ displayName: 'Tags', items: { type: 'string' } })`, like zibri's, shows by what its items are:
- `type: 'string'` or `'number'`: chips. Typed in and taken with Enter, with the rules of the items (`minLength`, `maxLength`, `regex`; `min`, `max`, `format`), whose error shows at the input while a typed text breaks them. `options` are strings the input suggests, which `restrictToOptions: true` makes the only ones; an `enum` makes its members the only ones.
- `type: 'date'` or `'dateRange'`: a table, each item with a button that removes it, and below it the inputs and the button that add one, between `after` and `before`; `displayStyle: 'datetime'` asks for times as well. A `DateRange` is `{ start, end }`, which on the server is an object with these two dates.
- `type: 'object'` with `cls: () => Position`: a table of the objects, each with buttons that edit and remove it, and a button that adds one. Adding and editing happen in a dialog with the fields of the class, which starts with its defaults. `columns` names the properties the table shows, else it shows every one the form displays.

A new entity starts with an empty array. That is a value, so an array isn't required by default; `required: true` makes it need an item, whose error shows at the input or the button that adds one, and the form focuses it. A table shows an array as the texts of its items. The texts of the tables are `provideEntityArrayFieldConfig({ addLabel, editLabel, removeLabel, dateLabel, startLabel, endLabel, addTitle, editTitle, saveLabel, cancelLabel, yesLabel, noLabel })` of `@service-soft/ngx-entity/field-base`.

## Relations
Relations are declared like in zibri, on a property of their own, with the class of the other entity and the class of its [service](#reading-and-writing-entities), each in a function, so the classes may point to each other:

```ts
class Task {
    @Property.string({ displayName: 'Team', format: 'uuid' })
    teamId!: string;

    @Property.manyToOne({ displayName: 'Team', target: () => Team, joinColumn: 'teamId', service: () => TeamService, label: 'name' })
    team?: Team;
}

class Project {
    @Property.oneToMany({ displayName: 'Tasks', target: () => Task, inverseSide: 'project', service: () => TaskService, columns: ['title', 'team'] })
    tasks?: Task[];
}
```

`@Property.manyToOne` and `@Property.belongsToOne` point to one other entity, whose id the entity keeps in its `joinColumn`. Their field is an autocomplete that asks the service of the other entity for the ones whose `label` contains the typed text, so its filter config has to match that property, like with `iLike`; it edits the joinColumn, which gets no field of its own. The other entity the read included, like with zibri's `defaultRelations`, shows right away; otherwise it is loaded by its id. A table shows the `label` of it.

`@Property.oneToMany` holds the many entities that point to this one, through the manyToOne named `inverseSide`. The form of an existing entity shows them in a table that creates, edits and deletes them in dialogs, filtered by the joinColumn of the inverse side, which the filter config of their service has to take with `equals`; a new one starts with the id of this entity in it. The form of a new entity says they can be added once it is saved. It is never required.

zibri takes no relation in a request body, only joinColumns, so the service never sends a relation. Many-to-many relations aren't supported yet, as zibri can't write them through a `CrudController`.

The field of a oneToMany is the one field you have to give, in the app config, as its table opens dialogs with forms, which load the fields, and a library can't import itself in a circle:

```ts
provideEntityFields({ hasMany: async () => (await import('@service-soft/ngx-entity/field-has-many')).EntityHasManyFieldComponent })
```

`EntityUtilities` reads what the decorators say: `resolveProperties(Task)`, `resolveDefaults(Task)` for the values of a new entity, `resolveChanges(Task, original, current)` for the values that changed, and `resolveFromJson(Task, json)`.

# Reading and writing entities
Extend `EntityService` from `@service-soft/ngx-entity/service` once per entity, with the url of its `CrudController` and the filter and order configs the controller takes:

```ts
const taskFilter = { title: 'iLike', status: 'oneOf' } as const satisfies FilterConfig<Task>;
const taskOrder = { title: true, dueAt: true } as const satisfies OrderConfig<Task>;

@Injectable({ providedIn: 'root' })
export class TaskService extends EntityService<Task, typeof taskFilter, typeof taskOrder> {
    readonly entity = Task;
    readonly baseUrl = '/api/tasks';
    override readonly filter = taskFilter;
    override readonly order = taskOrder;
}
```

| Method | Sends | Answers |
|---|---|---|
| `resolvePage({ page, limit, filter, order })` | `GET baseUrl?page&limit&filter&order`, the filter and order as json, left out when empty | a `PaginationResult<Task>`, `{ items, totalAmount }` |
| `resolveById(id)` | `GET baseUrl/:id` | the entity |
| `create(values)` | `POST baseUrl` with the values | the entity the server created |
| `update(original, current)` | `PATCH baseUrl/:id` with only the values that changed | the entity as the server saved it |
| `delete(entity)` | `DELETE baseUrl/:id` | nothing |

The filter and order are typed by the configs, with `FilterValue` and `OrderValue` of zibri-contract, so a request can only ask for what the controller allows. Without an `order`, the list may be ordered like zibri's default; `false` orders nothing. The id of an entity is its `id`; override `getId` for one of another name, and any method for routes of your own.

# The table of an entity
`ngx-entity-table` of `@service-soft/ngx-entity/table` shows the entities of a service a page at a time, on the `ui-table` of `@service-soft/ui/table`. Name the columns by the keys of their properties:

```html
<ngx-entity-table label="Tasks" [service]="taskService" [columns]="['title', 'status', 'hours', 'dueAt']" opens (opened)="edit($event)" />
```

The header of a column is the `displayName` of its property, and its text the value formatted by its type: a number and a date in the locale of the app, a boolean as yes or no, an enum by its member, a relation by the label of the other entity, when the read included it (zibri's `defaultRelations`). Give a column as `{ key, label, value, cell }` to change any of them, like a cell with a template of its own. A column can be ordered by when the order config of the service names it, or, when the service has none, unless it is a relation, like zibri's default. Its filter comes from the filter config: a text input for `iLike`, `fuzzy` and `equals` of a string, a select for `oneOf` and `equals` of an enum and for a boolean. A `range` has no input in the table.

| Input | Values | Default |
|---|---|---|
| `service` | an `EntityService` | required |
| `label` | `string` | required — what the table shows, above it and next to its buttons, which screen readers say on entering it |
| `hideLabel` | `boolean` | `false` — whether only screen readers read the label, like when a heading above the table says the same |
| `columns` | keys, or `{ key, label?, value?, cell? }` | required |
| `pageSize` | `number` | `10`, from `provideTableConfig` of ui — the user changes it below the table from the `pageSizes` of that config, bind it with `[(pageSize)]` to keep it |
| `selectable` | `boolean` | `false` — checkboxes that select rows, bound with `[(selected)]` |
| `opens` | `boolean` | `false` — whether a row opens, which `(opened)` says with the entity |
| `actions` | `TemplateRef` | none — the actions of a row; the template gets the entity as `let-row` |

What you put inside of the table, like a description, shows below its label, in its frame.

The table creates, edits and deletes its entities as well, when you tell it to:

```html
<ngx-entity-table label="Tasks" [service]="taskService" [columns]="['title', 'status']" edit="dialog" canCreate canDelete />
```

| Input | Values | Default |
|---|---|---|
| `edit` | `'dialog'` or `'page'` | none — where the table creates and edits: a row opens its entity in the form of a dialog, or on the page at `:id` below the route of the table, `new` for a new one; see [pages of an entity](#pages-of-an-entity) |
| `canCreate` | `boolean` | `false` — a button next to the label that creates an entity, where `edit` says |
| `canDelete` | `boolean` | `false` — a button in every row that deletes its entity, after asking |
| `canImport` | `boolean` | `false` — a button next to the label that imports entities from a JSON file, see below |
| `canExport` | `boolean` | `false` — buttons next to the label that export the selected entities as JSON, CSV or XML |

The table loads its page again after an entity was saved or deleted. The dialogs are only loaded when they are first opened, so a table that only shows its entities doesn't ship the form. To open them yourself, use the `EntityDialogService` of `@service-soft/ngx-entity/dialog`: `create(service)` and `edit(service, entity)` resolve with the entity the server saved, or `undefined` when the user closed the dialog, and `delete(service, entity)` with whether it was deleted. Each takes a `title`. The problems of values zibri refused show at their fields, and a value it refused can't be saved again until the user changes it. Escape doesn't close the form, and Cancel asks before the changes are lost.

`canExport` adds buttons above the table that save the selected entities as a file, and makes the rows selectable: JSON as the server answered them, CSV with the headers and texts of the columns (separated by `csvSeparator`, `','` by default), and XML with an element per value. They are built in the browser, by `EntityExportUtilities` of `@service-soft/ngx-entity/export`, which is only loaded on the first export. `canImport` adds a button that imports the entities of a JSON file with the `import` of the service, then loads the page again: a POST to `<baseUrl>/import` with the file in the multipart field `import`, which answers the created entities. zibri's `CrudController` has no such route, so add it to your controller, or override `import`; a refused file goes to the `ErrorHandler`.

`page`, `order`, `filters` and `selected` can be bound two-way to keep them, like in the url, but don't have to be. A changed order or filter goes back to the first page, and a filter the user types in is only sent once they stop typing. The page stays while the next one loads, and `reload()` loads it again, like after saving. A page that can't be loaded goes to the `ErrorHandler` of the app, like the dialog of `@service-soft/ngx-error-handling`. The texts of booleans come from `provideEntityTableConfig({ yesLabel, noLabel })`, the others from `provideTableConfig` of ui.

# The form of an entity
`ngx-entity-form` of `@service-soft/ngx-entity/form` shows the fields of an entity, by the decorators of its class. Bind the values two-way, and put it inside a `ui-form` with the button that saves, which only submits while every field is valid:

```html
<ui-form (submit)="save()">
    <ngx-entity-form [entity]="entity" mode="update" [problems]="problems()" [(value)]="task" />
    <button ui-button type="submit">Save</button>
</ui-form>
```

```ts
protected readonly entity: EntityClass<Task> = Task;

protected async save(): Promise<void> {
    try {
        this.task.set(await this.taskService.update(this.original, this.task()));
    }
    catch (error) {
        // the problems of the values zibri refused, which show at their fields until the user changes them
        this.problems.set(error instanceof HttpErrorResponse ? error.error?.problems ?? [] : []);
    }
}
```

| Input | Values | Default |
|---|---|---|
| `entity` | the class | required |
| `value` | `Partial<T>` | required — the values, bind them with `[(value)]` |
| `mode` | `'create'` or `'update'` | `'create'` — which of `omitForCreate` and `omitForUpdate` applies |
| `problems` | `ValidationProblem[]` | `[]` — the problems of zibri's error response, shown at the field of their `key` |

`ngx-entity-editor` of `@service-soft/ngx-entity/editor` does all of this for you: a heading, the form, and the buttons that save and cancel. It saves with the service, shows the problems zibri answered at their fields, and emits `(saved)` with the entity the server saved and `(cancelled)`. `hasUnsavedChanges()` says whether to ask before you leave it. The dialogs and pages are built on it; use it for a page of your own:

```html
<ngx-entity-editor [service]="taskService" [entity]="task()" title="Edit task" (saved)="close()" (cancelled)="close()" />
```

Without an `entity` it creates one, and without a `title` its heading is the `createTitle` or `editTitle` of `provideEntityFormConfig`. The heading is an `h2`, for a dialog or below the heading of a page; `[headingLevel]="1"` makes it the heading of the page, like the pages of ngx-entity do.

Every row is a grid of 12 columns, in which each field takes the columns of its `defaultWidths`; on a small screen the fields stack, unless their widths say otherwise. `position` places a field: on a `tab` (from 1, the first by default), named by the `tabName` of one of its fields; in a `row` of that tab; and at an `order` inside the row. The fields without a row share one after the others, and the fields without an order come last in their row; otherwise they keep the order of the class. A form whose fields are all on one tab shows no tabs. The fields of every tab belong to the form, also of one the user never opened: when one of them is invalid, saving opens its tab and focuses it.

# Pages of an entity
A table with `edit="page"` creates an entity on the page at `new` below its route, and edits one on the page at its id. `EntityRouteUtilities.resolveRoutes` of `@service-soft/ngx-entity/routes` builds both routes; put them next to the route of the table:

```ts
export const routes: Routes = [
    {
        path: 'tasks',
        children: [
            { path: '', component: TasksComponent },
            ...EntityRouteUtilities.resolveRoutes(TaskService, { createTitle: 'New task', editTitle: 'Edit task' })
        ]
    }
];
```

The page loads the entity with the service, shows it in the editor, and goes back to the table once it is saved or cancelled. Its titles are the titles of the routes, so they are the headings of the pages and the titles of the tabs of the browser; without them, the headings are the ones of `provideEntityFormConfig`. The page is loaded when it is first opened, so the routes only add a few lines to the bundle that declares them. It asks before the user leaves it with changes they didn't save, and the browser asks as well before the tab is closed or reloaded. An entity that can't be loaded goes to the `ErrorHandler` of the app. The route gets the service through `ENTITY_SERVICE` of `@service-soft/ngx-entity/service`, which the page injects.

# Leaving unsaved changes
`unsavedChangesGuard` of `@service-soft/ngx-entity/unsaved-changes` asks before the user leaves a route whose component has changes they didn't save, and stays when they keep them. It works for any component that implements `UnsavedChanges`, with a `hasUnsavedChanges()`:

```ts
{ path: 'profile', component: ProfileComponent, canDeactivate: [unsavedChangesGuard] }
```

`UnsavedChangesService.askToDiscard()` asks the same question from code, like the dialogs do on Cancel. The dialog it asks in is loaded when it is first asked.

# Fields of your own
Each kind of field is a component of its own: `string`, `password`, `textarea`, `autocomplete`, `select`, `number`, `slider`, `boolean`, `date`, `dateRange`, `chips`, `dateArray` and `objectArray`, which a form loads the first time it shows a property of that kind. Replace a kind with your own with `provideEntityFields` of `@service-soft/ngx-entity/field`, as an `import()`, so only the pages that show it load it:

```ts
provideEntityFields({ date: async () => (await import('./calendar-field.component')).CalendarFieldComponent })
```

Your component extends `BaseEntityFieldDirective` of `@service-soft/ngx-entity/field-base`. It gets the `property`, the values of the whole `entity`, `required`, `readonly` and the `problem` of the server, and binds the `value` two-way. `ngx-entity-field` shows a single field the same way, outside of a form.

A single property gets a field of its own with `@Property.custom`, loaded the first time a form shows it:

```ts
@Property.custom({ displayName: 'Color', component: async () => (await import('./color-field.component')).ColorFieldComponent, data: ['red', 'green'] })
color!: string;
```

`data` is whatever else the component needs, which it reads from `property().metadata.data`. The value is sent like any other; a table shows it when it is a text, else a column gives its `value`.

# Configuration
| Provider | Changes |
|---|---|
| `provideEntityFormConfig({ tabLabel, createTitle, editTitle, saveLabel, cancelLabel })` | the label of a tab none of whose fields names it, by default `'General'` for the first tab, where the fields without a tab are, and `Tab 2` and so on for the others, and the headings and buttons of the editor, its dialogs and pages |
| `provideEntityFields({ … })` | the components of kinds of fields, see [fields of your own](#fields-of-your-own) |
| `provideEntityTableConfig({ yesLabel, noLabel, createLabel, deleteLabel, createFirstLabel, importLabel, exportLabels, exportFileName, csvSeparator })` | the texts of booleans in tables and their filters, of the buttons that create, delete, import and export, in place of the table of a oneToMany in the form of a new entity, the name of exported files and the separator of a CSV |
| `provideEntityDialogConfig({ deleteTitle, deleteParagraphs, deleteLabel, keepLabel })` | the question before deleting an entity |
| `provideEntityArrayFieldConfig({ … })` | the texts of the tables of arrays and the dialog of an object in one, see [arrays](#arrays) |
| `provideEntityDateRangeFieldConfig({ startLabel, endLabel })` | the labels of the inputs of a date range |
| `provideEntityPasswordFieldConfig({ confirmationLabel, mismatchMessage })` | the label of the input that repeats a password, `displayName => \`Repeat ${displayName}\`` by default, and its error |
| `provideUnsavedChangesConfig({ title, paragraphs, discardLabel, keepEditingLabel })` | the question before changes are lost |

The texts of the fields themselves, like the error messages, come from `provideInputConfig` of `@service-soft/ui/input`, and those of the tables from `provideTableConfig` of `@service-soft/ui/table`.

# Moving from ngx-material-entity
It is not finished: many-to-many relations and files (which wait for the next major version of zibri) are still to come. What changed so far:
- Import and export are `canImport` and `canExport` of the table instead of `allowJsonImport` and the multi select actions. The import posts to the same `/import` route with the same `import` field.
- `@referencesOne` is `@Property.manyToOne` (or `belongsToOne`) on the relation, with the id in its `joinColumn`, searched on the server instead of loading every entity. `@hasMany` is `@Property.oneToMany`, whose table filters the other entities by their joinColumn instead of a route of its own below the entity.
- It needs `@service-soft/ui` and Tailwind instead of Angular Material, and no `reflect-metadata`.
- The decorators are `Property.string`, `.number`, `.boolean`, `.date`, `.object` and `.array`, with zibri's option names (`minLength`, `regex`, `enum`, `min`, `after`, `cls`, `items`, …). `isReadOnly` is `readonly`, and the rules that depend on the entity get it typed. `defaultWidths` and `position` stay as they were. A select is a string or number with an `enum`. A password is `password: true`, with `confirmation` for `needsConfirmation`, `confirmationDisplayName` and `passwordStrength` for `displayPasswordStrength`. An `@object` is inline or a `'dropdown'` with `options`, and an `@array` says what it holds in `items` instead of `itemType`, with `options` for `autocompleteValues`. A string with `autocompleteValues` is `displayStyle: 'autocomplete'` with `options`, a `'daterange'` date is `Property.dateRange` (without the list of its days, `values`), and `@custom` is `Property.custom` with `data` for `customMetadata`; validation is the native one of its component instead of `isValid`.
- Entities don't have to be built with `new`: the metadata lives with the class, not the instance.
- `EntityService` takes a filter and an order config typed against the entity, pages on the server, sends only the changed values with `PATCH`, and keeps no cache. The id is `getId`, which you can override, instead of `entity.id`.
- The form validates with the native rules of the inputs, and shows zibri's problems at their fields.
- The create and edit pages come from `EntityRouteUtilities.resolveRoutes`, with the title of each route as its heading, and `UnsavedChangesGuard` is the function `unsavedChangesGuard` for any component with a `hasUnsavedChanges()`.
- `ngx-mat-entity-table` loaded every entity and searched, sorted and paged them in the browser. `ngx-entity-table` asks the server for one page, ordered and filtered by the configs of the service, and has no search over all columns; `ui-local-table` of `@service-soft/ui/local-table` is the table for rows you have in full.

# License
MIT