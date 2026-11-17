import { SpinnerSize } from '@service-soft/ui/spinner';

/**
 * The values an area that loads uses when its inputs are not set, and its text.
 */
export type LoadingConfig = {
    /**
     * What screen readers read for the spinner over the area.
     */
    label: string,
    /**
     * How large the spinner is.
     */
    size: SpinnerSize
};