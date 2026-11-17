import { HttpContextToken } from '@angular/common/http';

/**
 * Marks the requests of the AuthService itself, which add what they need on their own. The authInterceptor leaves
 * them as they are, so refreshing a login never waits for a refresh.
 */
export const SKIP_AUTH: HttpContextToken<boolean> = new HttpContextToken(() => false);