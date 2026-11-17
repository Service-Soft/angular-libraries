import { InputBooleanAppearance } from './input-boolean-appearance.type';
import { InputCalendarColor } from './input-calendar-color.type';
import { InputCardsAppearance } from './input-cards-appearance.type';
import { InputColor } from './input-color.type';
import { InputControlError } from './input-control-error.type';
import { InputPasswordStrength } from './input-password-strength.type';
import { InputSize } from './input-size.type';
import { InputValidityError } from './input-validity-error.type';
import { InputWeekday } from './input-weekday.type';

/**
 * The values an input uses when its inputs are not set.
 */
export type InputConfig = {
    /**
     * The height and padding of the input.
     */
    size: InputSize,
    /**
     * Whether an input needs a value. Most fields of a form do, so only the optional ones have to say so.
     */
    required: boolean,
    /**
     * The name of the button next to a password input that shows the password as text.
     */
    showPasswordLabel: string,
    /**
     * The name of the button inside a search input that empties it.
     */
    clearSearchLabel: string,
    /**
     * Whether a password input shows how hard the password is to guess, below it.
     */
    passwordStrength: boolean,
    /**
     * The texts that say how hard a password is to guess, by its strength.
     */
    passwordStrengthLabels: Record<InputPasswordStrength, string>,
    /**
     * How many lines of text a textarea shows before the user resizes it.
     */
    textareaRows: number,
    /**
     * How an input of a boolean looks: a checkbox, or a switch.
     */
    booleanAppearance: InputBooleanAppearance,
    /**
     * How an input of one of a few options shown as cards looks: as cards, or as a row of segments.
     */
    cardsAppearance: InputCardsAppearance,
    /**
     * The text of the button that chooses the file of a file input that takes one.
     */
    chooseFileLabel: string,
    /**
     * The text of the button that chooses the files of a file input that takes several.
     */
    chooseFilesLabel: string,
    /**
     * The name of the button that removes a file from a file input or a chip from a chips input, read together with
     * the name of the file or the label of the chip.
     */
    removeLabel: string,
    /**
     * The name of the button next to a date input that opens the calendar.
     */
    datePickerLabel: string,
    /**
     * The name of the button of the calendar that shows the month before.
     */
    previousMonthLabel: string,
    /**
     * The name of the button of the calendar that shows the month after.
     */
    nextMonthLabel: string,
    /**
     * Read after the month and year at the top of the calendar, whose button switches to choosing a year.
     */
    chooseYearLabel: string,
    /**
     * The name of the buttons of a date range input that open its calendar, and of the calendar.
     */
    dateRangePickerLabel: string,
    /**
     * The label of the start of a date range input, like 'Pick-up' for a rental.
     */
    rangeStartLabel: string,
    /**
     * The label of the end of a date range input, like 'Return' for a rental.
     */
    rangeEndLabel: string,
    /**
     * Read after the label of the start or end of a date range input for the select of its time.
     */
    timeLabel: string,
    /**
     * The color of the header of the calendar, with the month and its buttons.
     */
    calendarColor: InputCalendarColor,
    /**
     * The color the chips of a chips input, a checked checkbox or switch and the filled part of a slider are drawn with.
     */
    color: InputColor,
    /**
     * The day the weeks of the calendar start with, like 1 for Monday or 0 for Sunday.
     */
    firstDayOfWeek: InputWeekday,
    /**
     * The messages of validation errors, by the property of the native ValidityState that is true, like valueMissing,
     * and by the errors a control checks itself, like a file that is too large. They replace the messages of the
     * browser, which are in the language of the browser instead of the app.
     */
    errorMessages: Record<InputValidityError | InputControlError, string>
};