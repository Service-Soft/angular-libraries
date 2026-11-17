import { inject, InjectionToken, Provider } from '@angular/core';

import { TestimonialConfig } from './testimonial-config.model';

const DEFAULT_TESTIMONIAL_CONFIG: TestimonialConfig = {
    variant: 'card'
};

/**
 * The values every testimonial below this injector uses when its inputs are not set.
 * Change them with provideTestimonialConfig.
 */
export const TESTIMONIAL_CONFIG: InjectionToken<TestimonialConfig> = new InjectionToken<TestimonialConfig>('TESTIMONIAL_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_TESTIMONIAL_CONFIG
});

/**
 * Changes the values testimonials use when their inputs are not set.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for TESTIMONIAL_CONFIG.
 */
export function provideTestimonialConfig(config: Partial<TestimonialConfig>): Provider {
    return {
        provide: TESTIMONIAL_CONFIG,
        useFactory: (): TestimonialConfig => ({
            ...inject(TESTIMONIAL_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_TESTIMONIAL_CONFIG,
            ...config
        })
    };
}