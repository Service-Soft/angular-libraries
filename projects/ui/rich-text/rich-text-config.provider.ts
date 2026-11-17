import { inject, InjectionToken, Provider } from '@angular/core';

import { RichTextConfig } from './rich-text-config.model';

/**
 * The values of a rich text when nothing provides them: the sanitizer of Angular.
 */
export const DEFAULT_RICH_TEXT_CONFIG: RichTextConfig = {
    sanitize: undefined
};

/**
 * The values every rich text below this injector uses.
 * Change them with provideRichTextConfig, or provideRichTextDomPurify for DOMPurify.
 */
export const RICH_TEXT_CONFIG: InjectionToken<RichTextConfig> = new InjectionToken<RichTextConfig>('RICH_TEXT_CONFIG', {
    providedIn: 'root',
    factory: () => DEFAULT_RICH_TEXT_CONFIG
});

/**
 * Changes the values rich texts use, like the function that makes their html safe to show.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * Values you leave out are taken from the parent injector.
 * @param config - The values to change.
 * @returns The provider for RICH_TEXT_CONFIG.
 */
export function provideRichTextConfig(config: Partial<RichTextConfig>): Provider {
    return {
        provide: RICH_TEXT_CONFIG,
        useFactory: (): RichTextConfig => ({
            ...inject(RICH_TEXT_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_RICH_TEXT_CONFIG,
            ...config
        })
    };
}