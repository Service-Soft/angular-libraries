/**
 * The data of an icon, like the icon definitions of Font Awesome, such as faClock from '@fortawesome/free-solid-svg-icons'.
 */
export type IconDefinition = {
    /**
     * The width and height of the icon, two values the svg ignores, and its path data: one path, or several for
     * duotone icons.
     */
    icon: [width: number, height: number, ligatures: unknown, unicode: unknown, path: string | string[]]
};