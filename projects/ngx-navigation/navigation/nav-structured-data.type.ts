import { ActivatedRouteSnapshot } from '@angular/router';

/**
 * What a page is, for machines, as https://schema.org describes it, like a WebSite, an Organization or a Product: the
 * object of its JSON-LD, or a function of its route that resolves it, like for the name in its url. The function runs
 * in an injection context, and may answer undefined for a page that has none.
 */
export type NavStructuredData = Record<string, unknown> | ((route: ActivatedRouteSnapshot) => Record<string, unknown> | undefined);