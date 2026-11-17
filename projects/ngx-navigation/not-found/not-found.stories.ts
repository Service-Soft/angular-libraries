import { provideRouter, withHashLocation } from '@angular/router';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { provideNotFoundConfig } from './not-found-config.provider';
import { NotFoundComponent } from './not-found.component';

const meta: Meta<NotFoundComponent> = {
    title: 'Navigation/Not found',
    component: NotFoundComponent,
    // the hash keeps the router off the path of the iframe storybook renders in.
    decorators: [applicationConfig({ providers: [provideRouter([], withHashLocation())] })]
};
export default meta;

type Story = StoryObj<NotFoundComponent>;

export const Default: Story = {};

export const Translated: Story = {
    decorators: [
        applicationConfig({
            providers: [
                provideNotFoundConfig({
                    title: 'Seite nicht gefunden',
                    message: 'Die Seite wurde verschoben oder gelöscht.',
                    homeLabel: 'Zur Startseite'
                })
            ]
        })
    ]
};