import { Type } from '@angular/core';

import { ConsentAskOn } from './consent-ask-on.type';
import { ConsentUi } from './consent-ui.service';
import { Tracking } from './tracking.model';

/**
 * Which trackings the user is asked about, and how.
 */
export type ConsentConfig = {
    /**
     * Every tracking of the app. Their services are created when the app starts, so they track from the first
     * navigation on.
     */
    trackings: Tracking[],
    /**
     * Loads what the user sees of the consent, with a dynamic import(), so it is only loaded when it shows. Like
     * `() => import('@service-soft/ngx-tracking/consent-dialog').then(m => m.ConsentDialogUi)`.
     */
    ui: () => Promise<Type<ConsentUi>>,
    /**
     * How long the choices of the user are kept before they are asked again, in milliseconds.
     */
    choicesDuration: number,
    /**
     * Whether a browser that sends Global Privacy Control or Do Not Track is treated like a user who only allowed what
     * is technically necessary, without asking.
     */
    respectDoNotTrack: boolean,
    /**
     * When the user is asked, unless they chose already: at the first navigation, or at their first interaction with
     * the page, which keeps the dialog out of how fast the page loads. Undefined asks only where the consentGuard is.
     */
    askOn: ConsentAskOn | undefined
};