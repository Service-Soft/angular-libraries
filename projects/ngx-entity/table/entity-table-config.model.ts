import type { EntityExportFormat } from '@service-soft/ngx-entity/export';

/**
 * The texts of entity tables.
 */
export type EntityTableConfig = {
    /**
     * The text of a boolean that is true, and the option of its filter.
     */
    yesLabel: string,
    /**
     * The text of a boolean that is false, and the option of its filter.
     */
    noLabel: string,
    /**
     * The button above the table that creates an entity.
     */
    createLabel: string,
    /**
     * The button of a row that deletes its entity.
     */
    deleteLabel: string,
    /**
     * What the form of a new entity shows in place of the table of a relation to many others, which can only be added
     * once the entity is created.
     */
    createFirstLabel: string,
    /**
     * The button above the table that imports entities from a json file.
     */
    importLabel: string,
    /**
     * The buttons above the table that export the selected entities, by their format.
     */
    exportLabels: Record<EntityExportFormat, string>,
    /**
     * The name of an exported file, without its extension.
     */
    exportFileName: string,
    /**
     * What separates the fields of a row of an exported csv, like ';' for spreadsheets in languages with a decimal comma.
     */
    csvSeparator: string
};