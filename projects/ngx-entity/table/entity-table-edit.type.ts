/**
 * Where an entity table creates and edits its entities: in a dialog over the table, or on a page of its own, at the
 * routes `new` and `:id` below the route of the table.
 */
export type EntityTableEdit = 'dialog' | 'page';