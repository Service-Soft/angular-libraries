import { Routes } from '@angular/router';
import { EntityRouteUtilities } from '@service-soft/ngx-entity/routes';
import { NavRouteData } from '@service-soft/ngx-navigation/navigation';

import { ProjectService } from './project.service';

export const routes: Routes = [
    // prerendered, which the prerender tests read. Lazy, so its components stay out of the main bundle as well.
    {
        path: 'website',
        title: 'Website',
        loadComponent: async () => (await import('./website-page.component')).WebsitePageComponent,
        // written into the head by provideSeoConfig, on the server too, which the prerender tests read
        data: {
            description: 'The sports club of the town, with its news, its practice times and answers to your questions.',
            structuredData: { '@context': 'https://schema.org', '@type': 'SportsClub', name: 'Sports club Example' }
        } satisfies NavRouteData
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