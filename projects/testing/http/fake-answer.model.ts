/**
 * What a fake backend answers a request with.
 */
export type FakeAnswer = {
    /**
     * The http status. From 400 on, the request fails with it.
     */
    status: number,
    /**
     * The body, like the json of an error. Undefined for an answer without one.
     */
    body?: object
};