import { Component, model, ModelSignal } from '@angular/core';
import { InputCardOption, InputCardsComponent, InputCardsMultipleComponent } from '@service-soft/ui/input-cards';
import { InputDateComponent } from '@service-soft/ui/input-date';
import { InputStringComponent } from '@service-soft/ui/input-string';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { StepComponent } from './step.component';
import { StepperBeforeNext } from './stepper-before-next.type';
import { StepperColor } from './stepper-color.type';
import { StepperComponent } from './stepper.component';

const CARS: InputCardOption<string>[] = [
    { label: 'VW Golf', value: 'golf', description: 'Compact, 5 seats, manual' },
    { label: 'VW Polo', value: 'polo', description: 'Small, 5 seats, automatic' }
];

const EXTRAS: InputCardOption<string>[] = [
    { label: 'Child seat', value: 'child-seat', description: 'For children from 9 to 18 kg' },
    { label: 'Second driver', value: 'second-driver', description: 'Someone else may drive as well' }
];

// a booking like the one of a car rental: every step has controls the stepper checks before it goes on.
@Component({
    selector: 'ui-booking-story',
    templateUrl: './stepper.stories.html',
    imports: [StepperComponent, StepComponent, InputDateComponent, InputStringComponent, InputCardsComponent, InputCardsMultipleComponent]
})
class BookingStoryComponent {
    readonly step: ModelSignal<number> = model(0);
    readonly orientation: ModelSignal<'horizontal' | 'vertical'> = model<'horizontal' | 'vertical'>('horizontal');
    readonly linear: ModelSignal<boolean> = model(true);
    readonly color: ModelSignal<StepperColor> = model<StepperColor>('primary');
    readonly beforeNext: ModelSignal<StepperBeforeNext | undefined> = model<StepperBeforeNext>();

    protected readonly cars: InputCardOption<string>[] = CARS;
    protected readonly extras: InputCardOption<string>[] = EXTRAS;
    protected pickUp: Date | undefined = new Date(2026, 4, 12);
    protected car: string | undefined = 'golf';
    protected chosenExtras: string[] = [];
    protected name: string = 'Ada Lovelace';
    protected booked: boolean = false;
}

const meta: Meta<StepperComponent> = {
    title: 'UI/Stepper',
    component: StepperComponent,
    decorators: [moduleMetadata({ imports: [BookingStoryComponent] })],
    argTypes: {
        orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary'] },
        linear: { control: 'boolean' },
        step: { control: { type: 'range', min: 0, max: 3 } }
    },
    args: {
        orientation: 'horizontal',
        color: 'primary',
        linear: true,
        step: 1
    },
    render: args => ({
        props: args,
        template: '<ui-booking-story [orientation]="orientation" [color]="color" [linear]="linear" [step]="step" />'
    })
};
export default meta;

type Story = StoryObj<StepperComponent>;

export const Playground: Story = {};

// the steps below each other, with the content of the current one below its name.
export const Vertical: Story = {
    args: { orientation: 'vertical' }
};

// the names of the done steps are buttons back to them.
// a check before going on that never answers, like a request for the availability of the car: the button is busy.
export const Checking: Story = {
    render: () => ({
        props: { check: (): Promise<boolean> => new Promise<boolean>(() => undefined) },
        template: '<ui-booking-story [step]="1" [beforeNext]="check" />'
    }),
    // goes on from the valid step of the car, so the check starts.
    play: ({ canvasElement }) => {
        canvasElement.querySelector<HTMLButtonElement>('ui-form:not([hidden]) button[type="submit"]')?.click();
    }
};

export const NotLinear: Story = {
    args: { linear: false, step: 2 }
};

// too narrow for the row of steps, like on a phone: "Step 2 of 4" and a bar instead.
export const Narrow: Story = {
    render: () => ({
        template: '<div class="max-w-sm"><ui-booking-story [step]="1" /></div>'
    })
};

// the third step in each color, so done, current and upcoming steps show.
export const Colors: Story = {
    render: () => ({
        props: { colors: ['neutral', 'primary', 'secondary'] },
        template: `
            <div class="grid gap-8">
                @for (color of colors; track color) {
                    <ui-booking-story [color]="color" [linear]="false" [step]="2" />
                }
            </div>
        `
    })
};