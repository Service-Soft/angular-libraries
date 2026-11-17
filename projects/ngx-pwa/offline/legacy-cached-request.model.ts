/**
 * A request as the package before @service-soft/ngx-pwa kept it: a serialized HttpRequest with its metadata.
 */
export type LegacyCachedRequest = {
    /**
     * The serialized HttpRequest.
     */
    request: {
        /**
         * The method of the request.
         */
        method: string,
        /**
         * The url of the request, with its parameters.
         */
        urlWithParams: string,
        /**
         * The body of the request. A POST has the offline id in it.
         */
        body: unknown
    },
    /**
     * What was known about the request.
     */
    metadata: {
        /**
         * The type of the entity the request changes.
         */
        type: string,
        /**
         * The property that holds the id of the entity.
         */
        idKey: string,
        /**
         * What the user saw of the request, as html.
         */
        displayValue: string
    }
};