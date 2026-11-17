import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting, TestRequest } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { BehaviorSubject, NEVER, Observable } from 'rxjs';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { PushNotificationService } from './push-notification.service';
import { providePushNotifications } from './push-notifications-config.provider';

/**
 * The subscription of a browser, as far as the server needs it.
 */
type Subscription = {
    endpoint: string
};

const SUBSCRIPTION: Subscription = { endpoint: 'https://push.example.com/browser-1' };

// the push service of the browser, which can't run in a test. It behaves like SwPush with a running service worker,
// which emits null while there is no subscription.
class BrowserPush {
    readonly isEnabled: boolean = true;

    readonly subscription: BehaviorSubject<Subscription | undefined> = new BehaviorSubject<Subscription | undefined>(undefined);

    readonly requestedKeys: string[] = [];

    async requestSubscription(options: { serverPublicKey: string }): Promise<Subscription> {
        this.requestedKeys.push(options.serverPublicKey);
        this.subscription.next(SUBSCRIPTION);
        return await Promise.resolve(SUBSCRIPTION);
    }

    async unsubscribe(): Promise<void> {
        this.subscription.next(undefined);
        await Promise.resolve();
    }
}

// SwPush without a service worker, like in development builds.
class DisabledPush {
    readonly isEnabled: boolean = false;

    readonly subscription: Observable<never> = NEVER;
}

function setup(swPush: BrowserPush | DisabledPush): [PushNotificationService, HttpTestingController] {
    TestBed.configureTestingModule({
        providers: [
            provideHttpClient(),
            provideHttpClientTesting(),
            { provide: SwPush, useValue: swPush },
            providePushNotifications({ vapidPublicKey: 'public-key', enableUrl: '/api/push/enable', disableUrl: '/api/push/disable' })
        ]
    });
    return [TestBed.inject(PushNotificationService), TestBed.inject(HttpTestingController)];
}

describe('PushNotificationService', () => {
    afterEach(() => {
        TestBed.inject(HttpTestingController).verify();
    });

    test('subscribes with the public key and sends the subscription to the server', async () => {
        const browserPush: BrowserPush = new BrowserPush();
        const [pushNotificationService, backend] = setup(browserPush);
        expect(pushNotificationService.available).toBe(true);
        expect(pushNotificationService.enabled()).toBe(false);

        const enabled: Promise<void> = pushNotificationService.enable();
        const request: TestRequest = await vi.waitFor(() => backend.expectOne({ method: 'POST', url: '/api/push/enable' }));
        expect(request.request.body).toEqual(SUBSCRIPTION);
        request.flush({});
        await enabled;

        expect(browserPush.requestedKeys).toEqual(['public-key']);
        expect(pushNotificationService.enabled()).toBe(true);
    });

    test('tells the server before it unsubscribes', async () => {
        const browserPush: BrowserPush = new BrowserPush();
        browserPush.subscription.next(SUBSCRIPTION);
        const [pushNotificationService, backend] = setup(browserPush);
        expect(pushNotificationService.enabled()).toBe(true);

        const disabled: Promise<void> = pushNotificationService.disable();
        const request: TestRequest = await vi.waitFor(() => backend.expectOne({ method: 'POST', url: '/api/push/disable' }));
        expect(request.request.body).toEqual(SUBSCRIPTION);
        // the server can still reach the browser until it knows
        expect(pushNotificationService.enabled()).toBe(true);
        request.flush({});
        await disabled;

        expect(pushNotificationService.enabled()).toBe(false);
    });

    test('is not available and does nothing on disable without the service worker', async () => {
        const [pushNotificationService] = setup(new DisabledPush());

        expect(pushNotificationService.available).toBe(false);
        expect(pushNotificationService.enabled()).toBe(false);
        await pushNotificationService.disable();
    });
});