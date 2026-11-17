import { ApplicationRef } from '@angular/core';
import { BootstrapContext, bootstrapApplication } from '@angular/platform-browser';

import { AppComponent } from './app/app.component';
import { config } from './app/app.config.server';

/**
 * Renders the showcase on the server, which the build does for every route that is prerendered.
 * @param context - The context of the request the build renders.
 * @returns The running app.
 */
async function bootstrap(context: BootstrapContext): Promise<ApplicationRef> {
    return await bootstrapApplication(AppComponent, config, context);
}

export default bootstrap;