import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Provider } from '@angular/core';

import { RichTextConfig } from './rich-text-config.model';
import { DEFAULT_RICH_TEXT_CONFIG, RICH_TEXT_CONFIG } from './rich-text-config.provider';
import { RichTextDomPurifyOptions } from './rich-text-dom-purify-options.model';
import { RichTextDomPurifyWindow } from './rich-text-dom-purify-window.type';
import { RichTextDomPurify } from './rich-text-dom-purify.type';

/**
 * Sanitizes rich texts with DOMPurify, which is less strict than the sanitizer of Angular: it keeps ids, inline styles
 * and the elements you allow, like iframes. Pass it the default export of 'dompurify', which your app installs:
 * `provideRichTextDomPurify(DOMPurify)`. Only the pages that use rich texts load it.
 * DOMPurify needs a dom, which a page rendered on the server doesn't have. Give it one with serverWindow, like
 * `new JSDOM('').window`, so the server writes the same html as the browser; without one, the sanitizer of Angular
 * sanitizes on the server, and DOMPurify once the page runs in the browser.
 * Provide it in the application config for the whole app, or in a component or route for only that part of it.
 * @param domPurify - The default export of 'dompurify'.
 * @param options - The config of DOMPurify, and the window it sanitizes in on the server.
 * @returns The provider for RICH_TEXT_CONFIG.
 */
export function provideRichTextDomPurify<Config extends object>(
    domPurify: RichTextDomPurify<Config>,
    options: RichTextDomPurifyOptions<Config> = {}
): Provider {
    return {
        provide: RICH_TEXT_CONFIG,
        useFactory: (): RichTextConfig => {
            const parent: RichTextConfig = inject(RICH_TEXT_CONFIG, { skipSelf: true, optional: true }) ?? DEFAULT_RICH_TEXT_CONFIG;
            const window: RichTextDomPurifyWindow | null | undefined = isPlatformBrowser(inject(PLATFORM_ID))
                ? inject(DOCUMENT).defaultView
                : options.serverWindow;
            if (window == undefined) {
                return parent;
            }
            // one DOMPurify per injector, created when the first rich text needs it, not at import time.
            const purify: ReturnType<RichTextDomPurify<Config>> = domPurify(window);
            return { ...parent, sanitize: html => purify.sanitize(html, options.config) };
        }
    };
}