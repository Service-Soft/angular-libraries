import { NgTemplateOutlet } from '@angular/common';
import { afterNextRender, booleanAttribute, Component, computed, contentChild, ElementRef, inject, Injector, input, InputSignal, InputSignalWithTransform, model, ModelSignal, output, OutputEmitterRef, Signal, TemplateRef, viewChild } from '@angular/core';
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { LinkComponent } from '@service-soft/ui/link';

import { ConsentGateConfig } from './consent-gate-config.model';
import { CONSENT_GATE_CONFIG } from './consent-gate-config.provider';
import { ConsentGateLabels } from './consent-gate-labels.model';
import { ConsentGate } from './consent-gate.model';

/**
 * Loads content of a third party, like a map, a video or any other embed, only once the user allowed it. Until then it
 * shows a placeholder: who the content is from, why it needs consent, links to the privacy policies and a button that
 * loads it, and optionally one that always allows the provider. The content is an `<ng-template>` inside, so nothing of
 * it exists before the consent:
 * `<ui-consent-gate provider="YouTube" [(consented)]="consented"><ng-template><ui-iframe … /></ng-template></ui-consent-gate>`.
 * Bind consented to where the app keeps the consent, and keep it when alwaysAllowed emits. Set it in the browser after
 * the first render, so a page rendered on the server and its hydration agree.
 * Unset inputs fall back to the values provided with provideConsentGateConfig.
 */
@Component({
    selector: 'ui-consent-gate',
    templateUrl: './consent-gate.component.html',
    imports: [ButtonComponent, IconComponent, LinkComponent, NgTemplateOutlet],
    providers: [{ provide: ConsentGate, useExisting: ConsentGateComponent }],
    host: {
        // a grid of one cell, which the placeholder and the content fill: with a ratio its height is that of the ratio,
        // and it still grows with a placeholder whose text doesn't fit, so nothing is ever cut off.
        class: 'grid',
        '[style.aspect-ratio]': 'aspectRatio()'
    }
})
export class ConsentGateComponent implements ConsentGate {
    private readonly config: ConsentGateConfig = inject(CONSENT_GATE_CONFIG);

    private readonly injector: Injector = inject(Injector);

    private readonly loaded: Signal<ElementRef<HTMLElement> | undefined> = viewChild<ElementRef<HTMLElement>>('loaded');

    /**
     * The content that loads after the consent, as an ng-template.
     */
    protected readonly content: Signal<TemplateRef<unknown>> = contentChild.required(TemplateRef);

    /**
     * The name of who the content is from, like 'Google Maps' or 'YouTube'.
     */
    readonly provider: InputSignal<string> = input.required<string>();

    /**
     * The url of your privacy policy. The default comes from provideConsentGateConfig.
     */
    readonly privacyPolicyUrl: InputSignal<string | undefined> = input<string | undefined>(this.config.privacyPolicyUrl);

    /**
     * The url of the privacy policy of the provider, which opens in a new tab.
     */
    readonly providerPrivacyPolicyUrl: InputSignal<string | undefined> = input<string>();

    /**
     * Whether there is a button that always allows content of the provider. Keep that choice when alwaysAllowed emits.
     */
    readonly alwaysAllow: InputSignalWithTransform<boolean, unknown> = input(this.config.alwaysAllow, { transform: booleanAttribute });

    /**
     * The ratio of the width to the height, like '16 / 9', which the placeholder keeps as well, so nothing moves when
     * the content loads. Undefined is the height of what shows.
     */
    readonly aspectRatio: InputSignal<string | undefined> = input<string | undefined>(this.config.aspectRatio);

    /**
     * Whether the user allowed the content, which then loads. Bind it with [(consented)].
     */
    readonly consented: ModelSignal<boolean> = model(false);

    /**
     * Emits when the user chose to always allow content of the provider, for the app to keep.
     */
    readonly alwaysAllowed: OutputEmitterRef<void> = output();

    /**
     * The texts of the placeholder.
     */
    protected readonly labels: Signal<ConsentGateLabels> = computed(() => {
        const provider: string = this.provider();
        return {
            title: this.config.title(provider),
            description: this.config.description(provider),
            providerPrivacyPolicy: this.config.providerPrivacyPolicyLabel(provider),
            load: this.config.loadLabel(provider),
            alwaysAllow: this.config.alwaysAllowLabel(provider)
        };
    });

    /**
     * The link to your privacy policy.
     */
    protected readonly privacyPolicyLabel: string = this.config.privacyPolicyLabel;

    /**
     * The icon above the title.
     */
    protected readonly icon: IconDefinition = faShieldHalved;

    /**
     * Loads the content this once.
     */
    protected load(): void {
        this.consented.set(true);
        this.focusContent();
    }

    /**
     * Loads the content and tells the app to always allow the provider.
     */
    protected allowAlways(): void {
        this.consented.set(true);
        this.alwaysAllowed.emit();
        this.focusContent();
    }

    // the button that had the focus is gone with the placeholder. The content takes it, so the next Tab goes into it
    // instead of starting at the top of the page.
    private focusContent(): void {
        afterNextRender(() => this.loaded()?.nativeElement.focus(), { injector: this.injector });
    }
}