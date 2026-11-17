import { InputCalendarColor } from '@service-soft/ui/input';

/**
 * The values a time input uses when its inputs are not set, and its texts. Its label, errors and sizes come from
 * provideInputConfig like for every input.
 */
export type InputTimeConfig = {
    /**
     * How many minutes are between two times the picker offers, without times of its own.
     */
    step: number,
    /**
     * The color of the header of the picker, like the one of the calendar of a date input.
     */
    color: InputCalendarColor,
    /**
     * The name of the button that opens the picker, and of the picker and its list.
     */
    timePickerLabel: string
};