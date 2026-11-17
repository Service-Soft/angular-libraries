import { afterNextRender, Component, inject } from '@angular/core';
import { provideRouter, Router, Routes, withHashLocation } from '@angular/router';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { NavAnchorsComponent } from './nav-anchors.component';

@Component({ selector: 'ngx-story-page', template: '' })
class StoryPageComponent {}

const ROUTES: Routes = [
    {
        path: 'orders',
        component: StoryPageComponent,
        data: { anchors: [{ name: 'Open', fragment: 'open' }, { name: 'Shipped', fragment: 'shipped' }] }
    },
    { path: '**', component: StoryPageComponent }
];

// opens the page with the anchors once the links are there.
@Component({ selector: 'ngx-nav-anchors-story', template: '<ngx-nav-anchors />', imports: [NavAnchorsComponent] })
class NavAnchorsStoryComponent {
    constructor() {
        const router: Router = inject(Router);
        afterNextRender(() => void router.navigateByUrl('/orders'));
    }
}

const meta: Meta<NavAnchorsComponent> = {
    title: 'Navigation/Anchors',
    component: NavAnchorsComponent,
    // the hash keeps the router off the path of the iframe storybook renders in.
    decorators: [applicationConfig({ providers: [provideRouter(ROUTES, withHashLocation())] })]
};
export default meta;

type Story = StoryObj<NavAnchorsComponent>;

export const Default: Story = {
    render: () => ({ template: '<ngx-nav-anchors-story />', moduleMetadata: { imports: [NavAnchorsStoryComponent] } })
};