import { formatPercent } from '@angular/common';
import { Component, computed, inject, input, InputSignal, LOCALE_ID, Signal } from '@angular/core';

import { FunnelPoint } from './funnel-point.model';
import { FunnelStepView } from './funnel-step-view.model';

/**
 * Shows how many visitors reached each step of a funnel, like visit, add to cart and purchase, as a list with the
 * value and share of every step, and shapes that narrow from step to step.
 */
@Component({
    selector: 'ngx-funnel',
    templateUrl: './funnel.component.html',
    host: { class: 'block' }
})
export class FunnelComponent {
    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The steps, the widest first.
     */
    readonly funnelPoints: InputSignal<FunnelPoint[]> = input.required<FunnelPoint[]>();

    /**
     * The name of the funnel for screen readers, like 'Checkout'. Not needed when a heading right before it names it.
     */
    readonly label: InputSignal<string | undefined> = input<string>();

    /**
     * The steps with their share of the first one.
     */
    protected readonly steps: Signal<FunnelStepView[]> = computed(() => {
        const points: FunnelPoint[] = this.funnelPoints();
        const first: number = points[0]?.value ?? 0;
        // a funnel nobody entered has no shares, so every shape stays empty instead of dividing by zero.
        const shares: number[] = points.map(point => first > 0 ? point.value / first : 0);
        return points.map((point, index) => ({
            name: point.name,
            value: point.value,
            percent: formatPercent(shares[index], this.locale),
            width: `${shares[index] * 100}%`,
            clipPath: this.resolveClipPath(shares[index], shares[index + 1])
        }));
    });

    // the shape narrows at its bottom to the width of the next step, the same on both sides.
    private resolveClipPath(share: number, nextShare: number | undefined): string | undefined {
        if (nextShare == undefined || share === 0) {
            return undefined;
        }
        const inset: number = ((share - nextShare) / share) * 50;
        return `polygon(0 0, 100% 0, ${100 - inset}% 100%, ${inset}% 100%)`;
    }
}