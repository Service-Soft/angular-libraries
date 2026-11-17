import { Component, computed, ElementRef, inject, LOCALE_ID, Signal, Type, viewChild } from '@angular/core';
import { EntityProperty, EntityTextUtilities, EntityUtilities, ObjectArrayItemMetadata, PropertyMetadata } from '@service-soft/ngx-entity/entity';
import { BaseEntityFieldDirective, ENTITY_ARRAY_FIELD_CONFIG, ENTITY_FORM_COMPONENT, EntityArrayFieldConfig } from '@service-soft/ngx-entity/field-base';
import { ButtonComponent } from '@service-soft/ui/button';
import { DialogService } from '@service-soft/ui/dialog';
import { INPUT_CONFIG, InputConfig } from '@service-soft/ui/input';
import { LocalTableColumn, LocalTableComponent } from '@service-soft/ui/local-table';
import { TableActionsComponent } from '@service-soft/ui/table';

import { EntityObjectArrayDialogData } from './entity-object-array-dialog-data.model';
import { EntityObjectArrayDialogComponent } from './entity-object-array-dialog.component';

let nextId: number = 0;

/**
 * The field of an array of objects, like the positions of an invoice: a table of them, each with buttons that edit and
 * remove it, and a button that adds one. Adding and editing happen in a dialog with the fields of the class of the
 * items. A required array needs an item. It is part of an entity form, which gives it the form of the dialog.
 */
@Component({
    selector: 'ngx-entity-object-array-field',
    templateUrl: './entity-object-array-field.component.html',
    imports: [LocalTableComponent, TableActionsComponent, ButtonComponent],
    host: { class: 'block' }
})
export class EntityObjectArrayFieldComponent<T extends object> extends BaseEntityFieldDirective<T, object[]> {
    private readonly form: Type<unknown> = inject(ENTITY_FORM_COMPONENT);

    private readonly dialogs: DialogService = inject(DialogService);

    private readonly locale: string = inject(LOCALE_ID);

    private readonly inputConfig: InputConfig = inject(INPUT_CONFIG);

    private readonly addButton: Signal<ElementRef<HTMLButtonElement>> = viewChild.required('addButton', { read: ElementRef });

    /**
     * The texts of the field.
     */
    protected readonly labels: EntityArrayFieldConfig = inject(ENTITY_ARRAY_FIELD_CONFIG);

    /**
     * The id of the error.
     */
    protected readonly errorId: string = `ngx-entity-object-array-${nextId++}-error`;

    /**
     * What the items of the array say about themselves.
     */
    protected readonly items: Signal<ObjectArrayItemMetadata> = computed(() => {
        const metadata: PropertyMetadata<T> = this.property().metadata;
        if (metadata.type !== 'array' || metadata.items.type !== 'object') {
            throw this.resolveKindError('array');
        }
        return metadata.items;
    });

    /**
     * The items.
     */
    protected readonly rows: Signal<object[]> = computed(() => this.value() ?? []);

    /**
     * The columns of the table: the properties the items name, else every one the form displays.
     */
    protected readonly columns: Signal<LocalTableColumn<object>[]> = computed(() => {
        const items: ObjectArrayItemMetadata = this.items();
        const properties: EntityProperty<object>[] = EntityUtilities.resolveProperties(items.cls());
        const shown: EntityProperty<object>[] = items.columns == undefined
            ? properties.filter(({ metadata }) => metadata.display !== false && metadata.type !== 'oneToMany')
            : items.columns.flatMap(key => properties.filter(property => property.key === key));
        return shown.map(({ key, metadata }) => ({
            key,
            label: metadata.displayName,
            value: row => EntityTextUtilities.resolveText(metadata, Reflect.get(row, key), row, this.labels, this.locale),
            align: metadata.type === 'number' && metadata.enum == undefined ? 'end' : 'start'
        }));
    });

    /**
     * The error of a required array without an item, else the problem of the server.
     */
    protected readonly error: Signal<string | undefined> = computed(() => {
        if (!this.showError()) {
            return undefined;
        }
        return this.required() && this.rows().length === 0 ? this.inputConfig.errorMessages.valueMissing : this.problem();
    });

    /**
     * Moves the focus the form gives the input the browser checks to the button that adds an item.
     */
    protected focusAddButton(): void {
        this.addButton().nativeElement.focus();
    }

    /**
     * Shows the error once the form was submitted, instead of the popup of the browser.
     * @param event - The invalid event of the input the browser checks.
     */
    protected showInvalid(event: Event): void {
        event.preventDefault();
        this.showError.set(true);
    }

    /**
     * Adds an item, with the defaults of its class, once the dialog closes with it.
     */
    protected async add(): Promise<void> {
        const defaults: Partial<object> = EntityUtilities.resolveDefaults(this.items().cls());
        const item: object | undefined = await this.openDialog(this.labels.addTitle(this.label()), 'create', defaults);
        if (item != undefined) {
            this.value.set([...this.rows(), item]);
        }
    }

    /**
     * Edits an item, in place, once the dialog closes with it.
     * @param item - The item.
     */
    protected async edit(item: object): Promise<void> {
        const edited: object | undefined = await this.openDialog(this.labels.editTitle(this.label()), 'update', { ...item });
        if (edited != undefined) {
            this.value.set(this.rows().map(candidate => candidate === item ? edited : candidate));
        }
    }

    /**
     * Removes an item.
     * @param item - The item.
     */
    protected remove(item: object): void {
        this.value.set(this.rows().filter(candidate => candidate !== item));
        this.showError.set(true);
    }

    /**
     * Resolves the name of a button of an item, with its first value.
     * @param action - The text of the button.
     * @param item - The item.
     * @returns The name.
     */
    protected resolveActionLabel(action: string, item: object): string {
        const first: LocalTableColumn<object> | undefined = this.columns()[0];
        return first == undefined ? action : `${action} ${first.value(item)}`;
    }

    private async openDialog(
        title: string,
        mode: EntityObjectArrayDialogData['mode'],
        value: Partial<object>
    ): Promise<object | undefined> {
        const data: EntityObjectArrayDialogData = {
            title,
            form: this.form,
            cls: this.items().cls(),
            mode,
            value,
            saveLabel: this.labels.saveLabel,
            cancelLabel: this.labels.cancelLabel
        };
        return await this.dialogs.open<object>(EntityObjectArrayDialogComponent, data, { closeOnEscape: true, size: 'lg' }).closed;
    }
}