/**
 * Does something with an error nothing caught, like showing or logging it. It runs in an injection context, so it can
 * use inject(). Hand it to provideErrorHandler.
 */
export type ErrorHandlerFn = (error: unknown) => void;