import { inject, Injectable } from '@angular/core';
import { EntityService } from '@service-soft/ngx-entity/service';
import { ConfirmDialogComponent, ConfirmDialogData, DialogService } from '@service-soft/ui/dialog';

import { EntityDialogConfig } from './entity-dialog-config.model';
import { ENTITY_DIALOG_CONFIG } from './entity-dialog-config.provider';
import { EntityDialogCreateOptions } from './entity-dialog-create-options.model';
import { EntityDialogData } from './entity-dialog-data.model';
import { EntityDialogOptions } from './entity-dialog-options.model';
import { EntityDialogComponent } from './entity-dialog.component';

/**
 * Creates, edits and deletes entities in dialogs: a form that saves with the service of the entity, and a question
 * before deleting one.
 */
@Injectable({ providedIn: 'root' })
export class EntityDialogService {
    private readonly dialogService: DialogService = inject(DialogService);

    private readonly config: EntityDialogConfig = inject(ENTITY_DIALOG_CONFIG);

    /**
     * Opens the form of a new entity, which the service creates when the user saves.
     * @param service - The service of the entity.
     * @param options - The heading, instead of the createTitle of provideEntityFormConfig, and the values it starts with.
     * @returns The entity the server created, or undefined when the user closed the dialog without saving.
     */
    async create<T extends object>(service: EntityService<T>, options: EntityDialogCreateOptions<T> = {}): Promise<T | undefined> {
        return await this.openForm(service, undefined, options.title, options.values ?? {});
    }

    /**
     * Opens the form of an entity, which the service saves when the user saves, with the values that changed.
     * @param service - The service of the entity.
     * @param entity - The entity.
     * @param options - The heading, instead of the editTitle of provideEntityFormConfig.
     * @returns The entity as the server saved it, or undefined when the user closed the dialog without saving.
     */
    async edit<T extends object>(service: EntityService<T>, entity: T, options: EntityDialogOptions = {}): Promise<T | undefined> {
        return await this.openForm(service, entity, options.title, {});
    }

    /**
     * Asks whether to delete an entity, and deletes it with the service when the user confirms.
     * @param service - The service of the entity.
     * @param entity - The entity.
     * @param options - The question, instead of the deleteTitle of the config.
     * @returns Whether it was deleted.
     */
    async delete<T extends object>(service: EntityService<T>, entity: T, options: EntityDialogOptions = {}): Promise<boolean> {
        const data: ConfirmDialogData = {
            title: options.title ?? this.config.deleteTitle,
            paragraphs: this.config.deleteParagraphs,
            confirmButtonLabel: this.config.deleteLabel,
            cancelButtonLabel: this.config.keepLabel,
            confirmButtonColor: 'error'
        };
        if (await this.dialogService.open<boolean>(ConfirmDialogComponent, data).closed !== true) {
            return false;
        }
        await service.delete(entity);
        return true;
    }

    // escape doesn't close it: the cancel button asks before the changes are lost.
    private async openForm<T extends object>(
        service: EntityService<T>,
        entity: T | undefined,
        title: string | undefined,
        createValues: Partial<T>
    ): Promise<T | undefined> {
        const data: EntityDialogData<T> = { service, entity, title, createValues };
        return await this.dialogService.open<T>(EntityDialogComponent, data, { closeOnEscape: false, size: 'lg' }).closed;
    }
}