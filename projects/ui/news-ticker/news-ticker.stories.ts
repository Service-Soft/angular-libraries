import { ButtonComponent } from '@service-soft/ui/button';
import { LinkComponent } from '@service-soft/ui/link';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { NewsTickerActionsComponent } from './news-ticker-actions.component';
import { NewsTickerItemComponent } from './news-ticker-item.component';
import { NewsTickerComponent } from './news-ticker.component';

const HEADLINES: string = `
    <ui-news-ticker-item><a ui-link appearance="subtle" href="#summer-party">Summer party on July 12</a></ui-news-ticker-item>
    <ui-news-ticker-item><a ui-link appearance="subtle" href="#courses">New courses from May on</a></ui-news-ticker-item>
    <ui-news-ticker-item><a ui-link appearance="subtle" href="#championship">Club championship: the results</a></ui-news-ticker-item>
    <ui-news-ticker-item><a ui-link appearance="subtle" href="#assembly">General assembly on March 3</a></ui-news-ticker-item>
`;

const ACTIONS: string = '<ui-news-ticker-actions><a ui-button size="sm" href="#news">All news</a></ui-news-ticker-actions>';

const meta: Meta<NewsTickerComponent> = {
    title: 'UI/News ticker',
    component: NewsTickerComponent,
    decorators: [moduleMetadata({ imports: [ButtonComponent, LinkComponent, NewsTickerActionsComponent, NewsTickerItemComponent] })],
    render: args => ({
        props: args,
        template: `<ui-news-ticker [color]="color" [speed]="speed">${HEADLINES}${ACTIONS}</ui-news-ticker>`
    }),
    argTypes: {
        color: { control: 'inline-radio', options: ['neutral', 'primary', 'secondary'] },
        speed: { control: 'number' }
    },
    args: {
        color: 'neutral',
        speed: 50
    }
};
export default meta;

type Story = StoryObj<NewsTickerComponent>;

export const Default: Story = {};

// the headlines, the button and the actions take the on- colors of a theme color.
export const Colors: Story = {
    render: () => ({
        template: `
            <div class="flex flex-col gap-4">
                <ui-news-ticker color="neutral" label="News on neutral">${HEADLINES}${ACTIONS}</ui-news-ticker>
                <ui-news-ticker color="primary" label="News on primary">${HEADLINES}${ACTIONS}</ui-news-ticker>
                <ui-news-ticker color="secondary" label="News on secondary">${HEADLINES}${ACTIONS}</ui-news-ticker>
            </div>
        `
    })
};

export const WithoutIconAndActions: Story = {
    render: () => ({
        props: { icon: undefined },
        template: `<ui-news-ticker [icon]="icon">${HEADLINES}</ui-news-ticker>`
    })
};

// a single headline moves at the same speed as many.
export const OneHeadline: Story = {
    render: () => ({
        template: `
            <ui-news-ticker>
                <ui-news-ticker-item><a ui-link appearance="subtle" href="#summer-party">Summer party on July 12</a></ui-news-ticker-item>
                ${ACTIONS}
            </ui-news-ticker>
        `
    })
};