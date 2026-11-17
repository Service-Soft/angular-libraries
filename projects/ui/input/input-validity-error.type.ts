/**
 * The validation errors of a native input, named like the properties of ValidityState.
 */
export type InputValidityError = 'valueMissing'
    | 'typeMismatch'
    | 'patternMismatch'
    | 'tooShort'
    | 'tooLong'
    | 'rangeUnderflow'
    | 'rangeOverflow'
    | 'stepMismatch'
    | 'badInput';