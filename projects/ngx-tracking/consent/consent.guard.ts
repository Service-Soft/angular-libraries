import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';

import { ConsentService } from './consent.service';

/**
 * Asks the user which trackings they allow, unless they did already, when they open a route. Never blocks the
 * navigation: the page loads behind the dialog.
 * @returns Always true.
 */
export const consentGuard: CanActivateFn = () => {
    void inject(ConsentService).requestChoices();
    return true;
};