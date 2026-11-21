# ngx-ecommerce
Components for shops and bookings in Angular: an input for the extras of a booking or order, like breakfast per day or a second bike, and a summary of an order with its discounts, taxes and total.

It is built on [@service-soft/ui](https://www.npmjs.com/package/@service-soft/ui) and styled with Tailwind CSS. Amounts are written with `Intl` in the language of the app, and the components work with server-side rendering.

# Table of Contents
- [ngx-ecommerce](#ngx-ecommerce)
- [Table of Contents](#table-of-contents)
- [Requirements](#requirements)
- [Amounts of money](#amounts-of-money)
- [Input extras](#input-extras)
- [Order summary](#order-summary)
  - [How it calculates](#how-it-calculates)
- [Translating](#translating)
- [License](#license)

# Requirements
Angular 22 with `@angular/localize`, which [translates the texts](#translating), and Tailwind CSS 4.

```sh
npm install @service-soft/ngx-ecommerce @service-soft/ui
ng add @angular/localize
```

```css
@import "tailwindcss";
@import "@service-soft/ui";
@import "@service-soft/ngx-ecommerce";
```

Each component is in its own entry point, so only the ones you import end up in your bundle.

# Amounts of money
Every amount is an integer in the minor unit of its currency, like cents: `1999` is 19.99 €, and 1999 yen are `1999`. Integers add up exactly, which decimal fractions in floating point numbers don't, so sums and taxes match what your backend charges.

The currency is the ISO 4217 code of the `currency` input of each component. Its default is the currency of the prices of ui, `'EUR'`, so one setting changes it for every price of the app. Change it for the whole app, or for a part of it, with `providePriceConfig` of `@service-soft/ui/price`:

```ts
providers: [
    { provide: LOCALE_ID, useValue: 'de' },
    providePriceConfig({ currency: 'CHF' })
]
```

Amounts are written in the language of the app (`LOCALE_ID`), with as many digits as the currency has, like `19,99 €` in German or `¥1,999`. `MoneyUtilities` of `@service-soft/ngx-ecommerce/money` does the same for your own templates: `format(amount, currency, locale)` writes an amount of minor units, and `round(amount)` rounds to a whole minor unit, half away from zero.

# Input extras
An input for the extras of a booking or order, like breakfast, a parking space or bikes. Each extra is a card with its title, description, picture or icon, and its price with what it is for. An extra is either on or off, with a checkbox or a switch, or has a quantity, with buttons that add and remove one:

```ts
import { ExtraOption, InputExtrasComponent, SelectedExtra } from '@service-soft/ngx-ecommerce/input-extras';

protected readonly extras: ExtraOption[] = [
    { id: 'breakfast', label: 'Breakfast', description: 'Buffet, 7 to 10', icon: faMugHot, price: 1500, unit: 'perDay', type: 'toggle' },
    { id: 'cleaning', label: 'Final cleaning', price: 4500, unit: 'once', type: 'toggle' },
    { id: 'bike', label: 'Bike', image: { url: '/bike.jpg', width: 640, height: 480 }, price: 1200, unit: 'perDay', type: 'quantity', max: 4 }
];
protected readonly chosen: WritableSignal<SelectedExtra[]> = signal([]);
```

```html
<ngx-input-extras label="Extras" hint="For your stay of 3 nights" showTotal [days]="3" [options]="extras" [(value)]="chosen" />
```

The value lists the chosen extras with their quantities, like `[{ id: 'breakfast', quantity: 1 }, { id: 'bike', quantity: 2 }]`, in the order of the options; a toggle has the quantity 1.

| Option | Values | Default |
|---|---|---|
| `id` | `string` | — required, identifies it in the value |
| `label` | `string` | — required, the title, which names its checkbox or quantity |
| `description` | `string` | — below the title |
| `image` | `{ url, width, height, alt? }` | — a picture in front of the title, drawn with `NgOptimizedImage`, like the cards of ui's Input cards |
| `icon` | `IconDefinition` | — an icon in front of the title, like `faMugHot` of `@fortawesome/free-solid-svg-icons` |
| `price` | `number` | — required, in the minor unit |
| `unit` | `'once'` \| `'perItem'` \| `'perDay'` | — required, what the price is for: once, each one, or each one per day of the booking |
| `type` | `'toggle'` \| `'quantity'` | — required, on or off, or how many |
| `min`, `max` | `number` | `1` and unlimited — the quantities allowed once it is chosen, which the browser checks. 0 is always allowed and means it isn't chosen: + on 0 takes the min, − on the min goes back to 0 |
| `disabled` | `boolean` | `false` — it can't be changed, like when it is sold out |

| Input | Values | Default |
|---|---|---|
| `options` | `ExtraOption[]` | — required |
| `value` | `SelectedExtra[]` | `[]` — bind it with `[(value)]` |
| `days` | `number` | `1` — the days of the booking, which a price `perDay` is multiplied with in the total |
| `showTotal` | `boolean` | `showTotal` of `provideInputExtrasConfig`, `false` — the sum of the chosen extras below them, which screen readers announce as it changes |
| `appearance` | `'checkbox'` \| `'switch'` | `appearance` of `provideInputExtrasConfig`, `'checkbox'` — of the extras that are on or off |
| `color` | `neutral`, `primary`, `secondary`, `success` | `color` of `provideInputConfig`, `primary` — the border of a chosen card and its checkbox or switch |
| `size` | `sm`, `md`, `lg` | `md` — the height of the number inputs and their buttons |
| `required` | `boolean` | `false` — whether at least one extra has to be chosen |
| `currency` | `string` | `currency` of `providePriceConfig` of ui, `'EUR'` |

`label`, `hint`, `customValidation`, `disabled`, `readonly`, `name`, `inputId` and `showValidationError` are the same as for the inputs of ui. The cards are inside a fieldset whose legend is the label. A toggle is a label around a native checkbox, so a click anywhere on its card switches it, and a quantity is a native number input, which the browser checks with the `min` and `max` of the extra: a form only submits when every quantity is allowed, and the error shows at its card. A chosen card has its border in the color, besides the checked box, the moved thumb of the switch or its quantity, so the color is never the only cue.

Change the texts, like the units after a price, with `provideInputExtrasConfig`: `provideInputExtrasConfig({ labels: { units: { once: 'einmalig', perItem: 'pro Stück', perDay: 'pro Tag' }, decrease: 'Eins weniger', increase: 'Eins mehr', total: 'Extras' } })`. The names of the buttons are read with the title of the extra, like 'Add one: Bike'. The corners of the cards are the token `--radius-input-card`, which they share with the cards of ui.

# Order summary
The items of an order with their quantities and totals, and below them the subtotal, discounts, taxes and the total, like in a checkout or on a confirmation page:

```ts
import { OrderSummaryComponent, OrderSummaryDiscount, OrderSummaryItem } from '@service-soft/ngx-ecommerce/order-summary';

protected readonly items: OrderSummaryItem[] = [
    { label: 'Double room', description: 'Fri, 12 Jun – Sun, 14 Jun', quantity: 2, unitPrice: 8900, taxRate: 7 },
    { label: 'Breakfast', quantity: 2, unitPrice: 3000, taxRate: 19 }
];
protected readonly discounts: OrderSummaryDiscount[] = [{ label: 'Voucher SUMMER', type: 'amount', value: 500 }];
```

```html
<ui-card>
    <h2 class="mb-4 font-heading text-title">Your booking</h2>
    <ngx-order-summary [items]="items" [discounts]="discounts" />
</ui-card>
```

| Input | Values | Default |
|---|---|---|
| `items` | `OrderSummaryItem[]` | — required: `label`, `quantity`, `unitPrice` in the minor unit, and optionally a `description` and a `taxRate` in percent |
| `discounts` | `OrderSummaryDiscount[]` | `[]` — on the whole order: `label`, `type` `'amount'` or `'percentage'` of the subtotal, and its `value` |
| `variant` | `'compact'` \| `'detailed'` | `'compact'` — compact, each item with its quantity and total, like in the sidebar of a checkout; detailed, a column each for the quantity and the unit price, the descriptions and the net total |
| `taxMode` | `'gross'` \| `'net'` | `'gross'` — gross prices include the tax, which shows below the total as what they include; net prices get it added before the total |
| `taxRate` | `number` | — the rate in percent of items without their own, like `19`; without either, an item isn't taxed |
| `currency` | `string` | `currency` of `providePriceConfig` of ui, `'EUR'` |

It is a native table: screen readers read every amount with the heading of its column and its row, and the compact variant keeps the headings of its columns for them. Put a heading of your own above it, in the level that fits the page; the caption names the table for screen readers. The subtotal only shows when discounts or added taxes make the total differ from it. Discounts are shown with a minus, and the total by its weight and a line above it. A detailed summary scrolls instead of overflowing when it doesn't fit a narrow screen.

Change the defaults and the texts with `provideOrderSummaryConfig`, like `provideOrderSummaryConfig({ taxRate: 19, labels: { caption: 'Bestellübersicht', item: 'Artikel', quantity: 'Menge', unitPrice: 'Einzelpreis', amount: 'Betrag', subtotal: 'Zwischensumme', netTotal: 'Netto', tax: 'MwSt.', includedTax: 'enthaltene MwSt.', total: 'Gesamt' } })`. A tax row is its label followed by the rate, like `MwSt. 19 %`.

## How it calculates
`OrderSummaryUtilities.calculateTotals(items, discounts, taxMode, taxRate)` calculates what the summary shows, so you can use the same numbers elsewhere, like to check them against your backend:

- Each line is its quantity times its unit price. A quantity can have a fraction, like 1.5 hours; the line is then rounded.
- A percentage discount is taken of the subtotal, every one of the same. Discounts reduce every tax rate by its share of the subtotal, split so that the shares add up to exactly the discount.
- The tax is calculated once per rate, from the sum of its items after discounts, like on an invoice, not per line. Gross amounts include `amount × rate / (100 + rate)`, net amounts get `amount × rate / 100` added.
- Every step is rounded to a whole minor unit, half away from zero, like commercial rounding.

A backend that calculates differently, like the tax per line, can end up a cent apart from the summary, so calculate it the same way there.

# Translating
The default texts are `$localize` with an id of their own, like `@@ngx-ecommerce.order-summary.total`, so `ng extract-i18n` puts them into the messages of your app, and you translate them like its own texts. The library needs `@angular/localize` for that, `ng add @angular/localize`, also in an app of one language. A build with `localize` fills the texts in, so no part of `@angular/localize` reaches the browser. The defaults are made once a config is injected, so translations an app loads at runtime with `loadTranslations` apply as well. A text of `provideInputExtrasConfig` or `provideOrderSummaryConfig` replaces the default in every language. So translate a default in your messages, and change it in the config only to say something else: a default the config replaces stays in your messages, though nothing shows it.

# License
MIT.