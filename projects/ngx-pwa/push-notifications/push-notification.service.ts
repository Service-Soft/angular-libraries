import { HttpClient } from '@angular/common/http';
import { inject, Service, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { SwPush } from '@angular/service-worker';
import { firstValueFrom, map } from 'rxjs';

import { PushNotificationsConfig } from './push-notifications-config.model';
import { PUSH_NOTIFICATIONS_CONFIG } from './push-notifications-config.provider';

/**
 * Turns push notifications of the browser on and off, and tells your server which browsers get them. Set it up with
 * providePushNotifications, and provideServiceWorker of `@angular/service-worker`.
 */
@Service()
export class PushNotificationService {
    private readonly swPush: SwPush = inject(SwPush);

    private readonly http: HttpClient = inject(HttpClient);

    private readonly config: PushNotificationsConfig = inject(PUSH_NOTIFICATIONS_CONFIG);

    /**
     * Whether this browser gets push notifications.
     */
    readonly enabled: Signal<boolean> = toSignal(this.swPush.subscription.pipe(map(subscription => subscription != undefined)), {
        initialValue: false
    });

    /**
     * Whether push notifications can be used, which needs the service worker. It only runs in a browser that supports
     * it, served over https or from localhost, and is usually only enabled in production builds.
     * @returns Whether enable can succeed.
     */
    get available(): boolean {
        return this.swPush.isEnabled;
    }

    /**
     * Asks the user to allow push notifications and sends the subscription of this browser to the enableUrl.
     * @throws {Error} When the user doesn't allow them, the service worker doesn't run or the server fails.
     */
    async enable(): Promise<void> {
        const subscription: PushSubscription = await this.swPush.requestSubscription({ serverPublicKey: this.config.vapidPublicKey });
        await firstValueFrom(this.http.post(this.config.enableUrl, subscription));
    }

    /**
     * Sends the subscription of this browser to the disableUrl and ends it, so the browser gets no push notifications
     * anymore. Does nothing while it has none.
     */
    async disable(): Promise<void> {
        // without the service worker, the subscription never emits.
        if (!this.available) {
            return;
        }
        const subscription: PushSubscription | null = await firstValueFrom(this.swPush.subscription);
        if (subscription == undefined) {
            return;
        }
        await firstValueFrom(this.http.post(this.config.disableUrl, subscription));
        await this.swPush.unsubscribe();
    }
}