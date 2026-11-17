import { Listbox, Option } from '@angular/aria/listbox';
import { afterNextRender, Component, computed, inject, input, InputSignal, LOCALE_ID, output, OutputEmitterRef, Signal, viewChildren } from '@angular/core';
import { InputCalendarColor } from '@service-soft/ui/input';
import { INPUT_DATE_CALENDAR_HEADER_CLASSES, INPUT_DATE_CALENDAR_HEADER_COLOR_CLASSES } from '@service-soft/ui/input-date';

import { InputTimeConfig } from './input-time-config.model';
import { INPUT_TIME_CONFIG } from './input-time-config.provider';
import { InputTimeOption } from './input-time-option.model';
import { InputTimeUtilities } from './input-time.utilities';

// a time fills its row, like a month of the calendar of a date input fills its cell. The chosen time is filled like a
// chosen day, with a transparent border that keeps its shape in forced colors mode, and bold, so color isn't the only cue.
// The focus ring is outside, as the fill would hide one inside, in the padding of the list that scrolls.
const OPTION_CLASSES: string = `
    flex min-h-9 cursor-pointer items-center justify-center rounded-full border border-transparent px-3 text-body text-on-surface
    transition-colors outline-none
    hover:bg-surface-container
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
    aria-selected:bg-primary aria-selected:font-semibold aria-selected:text-on-primary
    aria-selected:hover:bg-primary-hover
`;

let nextId: number = 0;

/**
 * The picker of ui-input-time and ui-input-date-range: a header like the one of the calendar of a date input, and the
 * times to choose from as a list, which the arrow keys, Home, End and the first digits of a time move through, and
 * Enter, Space or a click chooses from. It moves focus to the chosen time, or the first one, when it is created, like a
 * dialog that opens, which scrolls it into view, so render it only while it shows, like in a popover.
 */
@Component({
    selector: 'ui-input-time-picker',
    templateUrl: './input-time-picker.component.html',
    imports: [Listbox, Option],
    host: {
        class: 'block'
    }
})
export class InputTimePickerComponent {
    private readonly config: InputTimeConfig = inject(INPUT_TIME_CONFIG);

    // the format of the input, so a time reads the same in the input and in the list.
    private readonly format: Intl.DateTimeFormat = InputTimeUtilities.resolveFormat(inject(LOCALE_ID));

    /**
     * The time of the input, as 'HH:mm', which shows as chosen.
     */
    readonly value: InputSignal<string | undefined> = input<string>();

    /**
     * The times to choose from, as 'HH:mm'.
     */
    readonly times: InputSignal<readonly string[]> = input.required<readonly string[]>();

    /**
     * The color of the header. The default comes from provideInputTimeConfig.
     */
    readonly color: InputSignal<InputCalendarColor> = input<InputCalendarColor>(this.config.color);

    /**
     * The text of the header, which names the list. The default comes from provideInputTimeConfig.
     */
    readonly label: InputSignal<string> = input<string>(this.config.timePickerLabel);

    /**
     * Emits the time the user chose, as 'HH:mm'.
     */
    readonly chosen: OutputEmitterRef<string> = output<string>();

    /**
     * The id of the header, which names the list.
     */
    protected readonly labelId: string = `ui-input-time-picker-${nextId++}`;

    /**
     * The tailwind classes of the header, in its color.
     */
    protected readonly headerClasses: Signal<string> = computed(() => {
        return `${INPUT_DATE_CALENDAR_HEADER_CLASSES} ${INPUT_DATE_CALENDAR_HEADER_COLOR_CLASSES[this.color()]}`;
    });

    /**
     * The tailwind classes of a time.
     */
    protected readonly optionClasses: string = OPTION_CLASSES;

    /**
     * The times, with their text in the language of the app.
     */
    protected readonly options: Signal<InputTimeOption[]> = computed(() => {
        return this.times().map(time => ({ value: time, label: InputTimeUtilities.resolveText(time, this.format) }));
    });

    /**
     * The chosen values of the list: the time of the input, if it offers it.
     */
    protected readonly selectedValues: Signal<string[]> = computed(() => {
        const value: string | undefined = this.value();
        return value != undefined && this.times().includes(value) ? [value] : [];
    });

    private readonly optionElements: Signal<readonly Option<string>[]> = viewChildren(Option);

    constructor() {
        afterNextRender(() => {
            const options: readonly Option<string>[] = this.optionElements();
            (options.find(option => option.value() === this.value()) ?? options.at(0))?.element.focus();
        });
    }

    /**
     * Chooses the time the user chose in the list.
     * @param values - The chosen values of the list.
     */
    // Enter or a click on the chosen time deselects it in the list, which only confirms it, like in a select.
    protected choose(values: string[]): void {
        const time: string | undefined = values.at(0) ?? this.value();
        if (time != undefined) {
            this.chosen.emit(time);
        }
    }
}