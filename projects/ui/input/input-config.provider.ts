import { inject, InjectionToken, Provider } from '@angular/core';

import { InputConfigChanges } from './input-config-changes.model';
import { InputConfig } from './input-config.model';

const DEFAULT_INPUT_CONFIG: InputConfig = {
    size: 'md',
    required: true,
    showPasswordLabel: 'Show password',
    clearSearchLabel: 'Clear search',
    passwordStrength: false,
    passwordStrengthLabels: {
        weak: 'Password strength: weak',
        medium: 'Password strength: medium',
        strong: 'Password strength: strong'
    },
    textareaRows: 3,
    booleanAppearance: 'checkbox',
    cardsAppearance: 'cards',
    chooseFileLabel: 'Choose a file',
    chooseFilesLabel: 'Choose files',
    removeLabel: 'Remove',
    datePickerLabel: 'Choose a date',
    previousMonthLabel: 'Previous month',
    nextMonthLabel: 'Next month',
    chooseYearLabel: 'Choose a year',
    dateRangePickerLabel: 'Choose the dates',
    rangeStartLabel: 'Start',
    rangeEndLabel: 'End',
    timeLabel: 'Time',
    calendarColor: 'primary',
    color: 'primary',
    // Monday, as in ISO 8601. Browsers don't agree on Intl.Locale's week info yet, so it isn't read from the locale.
    firstDayOfWeek: 1,
    errorMessages: {
        valueMissing: 'This field is required.',
        typeMismatch: 'The value has the wrong format.',
        patternMismatch: 'The value has the wrong format.',
        tooShort: 'The value is too short.',
        tooLong: 'The value is too long.',
        rangeUnderflow: 'The value is too small.',
        rangeOverflow: 'The value is too large.',
        stepMismatch: 'The value is not one of the allowed steps.',
        badInput: 'The value can\'t be read.',
        fileTooLarge: 'This file is too large.',
        fileTypeMismatch: 'This file is of a type that isn\'t accepted.',
        invalidFiles: 'Remove the marked files, they can\'t be uploaded.',
        optionNotChosen: 'Choose one of the options.',
        rangeIncomplete: 'Choose the start and the end.',
        rangeReversed: 'The end is before the start.',
        rangeTooShort: 'The period is too short.',
        rangeTooLong: 'The period is too long.',
        timeNotAllowed: 'This time isn\'t available.'
    }
};

/**
 * The values every input below this injector uses when its inputs are not set.
 * Change them with provideInputConfig.
 */
export const INPUT_CONFIG: InjectionToken<InputConfig> = new InjectionToken<InputConfig>('INPUT_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_INPUT_CONFIG
});

/**
 * Changes the values inputs use when their inputs are not set, like the messages of errors to translate them.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector, including single error messages.
 * @param config - The values to change.
 * @returns The provider for INPUT_CONFIG.
 */
export function provideInputConfig(config: InputConfigChanges): Provider {
    return {
        provide: INPUT_CONFIG,
        useFactory: (): InputConfig => {
            const parent: InputConfig = inject(INPUT_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_INPUT_CONFIG;
            return { ...parent, ...config, errorMessages: { ...parent.errorMessages, ...config.errorMessages } };
        }
    };
}