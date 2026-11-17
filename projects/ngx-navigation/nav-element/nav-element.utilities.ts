import { NavElement } from '@service-soft/ngx-navigation/navigation';
import { ComponentMapUtilities } from '@service-soft/ui/component-map';

import { NavElementComponents, NavElementType } from './nav-element-components.model';

/**
 * Utilities for the components that show the elements of the navigation.
 */
export abstract class NavElementUtilities {
    /**
     * Validates that the components have one for every type of the elements and none for a type no element has. Every
     * element counts, also one whose condition hides it now, as it may show later. A custom element brings its own
     * component, and a menu shows what is inside of it itself. Call it in development builds only, guarded by
     * ngDevMode.
     * @param components - The component for each type.
     * @param elements - The elements of every row.
     * @param owner - What the elements are in, like 'The navbar', which starts the messages.
     * @throws {Error} When a component is missing, or one is there that isn't used.
     */
    static validateComponents(components: Partial<NavElementComponents>, elements: NavElement[], owner: string): void {
        const types: NavElementType[] = elements.flatMap(element => element.type === 'custom' ? [] : [element.type]);
        ComponentMapUtilities.validate(components, types, owner);
    }
}