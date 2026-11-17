import { provideRouter, withHashLocation } from '@angular/router';
import { NavImageComponent } from '@service-soft/ngx-navigation/nav-image';
import { NavLinkComponent } from '@service-soft/ngx-navigation/nav-link';
import { NavTextComponent } from '@service-soft/ngx-navigation/nav-text';
import { FooterRow } from '@service-soft/ngx-navigation/navigation';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { FooterComponent } from './footer.component';

const ROWS: FooterRow[] = [
    {
        elements: [
            { type: 'image', url: '/logo.svg', alt: '', width: 32, height: 32 },
            { type: 'text', text: '© 2026 Shop' },
            { type: 'link', name: 'Imprint', route: 'imprint', position: 'end' },
            { type: 'link', name: 'Privacy', route: 'privacy', position: 'end' }
        ]
    },
    { elements: [{ type: 'link', name: 'Status of the services', url: 'https://status.example.com', openInNewTab: true, position: 'center' }] }
];

const meta: Meta<FooterComponent> = {
    title: 'Navigation/Footer',
    component: FooterComponent,
    // the hash keeps the router off the path of the iframe storybook renders in.
    decorators: [applicationConfig({ providers: [provideRouter([], withHashLocation())] })]
};
export default meta;

type Story = StoryObj<FooterComponent>;

export const Default: Story = {
    args: { rows: ROWS, components: { image: NavImageComponent, text: NavTextComponent, link: NavLinkComponent } }
};