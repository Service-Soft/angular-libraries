# ngx-persistence-logger
Logs to the console of the browser and sends the logs to your backend, like the logs of [zibri](https://www.npmjs.com/package/zibri), and shows the logs of all your applications in a log history with filters.

- `@service-soft/ngx-persistence-logger/logger`: the `LoggerService`, with the same methods as the logger of zibri, and a handler that logs every error nothing caught. It has no other dependencies than Angular, so it adds little to every page.
- `@service-soft/ngx-persistence-logger/log-history`: the log history, built on [@service-soft/ui](https://www.npmjs.com/package/@service-soft/ui) and styled with Tailwind CSS. Only the page that shows it loads it.

# Table of Contents
- [ngx-persistence-logger](#ngx-persistence-logger)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
- [Logger](#logger)
  - [Errors nothing caught](#errors-nothing-caught)
  - [Logging outside of injection](#logging-outside-of-injection)
- [Log history](#log-history)
  - [The endpoint of the logs](#the-endpoint-of-the-logs)
  - [Configuration](#configuration)
    - [Translating](#translating)
- [Moving from the old ngx-persistence-logger](#moving-from-the-old-ngx-persistence-logger)
- [License](#license)

# Requirements
Angular 22. The log history also needs `@service-soft/ui`, `@angular/localize`, which [translates its texts](#translating),
and Tailwind CSS 4. The models a log is sent and read as,
like `LogLevel`, `LogContext` and `PaginationResult`, come from [zibri-contract](https://www.npmjs.com/package/zibri-contract),
the package zibri declares them in.

```sh
npm install @service-soft/ngx-persistence-logger zibri-contract
# only for the log history
npm install @service-soft/ui
ng add @angular/localize
```

# Logger
Provide `HttpClient`, which sends the logs, and set where they go and which application they come from:

```ts
// app.config.ts
providers: [
    provideHttpClient(),
    provideLoggerConfig({ logUrl: `${environment.apiUrl}/logs`, application: 'Website' })
]
```

Then inject the `LoggerService` and log:

```ts
private readonly logger: LoggerService = inject(LoggerService);

save(order: Order): void {
    this.logger.info('Saving the order', { orderId: order.id });
    try {
        // …
    }
    catch (error) {
        this.logger.error(error, { orderId: order.id });
    }
}
```

| Method | Logs |
|---|---|
| `debug(message, metadata?)` | details that only help while looking for a bug |
| `info(message, metadata?)` | what the application is doing |
| `warn(message, metadata?)` | a state that might lead to errors |
| `error(error, metadata?)` | something that doesn't work as intended, with the message of the error |
| `critical(error, metadata?)` | something that needs to be fixed right away, with the message of the error |

The levels are the ones of zibri, `LogLevel.DEBUG` (0) to `LogLevel.CRITICAL` (4). The error can be anything, like what a `catch` got.

The console shows the level in color, then the message or the error with its stack, then the metadata as an object you can expand. The console links each log to the line that called the logger, because Angular marks packages from `node_modules` in the source maps of development builds as code the devtools skip. To see when a log happened, turn on the timestamps in the settings of the console.

Every log from `info` on is sent to the backend with a `POST` to `logUrl`, as a `NewLog`: a log of zibri, without what the backend adds, like the id and the dates:

```json
{
    "application": "Website",
    "level": 3,
    "message": "Cannot read total",
    "context": {
        "origin": "/checkout",
        "metadata": { "orderId": 1001 },
        "error": {
            "name": "TypeError",
            "paragraphs": ["Cannot read total", "    caused by Error:", "    No cart"],
            "stackTrace": ["TypeError: Cannot read total", "    at checkout (main.js:1:1)"]
        }
    }
}
```

The `origin` is the path of the page, without its query, as the bundle of a browser has no files to name: the application and the page say where it happened. The `paragraphs` are the message of the error and the ones of its causes, like zibri writes them, or the `paragraphs` of an error that has them. The `stackTrace` is the stack of the error, followed by the ones of its causes. A log that can't be sent is only written to the console.

| Option of `provideLoggerConfig` | Default |
|---|---|
| `logUrl` | required — where the logs are sent to |
| `application` | required — the name of the application the logs come from |
| `minimumConsoleLevel` | `LogLevel.DEBUG` — the lowest level written to the console |
| `minimumSendLevel` | `LogLevel.INFO` — the lowest level sent to the backend |

There is one `LoggerService` for the whole app, so provide its config in the application config. To send logs somewhere else, extend it, override `sendLog` and provide your class in its place:

```ts
@Service({ autoProvided: false })
export class MyLoggerService extends LoggerService {
    protected override async sendLog(log: NewLog): Promise<void> {
        await firstValueFrom(this.http.post(this.config.logUrl, log, { headers: { 'x-api-key': environment.logApiKey } }));
    }
}

providers: [{ provide: LoggerService, useClass: MyLoggerService }]
```

## Errors nothing caught
`logErrorHandler()` sends every error your app doesn't catch to the backend. It is a handler for `provideErrorHandler` of [@service-soft/ngx-error-handling](https://www.npmjs.com/package/@service-soft/ngx-error-handling), which hands each error to several handlers, as Angular has only one `ErrorHandler`, like one that shows it to the user as well:

```ts
providers: [provideErrorHandler(logErrorHandler(), showDialogErrorHandler())]
```

The handler logs each error with `logger.error`, so it is written to the console and sent. Failed requests aren't logged: the backend that answered them logs them itself.

## Logging outside of injection
To log where you can't inject, like in a plain function, keep the service in a variable once the app starts:

```ts
export let logger: LoggerService;

// app.config.ts
providers: [provideAppInitializer(() => {
    logger = inject(LoggerService);
})]
```

# Log history
Shows the logs of all your applications, a page at a time, newest first. The user filters them by level and application, and searches through them. Live mode loads the page again every second.

```css
@import "tailwindcss";
@import "@service-soft/ui";
@import "@service-soft/ngx-persistence-logger";
```

```ts
import { LogHistoryComponent } from '@service-soft/ngx-persistence-logger/log-history';
```

```html
<h1 class="font-heading text-headline">Logs</h1>
<ngx-log-history logsBaseUrl="/api/logs" [applications]="['Api', 'Website', 'Admin']" />
```

| Input | Values | Default |
|---|---|---|
| `logsBaseUrl` | `string` | required — a `GET` request to it answers a page of logs, see [the endpoint of the logs](#the-endpoint-of-the-logs) |
| `applications` | `string[]` | required — the applications the user can filter by |

Each log shows its level, its application, where it was logged, the page or the file, and when, then its message or the paragraphs of its error, its metadata, and the stack of its error to open. The logs are framed and striped like an outlined table of ui, by its tokens `--radius-table` and `--color-primary-faint`, so one is told apart from the next at a glance.

## The endpoint of the logs
The log history sends the page and the filters as query: `GET /api/logs?page=2&limit=10&levels=4&levels=3&applications=Website&search=checkout`. It answers a `PaginationResult<Log>`, `{ items, totalAmount }`, newest first, with the logs that match every filter it got. A filter it didn't get matches every log, like the levels while the user selected none.

| Query | Is |
|---|---|
| `page` | the page, from 1 on |
| `limit` | how many logs a page has, the `pageSize` of the config |
| `levels` | the levels to show, one value each |
| `applications` | the applications to show, one value each |
| `search` | what the user searches for, like in the message |

The `CrudController` of zibri doesn't filter by these, so write the endpoint in your zibri app. The `Log` of zibri names its `application` like the `LoggerService` does, the `name` of the application options, so the logs of the server and of every frontend are in one table:

```ts
// src/controllers/log.controller.ts
@Controller('/logs')
export class LogController {
    constructor(
        @InjectRepository(Log)
        private readonly logRepository: Repository<Log>
    ) {}

    @Response.paginated(Log)
    @Get()
    async findAll(
        @Param.query('page', { type: 'number', format: 'integer', min: 1 })
        page: number,
        @Param.query('limit', { type: 'number', format: 'integer', min: 1, max: 100 })
        limit: number,
        @Param.query('levels', { type: 'array', items: { type: 'number', format: 'integer' }, required: false })
        levels?: LogLevel[],
        @Param.query('applications', { type: 'array', items: { type: 'string' }, required: false })
        applications?: string[],
        @Param.query('search', { type: 'string', required: false })
        search?: string
    ): Promise<PaginationResult<Log>> {
        return await this.logRepository.findAllPaginated(page, limit, {
            where: {
                ...levels ? { level: levels } : {},
                ...applications ? { application: applications } : {},
                ...search ? { message: { iLike: `%${search}%` } } : {}
            },
            order: { createdAt: 'DESC' }
        });
    }
}
```

## Configuration
`provideLogHistoryConfig` sets the defaults for the whole app, or for a part of it when you add it to the providers of a component. Values you leave out keep the defaults of the parent, labels included:

```ts
provideLogHistoryConfig({ pageSize: 25, labels: { levels: { [LogLevel.WARN]: 'Warnung' }, search: 'Suche' } })
```

| Option | Default |
|---|---|
| `dateFormat` | `'yyyy-MM-dd HH:mm:ss.SSS'` — in the format of Angular's `DatePipe` |
| `pageSize` | `10` — how many logs a page has, which zibri allows up to 100 of by default |
| `levels` | every level but `LogLevel.DEBUG` — the levels whose logs show at first |
| `liveModeInterval` | `1000` — how often live mode loads the page, in milliseconds |
| `labels` | the English texts of the component, to translate them |

The buttons of the pages are the pagination of `@service-soft/ui`, whose names `providePaginationConfig` translates.

### Translating
The default texts are `$localize` with an id of their own, like `@@ngx-persistence-logger.log-history.search`, so `ng extract-i18n` puts them into the messages of your app, and you translate them like its own texts. The log history needs `@angular/localize` for that, `ng add @angular/localize`, also in an app of one language. A build with `localize` fills the texts in, so no part of `@angular/localize` reaches the browser. The defaults are made once a config is injected, so translations an app loads at runtime with `loadTranslations` apply as well. A text of `provideLogHistoryConfig` replaces the default in every language. So translate a default in your messages, and change it in the config only to say something else: a default the config replaces stays in your messages, though nothing shows it.

# Moving from the old ngx-persistence-logger
- The package is `@service-soft/ngx-persistence-logger`. Import the logger from `/logger` and the log history from `/log-history`.
- `BaseLoggerService` is `LoggerService`, which you inject without extending it. `LOG_URL` and `APPLICATION_NAME` are `logUrl` and `application` of `provideLoggerConfig`, and the `NGX_LOGGER_SERVICE` token is gone.
- The methods are the ones of the logger of zibri, and each is a single call: `logger.info('Saved', { orderId })` instead of `logger.info('Saved', order)()`. A message comes first, then an object of metadata, instead of any number of values.
- `fatal` is `critical`, and the levels are numbers, `LogLevel.DEBUG` (0) to `LogLevel.CRITICAL` (4), like the ones of zibri.
- `error` and `critical` take any value as the error, like the one a `catch` gets, not only an `Error`. The console no longer prints a timestamp in front of each log.
- A log is sent like a log of zibri: `message` and `context` with the `origin`, the `metadata` and the `error`, as `name`, `paragraphs` and `stackTrace`, instead of `data` and an error with `message` and `stack`.
- `GlobalErrorHandler` is `logErrorHandler()`, for `provideErrorHandler` of `@service-soft/ngx-error-handling`. Uncaught failed requests still aren't sent.
- `isLogLevelBiggerThan` is no longer exported.
- `<ngx-log-history [configuration]>` takes the inputs `logsBaseUrl` and `applications`, which was `availableApplications`. The labels and the date format are set with `provideLogHistoryConfig`. It no longer renders an `h1`, so write the heading that fits your page.
- The log history loads a page at a time, with the filters as query, instead of every log, so your endpoint filters and pages them, see [the endpoint of the logs](#the-endpoint-of-the-logs).
- The default date format shows the calendar year: the old `'YYYY'` showed the week-based year, which differs around new year.
- `Log` is a log of zibri: `createdAt` and `cleanupAt` are ISO strings, and `lifetime` and `userId` are gone.

# License
MIT. The icons are [Font Awesome Free](https://fontawesome.com) icons, licensed under CC BY 4.0.
