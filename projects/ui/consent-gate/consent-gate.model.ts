import { ModelSignal, OutputEmitterRef } from '@angular/core';

/**
 * What decides whether embedded content loads: a ui-consent-gate, or a component built on one, like ui-map. Inject it
 * to bind the consent to where the app keeps it, like the bridge of @service-soft/ngx-tracking does.
 */
export abstract class ConsentGate {
    /**
     * Whether the user allowed the content, which then loads.
     */
    abstract readonly consented: ModelSignal<boolean>;

    /**
     * Emits when the user chose to always allow content of this provider, for the app to keep.
     */
    abstract readonly alwaysAllowed: OutputEmitterRef<void>;
}