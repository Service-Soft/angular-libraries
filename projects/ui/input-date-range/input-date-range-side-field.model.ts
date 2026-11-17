import { InputDateRangeSide } from './input-date-range-side.type';

/**
 * What a date range input shows of one of its sides: the label, the text input of the day and the one of the time.
 */
export type InputDateRangeSideField = {
    /**
     * Which side it is.
     */
    side: InputDateRangeSide,
    /**
     * The label above its inputs, like 'Pick-up'.
     */
    label: string,
    /**
     * The id of that label.
     */
    labelId: string,
    /**
     * The id of the text input of the day.
     */
    inputId: string,
    /**
     * The ids of what names the text input: the label of the range and the one of the side.
     */
    labelledBy: string,
    /**
     * The name the text input submits under, if the range has one.
     */
    name: string | undefined,
    /**
     * The text of the input, which is only a date once it is complete.
     */
    text: string,
    /**
     * The name of the button that opens the calendar to choose this side.
     */
    calendarButtonLabel: string,
    /**
     * The id of the text input of the time.
     */
    timeId: string,
    /**
     * The ids of what names the text input of the time.
     */
    timeLabelledBy: string,
    /**
     * The text of the input of the time, which is only a time once it is complete.
     */
    timeText: string,
    /**
     * The anchor-name of the input of the time, which its picker is placed at.
     */
    timeAnchorName: string,
    /**
     * The id of the popover of the picker of the time, which its button points to.
     */
    timePickerId: string,
    /**
     * The name of the button that opens the picker of the time, and of the picker.
     */
    timePickerLabel: string,
    /**
     * Whether the picker of the time is open, which the browser decides.
     */
    timePickerOpen: boolean,
    /**
     * The times the picker offers: the ones of the day of the side, none while a day decides them and there is none.
     */
    times: readonly string[],
    /**
     * Its time, as 'HH:mm', or undefined while it has no day.
     */
    time: string | undefined
};