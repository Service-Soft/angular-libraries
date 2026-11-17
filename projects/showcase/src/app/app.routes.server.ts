import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
    // built ahead of time like the pages of a website, which the prerender tests read.
    { path: 'website', renderMode: RenderMode.Prerender },
    // the pages of the projects need their backend, which the showcase doesn't have, so they render in the browser.
    { path: '**', renderMode: RenderMode.Client }
];