import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';

import { UnsavedChanges } from './unsaved-changes.model';
import { UnsavedChangesService } from './unsaved-changes.service';

/**
 * Asks before the user leaves the component of a route that has changes they didn't save, and stays when they keep
 * them: `{ path: 'profile', component: ProfileComponent, canDeactivate: [unsavedChangesGuard] }`. The component
 * implements UnsavedChanges.
 * @param component - The component the user leaves.
 * @returns Whether the user may leave.
 */
export const unsavedChangesGuard: CanDeactivateFn<UnsavedChanges> = async component => {
    return !component.hasUnsavedChanges() || await inject(UnsavedChangesService).askToDiscard();
};