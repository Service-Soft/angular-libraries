import { afterNextRender, Directive, effect, inject, Injector, input, InputSignal, signal, Type, WritableSignal } from '@angular/core';
import { TrackingService } from '@service-soft/ngx-tracking/consent';
import { ConsentGate } from '@service-soft/ui/consent-gate';

/**
 * Binds a ui-consent-gate, or a component built on one like ui-map, to a tracking of the consent:
 * `<ui-map [ngxConsentTracking]="googleMapsConsent" …>`, with an EmbedTrackingService like GoogleMapsConsent listed in
 * the trackings of provideTrackingConsent. The content follows the consent right away: it loads where the user allowed
 * the tracking, also when they allow it in the consent dialog later, and is removed again when they forbid it there.
 * "Always allow" of the gate allows the tracking, which the consent dialog shows from then on.
 */
@Directive({
    selector: '[ngxConsentTracking]'
})
export class ConsentTrackingDirective {
    private readonly injector: Injector = inject(Injector);

    // the consent is in the localStorage, so only in the browser, after the first render: the server renders the
    // placeholder, and the hydration has to find the same.
    private readonly rendered: WritableSignal<boolean> = signal(false);

    /**
     * The tracking whose consent loads the content, like GoogleMapsConsent.
     */
    readonly ngxConsentTracking: InputSignal<Type<TrackingService>> = input.required<Type<TrackingService>>();

    constructor() {
        const gate: ConsentGate = inject(ConsentGate, { self: true });
        afterNextRender(() => this.rendered.set(true));
        // a choice of the dialog applies to the content that shows already, both ways. A load of this once, without the
        // tracking, lasts until the tracking changes.
        effect(() => {
            if (this.rendered()) {
                gate.consented.set(this.resolveTracking().enabled());
            }
        });
        gate.alwaysAllowed.subscribe(() => void this.resolveTracking().enable());
    }

    private resolveTracking(): TrackingService {
        return this.injector.get(this.ngxConsentTracking());
    }
}