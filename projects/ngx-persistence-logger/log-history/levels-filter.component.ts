import { Component, computed, input, InputSignal, model, ModelSignal, Signal } from '@angular/core';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent } from '@service-soft/ui/icon';
import { LogLevel } from 'zibri-contract';

// the most important first, like the logs a user looks for first.
const LEVELS: LogLevel[] = [LogLevel.CRITICAL, LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];

/**
 * A button that shows or hides the logs of a level.
 */
type LevelToggle = {
    /**
     * The level.
     */
    level: LogLevel,
    /**
     * What the level is called.
     */
    label: string,
    /**
     * Whether its logs are shown.
     */
    pressed: boolean
};

/**
 * Selects the levels whose logs the log history shows: a toggle button for each of them. Internal to the log history.
 */
@Component({
    selector: 'ngx-levels-filter',
    templateUrl: './levels-filter.component.html',
    imports: [ButtonComponent, IconComponent]
})
export class LevelsFilterComponent {
    /**
     * The icon that marks a pressed button.
     */
    protected readonly faCheck: typeof faCheck = faCheck;

    /**
     * The levels whose logs show.
     */
    readonly selected: ModelSignal<LogLevel[]> = model.required<LogLevel[]>();

    /**
     * What each level is called.
     */
    readonly levelLabels: InputSignal<Record<LogLevel, string>> = input.required<Record<LogLevel, string>>();

    /**
     * The name of the group of buttons.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * Every level with whether its logs show.
     */
    protected readonly toggles: Signal<LevelToggle[]> = computed(() => {
        return LEVELS.map(level => ({ level, label: this.levelLabels()[level], pressed: this.selected().includes(level) }));
    });

    /**
     * Shows the logs of a level, or hides them when they were shown.
     * @param level - The level.
     */
    protected toggle(level: LogLevel): void {
        this.selected.update(levels => levels.includes(level) ? levels.filter(other => other !== level) : [...levels, level]);
    }
}