import { Type } from '@angular/core';

/**
 * The component that shows an element, with the values of its inputs.
 */
export type NavElementView = {
    /**
     * The component.
     */
    component: Type<unknown>,
    /**
     * The values of its inputs, by their names.
     */
    inputs: Record<string, unknown>
};