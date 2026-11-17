/**
 * How the browser stays logged in at zibri: with tokens it sends itself (`jwt`), or with httpOnly cookies the browser
 * sends and a csrf token (`cookie`).
 */
export type AuthStrategyName = 'jwt' | 'cookie';