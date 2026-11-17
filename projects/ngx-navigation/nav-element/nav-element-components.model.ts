import { Type } from '@angular/core';
import { NavElementContent } from '@service-soft/ngx-navigation/navigation';

import { NavElementRenderer } from './nav-element-renderer.model';

/**
 * The type of every element that a component of the map shows; a custom element brings its own component.
 */
export type NavElementType = Exclude<NavElementContent['type'], 'custom'>;

/**
 * The component that shows each type of element, like NavLinkComponent of '@service-soft/ngx-navigation/nav-link'
 * for links, or one of your own with the inputs of a NavElementRenderer. The navbar and the footer take the ones
 * their elements need, so the others stay out of the bundle.
 */
export type NavElementComponents = {
    [Key in NavElementType]: Type<NavElementRenderer<Extract<NavElementContent, Record<'type', Key>>>>
};