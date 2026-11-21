import { inject, InjectionToken, Provider } from '@angular/core';
import { ChangeSetType } from 'zibri-contract';

import { ChangeSetsConfigChanges } from './change-sets-config-changes.model';
import { ChangeSetsConfig } from './change-sets-config.model';

/**
 * The values of the change sets when nothing changes them. Their texts are $localize, which an app translates like its
 * own, and resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultChangeSetsConfig(): ChangeSetsConfig {
    return {
        dateFormat: 'dd.MM.yyyy HH:mm',
        valueDateFormat: 'dd.MM.yyyy HH:mm',
        pageSize: 10,
        canResetAndRollback: true,
        canOpenCreatedBy: true,
        showEmptyCreatedBy: false,
        labels: {
            types: {
                [ChangeSetType.CREATE]: $localize`:@@ngx-change-sets.change-sets.types.created:Created`,
                [ChangeSetType.REPLACE]: $localize`:@@ngx-change-sets.change-sets.types.replaced:Replaced`,
                [ChangeSetType.RESET]: $localize`:@@ngx-change-sets.change-sets.types.reset:Reset`,
                [ChangeSetType.UPDATE]: $localize`:@@ngx-change-sets.change-sets.types.updated:Updated`,
                [ChangeSetType.DELETE]: $localize`:@@ngx-change-sets.change-sets.types.deleted:Deleted`,
                [ChangeSetType.RESTORE]: $localize`:@@ngx-change-sets.change-sets.types.restored:Restored`
            },
            reset: $localize`:@@ngx-change-sets.change-sets.reset:Reset`,
            resetChangeSet: $localize`:@@ngx-change-sets.change-sets.resetChangeSet:This change set`,
            rollbackToChangeSet: $localize`:@@ngx-change-sets.change-sets.rollbackToChangeSet:Rollback all to this state`,
            key: $localize`:@@ngx-change-sets.change-sets.key:Property`,
            previousValue: $localize`:@@ngx-change-sets.change-sets.previousValue:Previous value`,
            newValue: $localize`:@@ngx-change-sets.change-sets.newValue:New value`,
            showMore: $localize`:@@ngx-change-sets.change-sets.showMore:Show more`,
            createdAt: $localize`:@@ngx-change-sets.change-sets.createdAt:Created at`,
            createdBy: $localize`:@@ngx-change-sets.change-sets.createdBy:Created by`
        },
        resetConfirmDialogData: {
            title: $localize`:@@ngx-change-sets.change-sets.resetConfirmDialogData.title:Reset this change set?`,
            paragraphs: [$localize`:@@ngx-change-sets.change-sets.resetConfirmDialogData.paragraphs:This deletes the change set and can't be undone. The change sets after it are kept.`],
            confirmButtonLabel: $localize`:@@ngx-change-sets.change-sets.resetConfirmDialogData.confirmButtonLabel:Reset`,
            cancelButtonLabel: $localize`:@@ngx-change-sets.change-sets.resetConfirmDialogData.cancelButtonLabel:Cancel`,
            confirmButtonColor: 'error'
        },
        rollbackConfirmDialogData: {
            title: $localize`:@@ngx-change-sets.change-sets.rollbackConfirmDialogData.title:Rollback to the state after this change set?`,
            paragraphs: [$localize`:@@ngx-change-sets.change-sets.rollbackConfirmDialogData.paragraphs:This undoes and deletes every newer change set and can't be undone.`],
            confirmButtonLabel: $localize`:@@ngx-change-sets.change-sets.rollbackConfirmDialogData.confirmButtonLabel:Rollback`,
            cancelButtonLabel: $localize`:@@ngx-change-sets.change-sets.rollbackConfirmDialogData.cancelButtonLabel:Cancel`,
            confirmButtonColor: 'error'
        }
    };
}

/**
 * The values every change sets component below this injector uses when its inputs are not set.
 * Change them with provideChangeSetsConfig.
 */
export const CHANGE_SETS_CONFIG: InjectionToken<ChangeSetsConfig> = new InjectionToken<ChangeSetsConfig>('CHANGE_SETS_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultChangeSetsConfig()
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
            const parent: ChangeSetsConfig = inject(CHANGE_SETS_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultChangeSetsConfig();
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