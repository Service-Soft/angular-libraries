import { IconDefinition } from '@fortawesome/free-solid-svg-icons';

/**
 * What the offline status bar says, ready to render.
 */
export type OfflineStatusView = {
    /**
     * The text.
     */
    message: string,
    /**
     * The icon before it, which repeats the text.
     */
    icon: IconDefinition,
    /**
     * When the oldest data the app shows from the offline cache was loaded, or undefined while it shows none.
     */
    loadedAt?: Date
};