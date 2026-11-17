import { EntityDialogOptions } from './entity-dialog-options.model';

/**
 * What the dialog that creates an entity says, and the values the entity starts with.
 */
export type EntityDialogCreateOptions<T> = EntityDialogOptions & {
    /**
     * The values the new entity starts with, on top of the defaults of its properties, like the joinColumn of the
     * entity it belongs to.
     */
    values?: Partial<T>
};