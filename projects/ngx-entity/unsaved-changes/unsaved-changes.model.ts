/**
 * A component that can have changes the user didn't save yet, like a form, which unsavedChangesGuard asks about before
 * the user leaves it.
 */
export type UnsavedChanges = {
    /**
     * Whether the user changed something they didn't save.
     */
    hasUnsavedChanges: () => boolean
};