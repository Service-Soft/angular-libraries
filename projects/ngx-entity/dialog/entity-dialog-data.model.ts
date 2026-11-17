import { EntityService } from '@service-soft/ngx-entity/service';

/**
 * What the dialog that creates or edits an entity gets. Internal to the dialogs.
 */
export type EntityDialogData<T extends object> = {
    /**
     * The service that saves the entity.
     */
    service: EntityService<T>,
    /**
     * The entity to edit, undefined to create one.
     */
    entity: T | undefined,
    /**
     * The heading of the dialog, the one of the editor by default.
     */
    title: string | undefined,
    /**
     * The values a new entity starts with, on top of the defaults of its properties.
     */
    createValues: Partial<T>
};