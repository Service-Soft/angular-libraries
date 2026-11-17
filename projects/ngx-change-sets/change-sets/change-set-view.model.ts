import { IconDefinition } from '@service-soft/ui/icon';
import { ChangeSet } from 'zibri-contract';

import { ChangeView } from './change-view.model';

/**
 * A change set as the change sets component shows it.
 */
export type ChangeSetView = {
    /**
     * The change set, which its actions are for.
     */
    changeSet: ChangeSet,
    /**
     * What happened, like 'Updated'.
     */
    typeLabel: string,
    /**
     * The colors of the type.
     */
    typeClasses: string,
    /**
     * The icon of the type.
     */
    typeIcon: IconDefinition,
    /**
     * When it happened, formatted.
     */
    createdAt: string,
    /**
     * Who made it, undefined when it isn't shown.
     */
    createdByName: string | undefined,
    /**
     * Whether it can be reset on its own. Resetting the creation would leave a change set without an entity.
     */
    canReset: boolean,
    /**
     * Whether the entity can be rolled back to it. Rolling back to the newest one would change nothing.
     */
    canRollback: boolean,
    /**
     * The values that changed.
     */
    changes: ChangeView[]
};