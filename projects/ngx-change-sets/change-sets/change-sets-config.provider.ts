import { inject, InjectionToken, Provider } from '@angular/core';
import { ChangeSetType } from 'zibri-contract';

import { ChangeSetsConfigChanges } from './change-sets-config-changes.model';
import { ChangeSetsConfig } from './change-sets-config.model';

const DEFAULT_CHANGE_SETS_CONFIG: ChangeSetsConfig = {
    dateFormat: 'dd.MM.yyyy HH:mm',
    valueDateFormat: 'dd.MM.yyyy HH:mm',
    pageSize: 10,
    canResetAndRollback: true,
    canOpenCreatedBy: true,
    showEmptyCreatedBy: false,
    labels: {
        types: {
            [ChangeSetType.CREATE]: 'Created',
            [ChangeSetType.REPLACE]: 'Replaced',
            [ChangeSetType.RESET]: 'Reset',
            [ChangeSetType.UPDATE]: 'Updated',
            [ChangeSetType.DELETE]: 'Deleted',
            [ChangeSetType.RESTORE]: 'Restored'
        },
        reset: 'Reset',
        resetChangeSet: 'This change set',
        rollbackToChangeSet: 'Rollback all to this state',
        key: 'Property',
        previousValue: 'Previous value',
        newValue: 'New value',
        showMore: 'Show more',
        createdAt: 'Created at',
        createdBy: 'Created by'
    },
    resetConfirmDialogData: {
        title: 'Reset this change set?',
        paragraphs: ['This deletes the change set and can\'t be undone. The change sets after it are kept.'],
        confirmButtonLabel: 'Reset',
        cancelButtonLabel: 'Cancel',
        confirmButtonColor: 'error'
    },
    rollbackConfirmDialogData: {
        title: 'Rollback to the state after this change set?',
        paragraphs: ['This undoes and deletes every newer change set and can\'t be undone.'],
        confirmButtonLabel: 'Rollback',
        cancelButtonLabel: 'Cancel',
        confirmButtonColor: 'error'
    }
};

/**
 * The values every change sets component below this injector uses when its inputs are not set.
 * Change them with provideChangeSetsConfig.
 */
export const CHANGE_SETS_CONFIG: InjectionToken<ChangeSetsConfig> = new InjectionToken<ChangeSetsConfig>('CHANGE_SETS_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_CHANGE_SETS_CONFIG
});

/**
 * Changes the values the change sets use when their inputs are not set, like the labels to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector, including single labels and texts of the dialogs.
 * @param config - The values to change.
 * @returns The provider for CHANGE_SETS_CONFIG.
 */
export function provideChangeSetsConfig(config: ChangeSetsConfigChanges): Provider {
    return {
        provide: CHANGE_SETS_CONFIG,
        useFactory: (): ChangeSetsConfig => {
            const parent: ChangeSetsConfig = inject(CHANGE_SETS_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_CHANGE_SETS_CONFIG;
            return {
                ...parent,
                ...config,
                labels: {
                    ...parent.labels,
                    ...config.labels,
                    types: { ...parent.labels.types, ...config.labels?.types }
                },
                resetConfirmDialogData: { ...parent.resetConfirmDialogData, ...config.resetConfirmDialogData },
                rollbackConfirmDialogData: { ...parent.rollbackConfirmDialogData, ...config.rollbackConfirmDialogData }
            };
        }
    };
}