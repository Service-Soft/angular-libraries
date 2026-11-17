import { ButtonComponent } from '@service-soft/ui/button';
import { CardComponent } from '@service-soft/ui/card';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { SectionBackground } from './section-background.type';
import { SectionComponent } from './section.component';

const RADIO: 'inline-radio' = 'inline-radio';

const meta: Meta<SectionComponent> = {
    title: 'UI/Section',
    component: SectionComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent, CardComponent] })],
    parameters: { layout: 'fullscreen' },
    argTypes: {
        level: { control: RADIO, options: [1, 2, 3, 4, 5, 6] },
        background: { control: RADIO, options: ['surface', 'surface-container', 'primary', 'secondary'] },
        align: { control: RADIO, options: ['start', 'center'] }
    },
    args: {
        heading: 'Training for every age',
        eyebrow: 'Our departments',
        lead: 'From the first steps in the pool to the senior football team: twelve departments train at four places in town.',
        level: 2,
        background: 'surface',
        align: 'start'
    },
    render: args => ({
        props: args,
        template: `
            <ui-section
                sectionId="departments"
                [heading]="heading"
                [eyebrow]="eyebrow"
                [lead]="lead"
                [level]="level"
                [background]="background"
                [align]="align"
            >
                <div class="flex flex-wrap gap-4">
                    <button ui-button type="button">All departments</button>
                    <button ui-button type="button" variant="outlined">Training times</button>
                </div>
            </ui-section>
        `
    })
};
export default meta;

type Story = StoryObj<SectionComponent>;

export const Playground: Story = {};

const BACKGROUNDS: SectionBackground[] = ['surface', 'surface-container', 'primary', 'secondary'];

// one section after the other, in every background. On a colored surface, the eyebrow, the lead, the buttons and the
// cards inside take its on- colors.
export const Backgrounds: Story = {
    render: () => ({
        props: { backgrounds: BACKGROUNDS },
        template: `
            @for (background of backgrounds; track background) {
                <ui-section
                    [heading]="'On ' + background"
                    eyebrow="Background"
                    lead="The section takes the full width, its content stays in the width of the token --container-section."
                    [background]="background"
                >
                    <div class="grid gap-4 sm:grid-cols-3">
                        <ui-card variant="outlined"><p>Swimming</p></ui-card>
                        <ui-card variant="outlined"><p>Football</p></ui-card>
                        <ui-card variant="outlined"><p>Gymnastics</p></ui-card>
                    </div>
                    <div><button ui-button type="button">Become a member</button></div>
                </ui-section>
            }
        `
    })
};

// the intro at the top of a page: a heading of level 1, centered, in the largest text of the page.
export const PageIntro: Story = {
    render: () => ({
        template: `
            <ui-section
                heading="About the club"
                eyebrow="Since 1921"
                lead="A club for the whole family, run by its members, with twelve departments and more than 1,200 members."
                [level]="1"
                align="center"
                background="surface-container"
            />
        `
    })
};

// without a heading it is only the width and the space of a section, around content with its own heading.
export const WithoutHeading: Story = {
    render: () => ({
        template: `
            <ui-section>
                <h2 class="font-heading text-headline">A heading of your own</h2>
                <p class="text-body">The content decides everything inside the section.</p>
            </ui-section>
        `
    })
};

// a long heading and lead on a narrow screen wrap instead of overflowing.
export const LongTexts: Story = {
    render: () => ({
        template: `
            <div class="max-w-xs">
                <ui-section
                    heading="A heading that is far too long for a single line on a narrow screen"
                    eyebrow="An eyebrow that is long as well"
                    lead="And a lead text that goes on and on, so it needs several lines as well."
                />
            </div>
        `
    })
};