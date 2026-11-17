import { Routes } from '@angular/router';
import { EntityRouteUtilities } from '@service-soft/ngx-entity/routes';

import { ProjectService } from './project.service';

export const routes: Routes = [
    // prerendered, which the prerender tests read. Lazy, so its components stay out of the main bundle as well.
    {
        path: 'website',
        title: 'Website',
        loadComponent: async () => (await import('./website-page.component')).WebsitePageComponent
    },
    {
        path: 'projects',
        children: [
            // lazy, so the form and its fields stay out of the main bundle, which the bundle tests check.
            { path: '', loadComponent: async () => (await import('./project-form.component')).ProjectFormComponent },
            // declared in the main bundle, with the page loaded lazily, which the bundle tests check as well.
            ...EntityRouteUtilities.resolveRoutes(ProjectService, { createTitle: 'New project' })
        ]
    }
];