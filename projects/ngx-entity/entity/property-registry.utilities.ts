import { EntityClass } from './entity-class.type';
import { EntityProperty } from './entity-property.model';
import { PropertyMetadata } from './property-metadata.type';

/**
 * Keeps what the decorators of every entity class say about its properties. Internal to ngx-entity.
 */
// a WeakMap by prototype instead of reflect-metadata: no dependency, and a class nothing uses any more can be collected.
// It holds the metadata of every class, so its conditions are stored as conditions of never, which a condition of any
// class is. Reading them back as the conditions of one class is the one cast this needs: a map can't type its values by
// their key. It is sound because the decorators of a class only ever store conditions of that class.
export abstract class PropertyRegistryUtilities {
    private static readonly properties: WeakMap<object, Map<string, PropertyMetadata<never>>> = new WeakMap();

    /**
     * Keeps the metadata of a property of a class.
     * @param prototype - The prototype of the class, which a property decorator gets.
     * @param key - The name of the property.
     * @param metadata - What the property says about itself.
     */
    static register<T>(prototype: object, key: string, metadata: PropertyMetadata<T>): void {
        const properties: Map<string, PropertyMetadata<never>> | undefined = this.properties.get(prototype);
        if (properties == undefined) {
            this.properties.set(prototype, new Map([[key, metadata]]));
            return;
        }
        properties.set(key, metadata);
    }

    /**
     * Resolves the properties of a class, those of the classes it extends first, in the order they are declared. A
     * property declared again by a subclass keeps its place and takes the metadata of the subclass.
     * @param entity - The class.
     * @returns The properties.
     */
    static resolveProperties<T>(entity: EntityClass<T>): EntityProperty<T>[] {
        const merged: Map<string, PropertyMetadata<T>> = new Map();
        for (const prototype of this.resolvePrototypeChain(entity).reverse()) {
            for (const [key, metadata] of this.properties.get(prototype) ?? []) {
                merged.set(key, metadata as PropertyMetadata<T>);
            }
        }
        return [...merged].map(([key, metadata]) => ({ key, metadata }));
    }

    // the prototype of the class, then the ones of the classes it extends, up to Object.
    private static resolvePrototypeChain<T>(entity: EntityClass<T>): object[] {
        const chain: object[] = [];
        let prototype: unknown = entity.prototype;
        while (typeof prototype === 'object' && prototype !== null) {
            chain.push(prototype);
            prototype = Object.getPrototypeOf(prototype);
        }
        return chain;
    }
}