import { Type } from '@angular/core';

import { NavConditional } from './nav-conditional.model';

/**
 * A component of your own, for what the other elements don't cover, like a switch of the language.
 */
export type NavCustom = NavConditional & {
    /**
     * Says that it is a component of your own.
     */
    type: 'custom',
    /**
     * The component.
     */
    component: Type<unknown>,
    /**
     * The values of its inputs, by their names.
     */
    inputs?: Record<string, unknown>
};