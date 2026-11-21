import { Component, computed, input, InputSignal, model, ModelSignal, Signal } from '@angular/core';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent } from '@service-soft/ui/icon';
import { InputBooleanComponent } from '@service-soft/ui/input-boolean';
import { PopoverComponent, PopoverTriggerDirective } from '@service-soft/ui/popover';

/**
 * An application in the filter.
 */
type ApplicationOption = {
    /**
     * The name of the application.
     */
    name: string,
    /**
     * Whether its logs are shown.
     */
    checked: boolean
};

/**
 * Selects the applications whose logs the log history shows: a button that opens a checkbox for each of them.
 * Internal to the log history.
 */
@Component({
    selector: 'ngx-applications-filter',
    templateUrl: './applications-filter.component.html',
    imports: [ButtonComponent, IconComponent, InputBooleanComponent, PopoverComponent, PopoverTriggerDirective]
})
export class ApplicationsFilterComponent {
    /**
     * The icon that shows the button opens something.
     */
    protected readonly faChevronDown: typeof faChevronDown = faChevronDown;

    /**
     * Every application that can be selected.
     */
    readonly applications: InputSignal<string[]> = input.required<string[]>();

    /**
     * The selected applications. While none is selected, the logs of all show.
     */
    readonly selected: ModelSignal<string[]> = model.required<string[]>();

    /**
     * The name of the filter.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * What the filter says while none is selected.
     */
    readonly allLabel: InputSignal<string> = input.required<string>();

    /**
     * The text of the button, like 'Applications: Api, Website', which is its name for screen readers as well.
     */
    protected readonly summary: Signal<string> = computed(() => {
        const applications: string = this.selected().length ? this.selected().join(', ') : this.allLabel();
        return $localize`:@@ngx-persistence-logger.log-history.applicationsSummary:${this.label()}:label:: ${applications}:applications:`;
    });

    /**
     * Every application with whether it is selected.
     */
    protected readonly options: Signal<ApplicationOption[]> = computed(() => {
        return this.applications().map(name => ({ name, checked: this.selected().includes(name) }));
    });

    /**
     * Selects an application, or unselects it when it was selected.
     * @param application - The name of the application.
     */
    protected toggle(application: string): void {
        this.selected.update(selected => {
            return selected.includes(application) ? selected.filter(other => other !== application) : [...selected, application];
        });
    }
}