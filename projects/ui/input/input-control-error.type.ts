/**
 * The errors a control checks itself, since the browser doesn't: a file larger than allowed and a file of a type it
 * doesn't accept, each shown at its file, a file input holding such a file, a text of an autocomplete that is none
 * of its options, and the rules of a date range: only its start or only its end, an end before the start, a range
 * shorter or longer than allowed and a time that isn't one of the allowed ones.
 */
export type InputControlError = 'fileTooLarge'
    | 'fileTypeMismatch'
    | 'invalidFiles'
    | 'optionNotChosen'
    | 'rangeIncomplete'
    | 'rangeReversed'
    | 'rangeTooShort'
    | 'rangeTooLong'
    | 'timeNotAllowed';