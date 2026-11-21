/**
 * What renders a page on the server, like the AngularNodeAppEngine of @angular/ssr/node, which reads the title and the
 * description of a page rendered for each request, and has the app run the data.sitemap of its routes.
 */
export type SeoAppEngine = {
    /**
     * Renders the page of a request.
     * @param request - The request of the page.
     * @param requestContext - What the app gets as its REQUEST_CONTEXT, when it renders the page for the request.
     * @returns The page, or null for a request that is no page of the app.
     */
    handle: (request: Request, requestContext?: unknown) => Promise<Response | null>
};