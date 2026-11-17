/**
 * Up to which width of the screen an element of the navbar is in the drawer instead: on small screens (below 768px),
 * up to medium ones (below 1024px), up to large ones (below 1280px), always or never. The widths are the breakpoints
 * md, lg and xl of Tailwind, and follow when your theme changes them.
 */
export type NavCollapse = 'sm' | 'md' | 'lg' | 'always' | 'never';