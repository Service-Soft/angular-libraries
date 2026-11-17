/**
 * The class of an entity, like `Task`, whose decorators describe its properties. The entities themselves may be plain
 * objects, like the json of a server: only the class holds the metadata.
 */
export type EntityClass<T> = abstract new (...args: never[]) => T;