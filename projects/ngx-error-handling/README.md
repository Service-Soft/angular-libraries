# ngx-error-handling
Handles the errors of Angular apps that nothing caught: hands each of them to several handlers, like the interceptors of `HttpClient`, and shows them to the user, like a request [zibri](https://www.npmjs.com/package/zibri) refused or one that found no connection, in a dialog with the message of zibri, in the language of the request.

# Table of Contents
- [ngx-error-handling](#ngx-error-handling)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
- [Several handlers for one error](#several-handlers-for-one-error)
- [The error dialog](#the-error-dialog)
  - [Translating](#translating)
- [The error body of zibri](#the-error-body-of-zibri)
- [Moving from ngx-material-auth](#moving-from-ngx-material-auth)
- [License](#license)

# Requirements
Angular 22. The dialog is built on [@service-soft/ui](https://www.npmjs.com/package/@service-soft/ui) and needs `@angular/localize`, which [translates its texts](#translating); `@service-soft/ngx-error-handling/error-handler` needs neither. The error body, `ErrorResponseBody` with its `ValidationProblem`s, comes from [zibri-contract](https://www.npmjs.com/package/zibri-contract), the package zibri declares it in.

```sh
npm install @service-soft/ngx-error-handling @service-soft/ui zibri-contract
ng add @angular/localize
```

# Several handlers for one error
Angular has a single `ErrorHandler`, so a library that replaces it replaces the one of every other library. `provideErrorHandler` puts one in its place that hands every error to each of your handlers, in their order:

```ts
// app.config.ts
import { provideErrorHandler } from '@service-soft/ngx-error-handling/error-handler';
import { showDialogErrorHandler } from '@service-soft/ngx-error-handling/error-dialog';
import { logErrorHandler } from '@service-soft/ngx-persistence-logger/logger';

providers: [
    provideHttpClient(),
    provideErrorHandler(logErrorHandler(), showDialogErrorHandler())
]
```

It only hands each error to the handlers, so the console shows an error when a handler writes it there, like `logErrorHandler`. An error of a handler is written to the console, and the handlers after it still run. It brings `provideBrowserGlobalErrorListeners`, so a promise nothing awaits reaches the handlers as well.

A handler is an `ErrorHandlerFn`, a function of the error that runs in an injection context, so it can use `inject()`:

```ts
const reportToSupport: ErrorHandlerFn = error => {
    inject(SupportService).report(error);
};

provideErrorHandler(reportToSupport, showDialogErrorHandler())
```

# The error dialog
`showDialogErrorHandler()` shows every error it gets in a dialog:

| Error | The dialog says |
|---|---|
| A request zibri refused, like for invalid data | the paragraphs of zibri, the problems of the values it refused, and the reference of the request, which finds it in the logs of the server |
| A request that failed on the server | the same, headed as a failure |
| A request that found no connection | to check the connection |
| Anything else, like a mistake in the app | that something went wrong |

Errors your code catches show none, like the ones the forms of [@service-soft/ngx-auth](https://www.npmjs.com/package/@service-soft/ngx-auth) show themselves. One dialog shows at a time, and none on the server.

| Option of `showDialogErrorHandler` | Default |
|---|---|
| `labels` | English texts, each of which can be changed on its own |
| `ignoredStatuses` | `[401]`: zibri refused the login, and the auth sends the user to the login |
| `isIgnored` | — a function that says an error shows no dialog, like one your app tells the user of itself |

## Translating
The default texts are `$localize` with an id of their own, like `@@ngx-error-handling.error-dialog.failedTitle`, so `ng extract-i18n` puts them into the messages of your app, and you translate them like its own texts. The dialog needs `@angular/localize` for that, `ng add @angular/localize`, also in an app of one language. A build with `localize` fills the texts in, so no part of `@angular/localize` reaches the browser. The defaults are made once an error is handled, so translations an app loads at runtime with `loadTranslations` apply as well. A text of `showDialogErrorHandler` replaces the default in every language. So translate a default in your messages, and change it in the config only to say something else: a default the config replaces stays in your messages, though nothing shows it.

# The error body of zibri
`@service-soft/ngx-error-handling/error-response` reads what zibri answers a refused or failed request with, without any ui:

```ts
const body: ErrorResponseBody | undefined = ErrorResponseUtilities.findErrorResponseBody(error);
```

It has the `status`, `name`, `message` and `paragraphs` of the error, the `problems` of a request that failed validation, and the `traceId`.

# Moving from ngx-material-auth
The `HttpErrorInterceptor` of ngx-material-auth showed an error dialog for every failed request, the ones the app handled itself as well. `provideErrorHandler(showDialogErrorHandler())` shows the errors nothing caught, read from the error body of zibri.

# License
MIT.