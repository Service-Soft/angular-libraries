import { Component } from '@angular/core';

/**
 * More actions of a ui-person-card, after its phone and email buttons, like a link to book an appointment or to a chat
 * on WhatsApp, with an icon of your own: `<ui-person-card-actions><a ui-button href="/booking">Book</a></ui-person-card-actions>`.
 * LinkUtilities.resolveWhatsAppHref of '@service-soft/ui/link' resolves the href of a chat.
 */
@Component({
    selector: 'ui-person-card-actions',
    templateUrl: './person-card-actions.component.html',
    host: {
        // its content sits in the row of the other buttons of the card, which wraps them all alike
        class: 'contents'
    }
})
export class PersonCardActionsComponent {}