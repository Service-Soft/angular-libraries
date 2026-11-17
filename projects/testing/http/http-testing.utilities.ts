import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { TestRequest } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { FakeAnswer } from './fake-answer.model';

/**
 * Utilities for a backend that isn't there, like in a story.
 */
export abstract class HttpTestingUtilities {
    /**
     * Creates an interceptor that answers requests itself, right away, so a story shows the state they lead to once it
     * rendered: `provideHttpClient(withInterceptors([HttpTestingUtilities.answerWith({ 'POST /api/login': ... })]))`.
     * @param answers - What to answer, by the method and the path of the request, without its query.
     * @returns The interceptor. A request it has no answer for fails with 404.
     */
    static answerWith(answers: Record<string, FakeAnswer>): HttpInterceptorFn {
        return request => {
            const answer: FakeAnswer = answers[`${request.method} ${new URL(request.url, document.baseURI).pathname}`] ?? { status: 404 };
            return answer.status < 400
                ? of(new HttpResponse({ status: answer.status, body: answer.body, url: request.url }))
                : throwError(() => new HttpErrorResponse({ status: answer.status, error: answer.body, url: request.url }));
        };
    }

    /**
     * Answers a request of a HttpTestingController with 204 and no body, as the browser hands it to a json request:
     * as null. An empty string, which flush('') hands over, is no answer a browser gives.
     * @param request - The request.
     */
    static flushNoContent(request: TestRequest): void {
        // eslint-disable-next-line unicorn/no-null
        request.flush(null, { status: 204, statusText: 'No Content' });
    }
}