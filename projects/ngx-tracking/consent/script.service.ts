import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID, Service } from '@angular/core';

/**
 * Loads the external scripts of trackings, like the one of Google Analytics, and removes them again.
 */
@Service()
export class ScriptService {
    private readonly document: Document = inject(DOCUMENT);

    private readonly isBrowser: boolean = isPlatformBrowser(inject(PLATFORM_ID));

    /**
     * Adds a script to the head of the page, unless a script with the same id is there already. Does nothing on the
     * server.
     * @param id - The id of the script element, to find it again.
     * @param src - The url of the script.
     * @returns A promise that resolves when the script loaded, and rejects when it failed to.
     */
    async loadScript(id: string, src: string): Promise<void> {
        if (!this.isBrowser || this.document.getElementById(id)) {
            return;
        }
        const script: HTMLScriptElement = this.document.createElement('script');
        script.id = id;
        script.src = src;
        script.async = true;
        await new Promise<void>((resolve, reject) => {
            script.addEventListener('load', () => resolve());
            script.addEventListener('error', () => reject(new Error(`Failed to load the script ${src}`)));
            this.document.head.append(script);
        });
    }

    /**
     * Adds a script like loadScript, without waiting for it. A script that fails to load, like one an ad blocker
     * blocked, is only written to the console.
     * @param id - The id of the script element, to find it again.
     * @param src - The url of the script.
     */
    loadScriptInBackground(id: string, src: string): void {
        void this.tryLoadScript(id, src);
    }

    /**
     * Removes a script from the page. What it already started keeps running until the page loads again.
     * @param id - The id of the script element.
     */
    removeScript(id: string): void {
        if (this.isBrowser) {
            this.document.getElementById(id)?.remove();
        }
    }

    private async tryLoadScript(id: string, src: string): Promise<void> {
        try {
            await this.loadScript(id, src);
        }
        catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
        }
    }
}