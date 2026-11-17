/**
 * The kinds of fields of an entity form, each shown by a component of its own: a string on one line, a password, a
 * longer text, a string that suggests its options, a select of an enum or of fixed objects, a number, a slider, a
 * boolean, a date, a date range, the chips of an array of strings or numbers, the table of an array of dates or date
 * ranges, the table of an array of objects, the picker of a relation to one entity, and the table of a relation to
 * many. A custom property has a component of its own instead.
 */
export type EntityFieldKind = 'string'
    | 'password'
    | 'textarea'
    | 'autocomplete'
    | 'select'
    | 'number'
    | 'slider'
    | 'boolean'
    | 'date'
    | 'dateRange'
    | 'chips'
    | 'dateArray'
    | 'objectArray'
    | 'reference'
    | 'hasMany';