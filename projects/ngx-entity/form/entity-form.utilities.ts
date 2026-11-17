import { EntityClass, EntityProperty, EntityUtilities } from '@service-soft/ngx-entity/entity';

import { LARGE_WIDTH_CLASSES, MEDIUM_WIDTH_CLASSES, SMALL_WIDTH_CLASSES } from './entity-form-classes';
import { EntityFormField, EntityFormRow, EntityFormTab } from './entity-form-layout.model';
import { EntityFormMode } from './entity-form-mode.type';

// what has no position comes after what has one.
const AFTER_POSITIONED: number = Number.POSITIVE_INFINITY;

/**
 * What the fields of a group of properties are laid out with: the entity, or an object in it.
 */
type LayoutContext<T> = {
    /**
     * Whether the form creates an entity or edits one.
     */
    mode: EntityFormMode,
    /**
     * The values the conditions of the properties get.
     */
    values: Partial<T>,
    /**
     * The path of the object, undefined for the entity itself.
     */
    path: string | undefined,
    /**
     * Whether the fields are optional, as those of an object that isn't required and is empty.
     */
    optional: boolean
};

/**
 * Lays out the fields of an entity form.
 */
export abstract class EntityFormUtilities {
    /**
     * Resolves the tabs of a form, their rows and the fields in them, from the positions of the properties. A property
     * without a tab is on the first, the properties without a row share one after the others, and the ones without an
     * order come last in their row; otherwise they keep the order of the class. A property the form doesn't display,
     * or leaves out when creating or editing, is left out. An inline object gets the rows of the properties of its
     * class, laid out the same way, whose values are at the path of the object.
     * @param properties - The properties of the entity.
     * @param mode - Whether the form creates an entity or edits one.
     * @param values - The values of the form, which conditions depend on.
     * @param tabLabel - The label of a tab none of whose properties names it.
     * @returns The tabs, in order.
     */
    static resolveTabs<T>(
        properties: EntityProperty<T>[],
        mode: EntityFormMode,
        values: Partial<T>,
        tabLabel: (tab: number) => string
    ): EntityFormTab<T>[] {
        const shown: EntityProperty<T>[] = this.resolveShown(properties, mode, values);
        return this.resolveGroups(shown, property => property.metadata.position.tab ?? 1).map(([tab, inTab]) => ({
            tab,
            label: inTab.find(property => property.metadata.position.tabName != undefined)?.metadata.position.tabName ?? tabLabel(tab),
            rows: this.resolveRows(inTab, { mode, values, path: undefined, optional: false })
        }));
    }

    private static resolveShown<T>(properties: EntityProperty<T>[], mode: EntityFormMode, values: Partial<T>): EntityProperty<T>[] {
        // the field of a relation edits its joinColumn, which needs no field of its own.
        const joinColumns: Set<string> = new Set(properties.flatMap(({ metadata }) => {
            return EntityUtilities.isToOneRelation(metadata) ? [metadata.joinColumn] : [];
        }));
        return properties.filter(property => {
            const omitted: boolean = mode === 'create' ? property.metadata.omitForCreate : property.metadata.omitForUpdate;
            return !joinColumns.has(property.key) && !omitted && EntityUtilities.resolveCondition(property.metadata.display, values);
        });
    }

    private static resolveRows<T>(properties: EntityProperty<T>[], context: LayoutContext<T>): EntityFormRow<T>[] {
        return this.resolveGroups(properties, property => property.metadata.position.row ?? AFTER_POSITIONED).map(([row, inRow]) => ({
            key: row === AFTER_POSITIONED ? 'rest' : String(row),
            fields: [...inRow]
                .sort((a, b) => (a.metadata.position.order ?? AFTER_POSITIONED) - (b.metadata.position.order ?? AFTER_POSITIONED))
                .map(property => this.resolveField(property, context))
        }));
    }

    private static resolveField<T>(property: EntityProperty<T>, context: LayoutContext<T>): EntityFormField<T> {
        const { metadata } = property;
        const { mode, values, path, optional } = context;
        const [large, medium, small] = metadata.defaultWidths;
        const readonly: boolean = EntityUtilities.resolveCondition(metadata.readonly, values);
        // an entity that exists has a password already, which an empty field keeps.
        const keepsPassword: boolean = mode === 'update' && metadata.type === 'string' && metadata.password;
        // the user can't fill in what they can't change, like an id the server set.
        const required: boolean = !readonly && !keepsPassword && !optional && EntityUtilities.resolveCondition(metadata.required, values);
        const key: string = EntityUtilities.getValueKey(property);
        const valueKey: string = path == undefined ? key : `${path}.${key}`;
        const objectContext: LayoutContext<object> = { mode, values: {}, path: valueKey, optional: !required };
        return {
            property,
            valueKey,
            path,
            classes: `${SMALL_WIDTH_CLASSES[small]} ${MEDIUM_WIDTH_CLASSES[medium]} ${LARGE_WIDTH_CLASSES[large]}`,
            required,
            readonly,
            rows: metadata.type === 'object' && metadata.displayStyle === 'inline'
                ? this.resolveObjectRows(metadata.cls(), Reflect.get(values, property.key), objectContext)
                : undefined
        };
    }

    // the conditions of the properties of an object get the object, not the entity. Its fields are only optional while
    // the object is: until one of them has a value.
    private static resolveObjectRows(cls: EntityClass<object>, value: unknown, context: LayoutContext<object>): EntityFormRow<object>[] {
        const values: Partial<object> = typeof value === 'object' && value != undefined ? value : {};
        const properties: EntityProperty<object>[] = EntityUtilities.resolveProperties(cls);
        const optional: boolean = context.optional && EntityUtilities.isEmpty(values);
        return this.resolveRows(this.resolveShown(properties, context.mode, values), { ...context, values, optional });
    }

    // groups by a number, in its order, each group keeping the order of the properties. Sort is stable.
    private static resolveGroups<T>(
        properties: EntityProperty<T>[],
        groupOf: (property: EntityProperty<T>) => number
    ): [number, EntityProperty<T>[]][] {
        const groups: Map<number, EntityProperty<T>[]> = new Map();
        for (const property of properties) {
            const group: number = groupOf(property);
            groups.set(group, [...groups.get(group) ?? [], property]);
        }
        return [...groups].sort(([a], [b]) => a - b);
    }
}