/**
 * Where the PushNotificationService sends the subscriptions of the browsers.
 */
export type PushNotificationsConfig = {
    /**
     * The public key of your VAPID key pair, which your server signs its push messages with. Generate a pair with
     * `npx web-push generate-vapid-keys`.
     */
    vapidPublicKey: string,
    /**
     * The url the subscription of a browser is posted to when the user turns push notifications on.
     */
    enableUrl: string,
    /**
     * The url the subscription of a browser is posted to when the user turns push notifications off.
     */
    disableUrl: string
};