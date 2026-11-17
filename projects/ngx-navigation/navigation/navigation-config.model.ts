/**
 * The texts of the navigation that every part of it shares.
 */
export type NavigationLabels = {
    /**
     * The name of the first step of the breadcrumbs, the start page.
     */
    home: string,
    /**
     * What screen readers call the links to the sections of the current page.
     */
    anchors: string
};

/**
 * What every part of the navigation shares.
 */
export type NavigationConfig = {
    /**
     * The texts.
     */
    labels: NavigationLabels
};

/**
 * The values to change in the config of the navigation. Everything is optional, including every single label.
 */
export type NavigationConfigChanges = {
    /**
     * The texts to change.
     */
    labels?: Partial<NavigationLabels>
};