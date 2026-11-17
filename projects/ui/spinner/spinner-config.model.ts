import { SpinnerSize } from './spinner-size.type';

/**
 * The values a spinner uses when its inputs are not set.
 */
export type SpinnerConfig = {
    /**
     * What screen readers announce.
     */
    label: string,
    /**
     * How large it is.
     */
    size: SpinnerSize
};
