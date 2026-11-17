import { ConfirmDialogData } from '@service-soft/ui/dialog';
import { ChangeSetType } from 'zibri-contract';

/**
 * The texts the change sets show, to translate them.
 */
export type ChangeSetsLabels = {
    /**
     * What each type of change set is called, like 'Created' for create.
     */
    types: Record<ChangeSetType, string>,
    /**
     * The button that opens the menu to undo changes.
     */
    reset: string,
    /**
     * The menu item that undoes one change set and keeps the ones after it.
     */
    resetChangeSet: string,
    /**
     * The menu item that undoes every change set after this one.
     */
    rollbackToChangeSet: string,
    /**
     * The column of the names of the changed values.
     */
    key: string,
    /**
     * The column of the values before the change.
     */
    previousValue: string,
    /**
     * The column of the values after the change.
     */
    newValue: string,
    /**
     * The button that shows more change sets.
     */
    showMore: string,
    /**
     * What screen readers read before the date of a change set.
     */
    createdAt: string,
    /**
     * What screen readers read before the name of who made a change set.
     */
    createdBy: string
};

/**
 * The values the change sets use when their inputs are not set.
 */
export type ChangeSetsConfig = {
    /**
     * How the date of a change set is shown, in the format of Angular's DatePipe.
     */
    dateFormat: string,
    /**
     * How dates among the changed values are shown, in the format of Angular's DatePipe.
     */
    valueDateFormat: string,
    /**
     * How many change sets show at first, and how many more each click on "show more" adds.
     */
    pageSize: number,
    /**
     * Whether the user can undo change sets.
     */
    canResetAndRollback: boolean,
    /**
     * Whether the name of who made a change set opens it, with openCreatedBy of the ChangeSetService.
     */
    canOpenCreatedBy: boolean,
    /**
     * Whether change sets without createdBy show a name too, the one resolveCreatedByName returns, like 'System'.
     */
    showEmptyCreatedBy: boolean,
    /**
     * The texts the change sets show.
     */
    labels: ChangeSetsLabels,
    /**
     * The question before undoing a single change set.
     */
    resetConfirmDialogData: ConfirmDialogData,
    /**
     * The question before undoing every change set after one.
     */
    rollbackConfirmDialogData: ConfirmDialogData
};