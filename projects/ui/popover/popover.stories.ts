import { afterNextRender, Component, computed, ElementRef, inject, input, InputSignal, Signal, signal, WritableSignal } from '@angular/core';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent } from '@service-soft/ui/icon';
import { InputBooleanComponent } from '@service-soft/ui/input-boolean';
import { Meta, StoryObj } from '@storybook/angular';

import { PopoverTriggerDirective } from './popover-trigger.directive';
import { PopoverComponent } from './popover.component';

// a component with state, which the template of a story doesn't have.
@Component({
    selector: 'ui-application-filter',
    templateUrl: './popover.stories.html',
    imports: [ButtonComponent, IconComponent, InputBooleanComponent, PopoverComponent, PopoverTriggerDirective]
})
class ApplicationFilterComponent {
    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    readonly faChevronDown: typeof faChevronDown = faChevronDown;
    readonly applications: string[] = ['Api', 'Website', 'Admin'];
    readonly selected: WritableSignal<string[]> = signal(['Api']);
    readonly summary: Signal<string> = computed(() => this.selected().length ? this.selected().join(', ') : 'All');

    // shows the story with the popover open.
    readonly openOnRender: InputSignal<boolean> = input(false);

    constructor() {
        afterNextRender(() => {
            if (this.openOnRender()) {
                this.element.querySelector('button')?.click();
            }
        });
    }

    toggle(application: string): void {
        this.selected.update(selected => {
            return selected.includes(application) ? selected.filter(other => other !== application) : [...selected, application];
        });
    }
}

const meta: Meta<PopoverComponent> = {
    title: 'UI/Popover',
    component: PopoverComponent
};
export default meta;

type Story = StoryObj<PopoverComponent>;

export const Default: Story = {
    render: () => ({ template: '<ui-application-filter />', moduleMetadata: { imports: [ApplicationFilterComponent] } })
};

export const Open: Story = {
    render: () => ({
        template: '<ui-application-filter [openOnRender]="true" />',
        moduleMetadata: { imports: [ApplicationFilterComponent] }
    })
};