import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { TimelineEntryComponent } from './timeline-entry.component';
import { TimelineComponent } from './timeline.component';

const meta: Meta<TimelineComponent> = {
    title: 'UI/Timeline',
    component: TimelineComponent,
    decorators: [moduleMetadata({ imports: [TimelineEntryComponent] })]
};
export default meta;

type Story = StoryObj<TimelineComponent>;

// the history of a club, oldest first, the dates machines can read in time elements.
export const Default: Story = {
    render: () => ({
        template: `
            <ui-timeline class="max-w-xl">
                <ui-timeline-entry date="March 1921" datetime="1921-03" heading="Founded">
                    <p>Twelve gymnasts found the club in the back room of the Krone inn.</p>
                </ui-timeline-entry>
                <ui-timeline-entry date="1950 – 1960" heading="The first hall">
                    <p>Members build the hall at the school themselves, in the evenings and on weekends.</p>
                </ui-timeline-entry>
                <ui-timeline-entry date="2024" datetime="2024" heading="The new hall">
                    <p>Room for six teams at once, a climbing wall and a café.</p>
                    <p>Opened with a party for the whole town.</p>
                </ui-timeline-entry>
            </ui-timeline>
        `
    })
};

// the stations of a CV, newest first, the headings long enough to wrap.
export const Narrow: Story = {
    render: () => ({
        template: `
            <ui-timeline class="max-w-xs">
                <ui-timeline-entry date="Since 2023" heading="Head coach of the swimming department and the competition team">
                    <p>Trains the competition team five times a week.</p>
                </ui-timeline-entry>
                <ui-timeline-entry date="2015 – 2023" heading="Swimming instructor" />
            </ui-timeline>
        `
    })
};

// on a colored surface, the dates and dots take its on- color.
export const OnColoredSurface: Story = {
    render: () => ({
        template: `
            <div class="surface-primary max-w-xl p-6">
                <ui-timeline>
                    <ui-timeline-entry date="Monday, 6 pm" heading="Lesson 1: The basics"><p>Breathing and floating.</p></ui-timeline-entry>
                    <ui-timeline-entry date="Monday, 7 pm" heading="Lesson 2: Freestyle"><p>Arms and legs together.</p></ui-timeline-entry>
                </ui-timeline>
            </div>
        `
    })
};