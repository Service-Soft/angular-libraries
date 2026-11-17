import { Component } from '@angular/core';

/**
 * The actions of a ui-pricing-card, like a link to sign up for the plan. Put it inside of the card, and it shows at its
 * bottom, at the same height in every card of a row, with its buttons over the full width of the card.
 */
@Component({
    selector: 'ui-pricing-card-actions',
    templateUrl: './pricing-card-actions.component.html',
    host: { class: 'flex flex-col gap-2' }
})
export class PricingCardActionsComponent {}