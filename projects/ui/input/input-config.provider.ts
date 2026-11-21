import { inject, InjectionToken, Provider } from '@angular/core';

import { InputConfigChanges } from './input-config-changes.model';
import { InputConfig } from './input-config.model';

/**
 * The values of inputs when nothing changes them. Their texts are $localize, which an app translates like its own, and
 * resolved once the config is injected, so translations an app loads at runtime apply as well.
 * @returns The default config.
 */
function getDefaultInputConfig(): InputConfig {
    return {
        size: 'md',
        required: true,
        showPasswordLabel: $localize`:@@ui.input.showPasswordLabel:Show password`,
        clearSearchLabel: $localize`:@@ui.input.clearSearchLabel:Clear search`,
        passwordStrength: false,
        passwordStrengthLabels: {
            weak: $localize`:@@ui.input.passwordStrengthLabels.weak:Password strength: weak`,
            medium: $localize`:@@ui.input.passwordStrengthLabels.medium:Password strength: medium`,
            strong: $localize`:@@ui.input.passwordStrengthLabels.strong:Password strength: strong`
        },
        textareaRows: 3,
        booleanAppearance: 'checkbox',
        cardsAppearance: 'cards',
        chooseFileLabel: $localize`:@@ui.input.chooseFileLabel:Choose a file`,
        chooseFilesLabel: $localize`:@@ui.input.chooseFilesLabel:Choose files`,
        removeLabel: $localize`:@@ui.input.removeLabel:Remove`,
        datePickerLabel: $localize`:@@ui.input.datePickerLabel:Choose a date`,
        previousMonthLabel: $localize`:@@ui.input.previousMonthLabel:Previous month`,
        nextMonthLabel: $localize`:@@ui.input.nextMonthLabel:Next month`,
        chooseYearLabel: $localize`:@@ui.input.chooseYearLabel:Choose a year`,
        dateRangePickerLabel: $localize`:@@ui.input.dateRangePickerLabel:Choose the dates`,
        rangeStartLabel: $localize`:@@ui.input.rangeStartLabel:Start`,
        rangeEndLabel: $localize`:@@ui.input.rangeEndLabel:End`,
        timeLabel: $localize`:@@ui.input.timeLabel:Time`,
        calendarColor: 'primary',
        color: 'primary',
        // Monday, as in ISO 8601. Browsers don't agree on Intl.Locale's week info yet, so it isn't read from the locale.
        firstDayOfWeek: 1,
        errorMessages: {
            valueMissing: $localize`:@@ui.input.errorMessages.valueMissing:This field is required.`,
            typeMismatch: $localize`:@@ui.input.errorMessages.typeMismatch:The value has the wrong format.`,
            patternMismatch: $localize`:@@ui.input.errorMessages.patternMismatch:The value has the wrong format.`,
            tooShort: $localize`:@@ui.input.errorMessages.tooShort:The value is too short.`,
            tooLong: $localize`:@@ui.input.errorMessages.tooLong:The value is too long.`,
            rangeUnderflow: $localize`:@@ui.input.errorMessages.rangeUnderflow:The value is too small.`,
            rangeOverflow: $localize`:@@ui.input.errorMessages.rangeOverflow:The value is too large.`,
            stepMismatch: $localize`:@@ui.input.errorMessages.stepMismatch:The value is not one of the allowed steps.`,
            badInput: $localize`:@@ui.input.errorMessages.badInput:The value can't be read.`,
            fileTooLarge: $localize`:@@ui.input.errorMessages.fileTooLarge:This file is too large.`,
            fileTypeMismatch: $localize`:@@ui.input.errorMessages.fileTypeMismatch:This file is of a type that isn't accepted.`,
            invalidFiles: $localize`:@@ui.input.errorMessages.invalidFiles:Remove the marked files, they can't be uploaded.`,
            optionNotChosen: $localize`:@@ui.input.errorMessages.optionNotChosen:Choose one of the options.`,
            rangeIncomplete: $localize`:@@ui.input.errorMessages.rangeIncomplete:Choose the start and the end.`,
            rangeReversed: $localize`:@@ui.input.errorMessages.rangeReversed:The end is before the start.`,
            rangeTooShort: $localize`:@@ui.input.errorMessages.rangeTooShort:The period is too short.`,
            rangeTooLong: $localize`:@@ui.input.errorMessages.rangeTooLong:The period is too long.`,
            timeNotAllowed: $localize`:@@ui.input.errorMessages.timeNotAllowed:This time isn't available.`
        }
    };
}

/**
 * The values every input below this injector uses when its inputs are not set.
 * Change them with provideInputConfig.
 */
export const INPUT_CONFIG: InjectionToken<InputConfig> = new InjectionToken<InputConfig>('INPUT_CONFIG', {
    providedIn: 'root',
    factory: () => getDefaultInputConfig()
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
            const parent: InputConfig = inject(INPUT_CONFIG, { skipSelf: true, optional: true }) ?? getDefaultInputConfig();
            return { ...parent, ...config, errorMessages: { ...parent.errorMessages, ...config.errorMessages } };
        }
    };
}