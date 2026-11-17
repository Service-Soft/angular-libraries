import { InputSignal } from '@angular/core';

import { NavElementLayout } from './nav-element-layout.type';

/**
 * What a component that shows a type of element takes: the element and where it is shown. Your own component for a
 * type has these two inputs as well.
 */
export type NavElementRenderer<Element> = {
    /**
     * The element to show.
     */
    element: InputSignal<Element>,
    /**
     * Whether it is in a row, like of the navbar, or in the drawer.
     */
    layout: InputSignal<NavElementLayout>
};