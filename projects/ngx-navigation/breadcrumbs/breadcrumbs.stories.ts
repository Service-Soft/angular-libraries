import { afterNextRender, Component, inject } from '@angular/core';
import { provideRouter, Router, Routes, withHashLocation } from '@angular/router';
import { faBox } from '@fortawesome/free-solid-svg-icons';
import { NavRouteData } from '@service-soft/ngx-navigation/navigation';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { BreadcrumbsComponent } from './breadcrumbs.component';

@Component({ selector: 'ngx-story-page', template: '' })
class StoryPageComponent {}

const ORDER_DATA: NavRouteData = {
    breadcrumb: { parent: 'orders', name: route => `Order ${route.paramMap.get('id') ?? ''}` }
};

const ROUTES: Routes = [
    { path: 'orders', title: 'Orders', component: StoryPageComponent, data: { breadcrumb: { icon: faBox } } },
    { path: 'orders/:id', title: 'Order', component: StoryPageComponent, data: ORDER_DATA },
    { path: '**', component: StoryPageComponent }
];

// opens the page of an order once the breadcrumbs are there.
@Component({ selector: 'ngx-breadcrumbs-story', template: '<ngx-breadcrumbs />', imports: [BreadcrumbsComponent] })
class BreadcrumbsStoryComponent {
    constructor() {
        const router: Router = inject(Router);
        afterNextRender(() => void router.navigateByUrl('/orders/1001'));
    }
}

const meta: Meta<BreadcrumbsComponent> = {
    title: 'Navigation/Breadcrumbs',
    component: BreadcrumbsComponent,
    // the hash keeps the router off the path of the iframe storybook renders in.
    decorators: [applicationConfig({ providers: [provideRouter(ROUTES, withHashLocation())] })]
};
export default meta;

type Story = StoryObj<BreadcrumbsComponent>;

export const Default: Story = {
    render: () => ({ template: '<ngx-breadcrumbs-story />', moduleMetadata: { imports: [BreadcrumbsStoryComponent] } })
};