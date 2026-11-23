import { InjectionToken } from '@angular/core';

/**
 * Whether a component is inside of a ui-drawer, which provides true to its content: `inject(IS_IN_DRAWER)`. A drawer
 * lists its content below each other with room for text, like the drawer of a navbar, so a button that is only an
 * icon elsewhere, like the theme switcher, names what it switches there. False outside of a drawer.
 */
export const IS_IN_DRAWER: InjectionToken<boolean> = new InjectionToken<boolean>('IS_IN_DRAWER', {
    providedIn: 'root',
    factory: () => false
});