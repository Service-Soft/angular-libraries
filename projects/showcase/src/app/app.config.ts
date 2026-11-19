import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig,
    provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideChangeSetService } from '@service-soft/ngx-change-sets/change-sets';
import { provideSeoConfig } from '@service-soft/ngx-navigation/seo';

import { routes } from './app.routes';
import { OrderChangeSetService } from './order-change-set.service';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideRouter(routes),
        // the prerendered pages are hydrated, like the ones of a website, rather than rendered again
        provideClientHydration(withEventReplay()),
        provideHttpClient(),
        provideChangeSetService(OrderChangeSetService),
        provideSeoConfig({ origin: 'https://showcase.example' })
    ]
};