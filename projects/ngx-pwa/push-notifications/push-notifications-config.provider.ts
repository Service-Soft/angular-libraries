import { InjectionToken, Provider } from '@angular/core';

import { PushNotificationsConfig } from './push-notifications-config.model';

/**
 * Where the PushNotificationService sends the subscriptions. Set it with providePushNotifications.
 */
export const PUSH_NOTIFICATIONS_CONFIG: InjectionToken<PushNotificationsConfig> = new InjectionToken<PushNotificationsConfig>(
    'PUSH_NOTIFICATIONS_CONFIG',
    {
        providedIn: 'root',
        factory: () => {
            throw new Error('The PushNotificationService needs your public key and urls. '
                + 'Add providePushNotifications({ vapidPublicKey, enableUrl, disableUrl }) to the providers of your app.');
        }
    }
);

/**
 * Sets the public key and the urls of your server for push notifications. Provide it in the application config, next
 * to provideServiceWorker: there is one PushNotificationService for the whole app.
 * @param config - The public key and the urls.
 * @returns The provider for PUSH_NOTIFICATIONS_CONFIG.
 */
export function providePushNotifications(config: PushNotificationsConfig): Provider {
    return { provide: PUSH_NOTIFICATIONS_CONFIG, useValue: config };
}