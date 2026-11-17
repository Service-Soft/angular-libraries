import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpInterceptorFn, HttpRequest, HttpResponse, HttpStatusCode } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, Observable, switchMap, tap, throwError } from 'rxjs';

import { AuthConfig } from './auth-config.model';
import { AUTH_CONFIG } from './auth-config.provider';
import { AuthErrorUtilities } from './auth-error.utilities';
import { AuthService } from './auth.service';
import { DpopService } from './dpop.service';
import { SecondFactor } from './second-factor.model';
import { SKIP_AUTH } from './skip-auth.provider';

// the scheme of an access token bound to a DPoP key.
const DPOP_SCHEME: string = 'DPoP';

// the error zibri refuses a proof with that lacks the nonce it wants, answered with a new one (RFC 9449).
const USE_DPOP_NONCE: string = 'use_dpop_nonce';

// requests that don't change anything, which zibri accepts without a csrf token.
const SAFE_METHODS: string[] = ['GET', 'HEAD', 'OPTIONS'];

// refusals of a request whose login is fine: it lacks a second factor or its csrf token, or the code was wrong.
// Refreshing would not help, and ending the login would throw away a login the user still has.
const LOGIN_KEEPING_ERRORS: string[] = [
    'SecondFactorMissingError',
    'InvalidTwoFactorCodeError',
    'OtpCodeAlreadyUsedError',
    'ReauthenticationRequiredError',
    'CsrfTokenRefusedError'
];

/**
 * Sends the login with every request to the origins of provideAuth, and nothing to any other: the access token of a
 * jwt login, refreshed when it runs out, or the cookies and the csrf token of a cookie login. With `dpop: true`, every
 * request to zibri carries the DPoP proof of the key of the browser, and the access token goes with the DPoP scheme;
 * a proof refused for the nonce zibri wants is sent once more with it. Asks the user for a second factor when a
 * request needs one, and sends it again with it. Ends the login of this browser when the server
 * refuses it with one of the logoutStatuses and a refresh doesn't help. Register it with
 * `provideHttpClient(withInterceptors([authInterceptor]))`.
 * @param request - The request.
 * @param next - The next handler.
 * @returns The response.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
    const authService: AuthService = inject<AuthService>(AuthService);
    const config: AuthConfig = inject(AUTH_CONFIG);
    const isApiRequest: boolean = authService.isApiRequest(request.url);
    // every request to zibri proves the key, also the ones of the AuthService itself, which binds the login to it
    const dpop: DpopService | undefined = config.dpop && isApiRequest ? inject(DpopService) : undefined;
    const baseUrl: string = inject(DOCUMENT).baseURI;
    const forward: HttpHandlerFn = dpop == undefined ? next : signed => sendWithProof(dpop, baseUrl, signed, next, false);
    if (request.context.get(SKIP_AUTH) || !isApiRequest) {
        return forward(request);
    }
    const send: Send = (attempt, retried) => {
        return from(resolveAuthorizedRequest(authService, config, attempt)).pipe(
            switchMap(authorized => forward(authorized)),
            tap(event => {
                if (event instanceof HttpResponse) {
                    authService.readCsrfToken(event.headers);
                }
            }),
            catchError((refusal: unknown) => {
                if (!(refusal instanceof HttpErrorResponse)) {
                    return throwError(() => refusal);
                }
                authService.readCsrfToken(refusal.headers);
                return from(resolveRetry(authService, config, attempt, refusal, retried)).pipe(
                    switchMap(retry => retry == undefined ? throwError(() => refusal) : send(retry, true))
                );
            })
        );
    };
    return send(request, false);
};

/**
 * Sends a request with the login, and once more when the server says what it lacked.
 */
type Send = (attempt: HttpRequest<unknown>, retried: boolean) => Observable<HttpEvent<unknown>>;

/**
 * Sends a request with the DPoP proof of its method, url and access token, keeps the nonce zibri answers with, and
 * sends it once more with a new proof when zibri refused the proof for a nonce it lacked.
 * @param dpop - The DpopService.
 * @param baseUrl - The url a relative url of a request is relative to.
 * @param request - The request, with its Authorization if it has one.
 * @param next - The next handler.
 * @param retried - Whether it is sent once more already, which it is only once.
 * @returns The response.
 */
function sendWithProof(
    dpop: DpopService,
    baseUrl: string,
    request: HttpRequest<unknown>,
    next: HttpHandlerFn,
    retried: boolean
): Observable<HttpEvent<unknown>> {
    const authorization: string | null = request.headers.get('Authorization');
    const accessToken: string | undefined = authorization?.startsWith(`${DPOP_SCHEME} `) === true
        ? authorization.slice(DPOP_SCHEME.length + 1)
        : undefined;
    const url: string = new URL(request.urlWithParams, baseUrl).href;
    return from(dpop.resolveProof(request.method, url, accessToken)).pipe(
        switchMap(proof => next(request.clone({ setHeaders: { DPoP: proof } }))),
        tap(event => {
            if (event instanceof HttpResponse) {
                dpop.readNonce(event.headers);
            }
        }),
        catchError((refusal: unknown) => {
            const newNonce: boolean = refusal instanceof HttpErrorResponse && dpop.readNonce(refusal.headers);
            return !retried && newNonce && isNonceRefusal(refusal)
                ? sendWithProof(dpop, baseUrl, request, next, true)
                : throwError(() => refusal);
        })
    );
}

/**
 * Whether zibri refused a proof for the nonce it lacked: in the body of a route of the auth, or in the challenge of a
 * route that takes the access token.
 * @param refusal - What the server answered.
 * @returns True for a missing or expired nonce.
 */
function isNonceRefusal(refusal: unknown): boolean {
    if (!(refusal instanceof HttpErrorResponse)) {
        return false;
    }
    const body: unknown = refusal.error;
    const error: unknown = typeof body === 'object' && body != undefined ? Reflect.get(body, 'error') : undefined;
    return error === USE_DPOP_NONCE || (refusal.headers.get('WWW-Authenticate')?.includes(`error="${USE_DPOP_NONCE}"`) ?? false);
}

/**
 * Adds the login to a request: the access token of a jwt login, or the cookies and the csrf token of a cookie login,
 * and the active tenant, unless the request names one itself.
 * @param authService - The AuthService of the app.
 * @param config - Where and how the app logs in.
 * @param attempt - The request.
 * @returns The request with the login.
 */
async function resolveAuthorizedRequest(
    authService: AuthService,
    config: AuthConfig,
    attempt: HttpRequest<unknown>
): Promise<HttpRequest<unknown>> {
    const tenantId: string | undefined = authService.activeTenantId();
    const request: HttpRequest<unknown> = tenantId == undefined || attempt.headers.has(config.headers.tenantId)
        ? attempt
        : attempt.clone({ setHeaders: { [config.headers.tenantId]: tenantId } });
    if (config.strategy === 'cookie') {
        let csrfToken: string | undefined;
        try {
            csrfToken = SAFE_METHODS.includes(request.method) ? undefined : await authService.resolveCsrfToken();
        }
        catch {
            // a session the server doesn't know anymore answers the request itself with a 401
            csrfToken = undefined;
        }
        return request.clone({
            withCredentials: true,
            setHeaders: csrfToken == undefined ? {} : { [config.headers.csrfToken]: csrfToken }
        });
    }
    try {
        const accessToken: string | undefined = await authService.resolveAccessToken();
        // a token bound to a key is sent with the scheme that says so, which zibri checks
        const scheme: string = config.dpop ? DPOP_SCHEME : 'Bearer';
        return accessToken == undefined ? request : request.clone({ setHeaders: { Authorization: `${scheme} ${accessToken}` } });
    }
    catch {
        // the refresh token was refused: the login is over, and the request goes without it
        await authService.forgetLogin();
        return request;
    }
}

/**
 * Resolves what to send once more after the server refused a request: with a second factor, with the current csrf
 * token, or with a refreshed login. Ends the login of this browser when it is over.
 * @param authService - The AuthService of the app.
 * @param config - Where and how the app logs in.
 * @param request - The request that was refused.
 * @param refusal - What the server answered.
 * @param retried - Whether the request was sent once more already, which it is only once.
 * @returns The request to send once more, or undefined to give up.
 */
async function resolveRetry(
    authService: AuthService,
    config: AuthConfig,
    request: HttpRequest<unknown>,
    refusal: HttpErrorResponse,
    retried: boolean
): Promise<HttpRequest<unknown> | undefined> {
    const name: string | undefined = AuthErrorUtilities.findErrorName(refusal);
    if (!retried && refusal.status === HttpStatusCode.Unauthorized && name === 'SecondFactorMissingError') {
        const secondFactor: SecondFactor | undefined = await authService.resolveSecondFactor();
        return secondFactor == undefined
            ? undefined
            : request.clone({ setHeaders: { [authService.getSecondFactorHeader(secondFactor.method)]: secondFactor.code } });
    }
    if (!retried && refusal.status === HttpStatusCode.Forbidden && name === 'CsrfTokenRefusedError') {
        // the session rotated in another tab: the next try asks the server for the current token
        authService.discardCsrfToken();
        return request;
    }
    if (!authService.loggedIn() || (name != undefined && LOGIN_KEEPING_ERRORS.includes(name))) {
        return undefined;
    }
    if (!retried && refusal.status === HttpStatusCode.Unauthorized) {
        // like a clock that is off, or a session that ran out: a refresh tells whether the login is still good
        try {
            await authService.refreshLogin();
            return request;
        }
        catch {
            await authService.forgetLogin();
            return undefined;
        }
    }
    if (config.logoutStatuses.includes(refusal.status)) {
        await authService.forgetLogin();
    }
    return undefined;
}