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
    icon: IconDefinition
};