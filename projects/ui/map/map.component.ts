import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, model, ModelSignal, output, OutputEmitterRef, Signal } from '@angular/core';
import { faDiamondTurnRight } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { CONSENT_GATE_CONFIG, ConsentGate, ConsentGateComponent } from '@service-soft/ui/consent-gate';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { IframeComponent } from '@service-soft/ui/iframe';
import { LINK_CONFIG } from '@service-soft/ui/link';

import { MapConfig } from './map-config.model';
import { MAP_CONFIG } from './map-config.provider';
import { MapLocation } from './map-location.model';
import { MapProvider } from './map-provider.model';

/**
 * A map of a location, like the one of a business, behind a ui-consent-gate: it only loads from its provider once the
 * user allowed it. Below it, a link plans the route there with the provider, which needs no consent, as it is only a
 * link. Google Maps is the default provider, OPEN_STREET_MAP_PROVIDER is built in as well, and any other works through
 * a MapProvider of your own.
 * Bind consented like the one of a ui-consent-gate. Unset inputs fall back to the values provided with
 * provideMapConfig, alwaysAllow to the one of provideConsentGateConfig.
 */
@Component({
    selector: 'ui-map',
    templateUrl: './map.component.html',
    imports: [ButtonComponent, ConsentGateComponent, IconComponent, IframeComponent],
    providers: [{ provide: ConsentGate, useExisting: MapComponent }],
    host: {
        class: 'flex flex-col gap-3'
    }
})
export class MapComponent implements ConsentGate {
    private readonly config: MapConfig = inject(MAP_CONFIG);

    /**
     * What the map shows: an address, its coordinates, or both. OpenStreetMap needs the coordinates.
     */
    readonly location: InputSignal<MapLocation> = input.required<MapLocation>();

    /**
     * Where the map comes from. The default comes from provideMapConfig, Google Maps.
     */
    readonly provider: InputSignal<MapProvider> = input<MapProvider>(this.config.provider);

    /**
     * How close the map is, from 1 for the whole earth to about 20 for a house.
     */
    readonly zoom: InputSignal<number> = input<number>(this.config.zoom);

    /**
     * The ratio of the width of the map to its height, like '16 / 9', which the placeholder before the consent keeps as
     * well. Undefined fills the height you give the map, like with h-96.
     */
    readonly aspectRatio: InputSignal<string | undefined> = input<string | undefined>(this.config.aspectRatio);

    /**
     * What screen readers call the map, like 'Map of the practice'.
     */
    readonly label: InputSignal<string> = input<string>(this.config.label);

    /**
     * Whether there is a button that always allows the provider. Keep that choice when alwaysAllowed emits.
     */
    readonly alwaysAllow: InputSignalWithTransform<boolean, unknown> = input(inject(CONSENT_GATE_CONFIG).alwaysAllow, {
        transform: booleanAttribute
    });

    /**
     * Whether the user allowed the map, which then loads. Bind it with [(consented)].
     */
    readonly consented: ModelSignal<boolean> = model(false);

    /**
     * Emits when the user chose to always allow the provider, for the app to keep.
     */
    readonly alwaysAllowed: OutputEmitterRef<void> = output();

    /**
     * The text of the route link.
     */
    protected readonly routeLabel: string = this.config.routeLabel;

    /**
     * Read after the text of the route link, which opens in a new tab.
     */
    protected readonly newTabLabel: string = inject(LINK_CONFIG).newTabLabel;

    /**
     * The icon of the route link.
     */
    protected readonly routeIcon: IconDefinition = faDiamondTurnRight;

    /**
     * The url of the map, which only loads after the consent.
     */
    protected readonly embedUrl: Signal<string> = computed(() => this.provider().resolveEmbedUrl(this.location(), this.zoom()));

    /**
     * The url of the route to the location.
     */
    protected readonly routeUrl: Signal<string> = computed(() => this.provider().resolveRouteUrl(this.location()));
}