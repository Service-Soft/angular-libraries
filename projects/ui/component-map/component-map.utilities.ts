/**
 * Utilities for components that render data with components they are given, by a key of the data like its type:
 * `<x [components]="{ link: LinkComponent }">`. Only the components a page passes end up in its bundle, which a
 * component that imported every possible one itself would always ship.
 */
export abstract class ComponentMapUtilities {
    /**
     * Validates that a map of components has a component for every key the data uses, and none for a key it doesn't
     * use, which would only make the bundle bigger. Call it in development builds only, guarded by ngDevMode, so
     * production builds leave it out.
     * @param components - The components, by their keys.
     * @param usedKeys - The keys the data uses.
     * @param owner - What the components are for, like 'The navbar', which starts the messages.
     * @throws {Error} When a component is missing, or one is there that isn't used.
     */
    static validate(components: Partial<Record<string, unknown>>, usedKeys: Iterable<string>, owner: string): void {
        const used: Set<string> = new Set(usedKeys);
        const provided: Set<string> = new Set(Object.entries(components).flatMap(([key, value]) => value == undefined ? [] : [key]));
        const missing: string[] = [...used].filter(key => !provided.has(key));
        const unused: string[] = [...provided].filter(key => !used.has(key));
        if (missing.length) {
            throw new Error(
                `${owner} needs a component for ${ComponentMapUtilities.joinKeys(missing)}, which are used but missing in its components.`
            );
        }
        if (unused.length) {
            throw new Error(
                `${owner} has a component for ${ComponentMapUtilities.joinKeys(unused)}, which nothing uses. `
                + 'Remove it from its components, so it stays out of the bundle.'
            );
        }
    }

    private static joinKeys(keys: string[]): string {
        return keys.map(key => `"${key}"`).join(', ');
    }
}