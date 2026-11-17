/**
 * A rule about a property that is either always the same or depends on the entity, like a field that is only required
 * while another one is set: `required: task => task.done === true`. It gets the values of the form, so any of them may
 * still be missing.
 */
export type EntityCondition<T> = boolean | ((entity: Partial<T>) => boolean);