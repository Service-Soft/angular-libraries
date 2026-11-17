import { HttpContextToken } from '@angular/common/http';

import { OfflineRequestMetadata } from './offline-request-metadata.model';

/**
 * Marks a POST, PATCH or DELETE request to be kept while the user is offline, and sent later:
 * `http.post(url, todo, { context: new HttpContext().set(OFFLINE_REQUEST_METADATA, { type: 'todo' }) })`.
 * Requests without it are sent like without the library.
 */
export const OFFLINE_REQUEST_METADATA: HttpContextToken<OfflineRequestMetadata | undefined> = new HttpContextToken(() => undefined);