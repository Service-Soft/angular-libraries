import { ThemeMode } from './theme-mode.type';

/**
 * The key of localStorage the mode a user chose is kept under.
 */
const STORAGE_KEY: string = 'ui-theme-mode';

/**
 * Remembers the theme mode a user chose and applies it to a page, with the classes `light` and `dark` of ui's theme.
 */
export abstract class ThemeModeUtilities {
    /**
     * The key of localStorage the mode a user chose is kept under.
     */
    static readonly STORAGE_KEY: string = STORAGE_KEY;

    /**
     * A script for the `<head>` of your index.html, which sets the class of the mode the user chose before the page is
     * painted: `<script>…</script>`. Without it, a prerendered page shows in the mode of the operating system until the
     * app has started, and then switches.
     */
    // es5 and no line breaks, so it can be pasted as it is and runs in every browser before anything else loaded.
    // The storage can be blocked, which throws, and then the page simply follows the operating system.
    static readonly INIT_SCRIPT: string = `try{var m=localStorage.getItem('${STORAGE_KEY}');`
        + 'if(m===\'light\'||m===\'dark\')document.documentElement.classList.add(m)}catch(e){}';

    /**
     * Finds the mode the user chose in this browser.
     * @param window - The window of the page, whose localStorage is read.
     * @returns The mode, or undefined when the user chose none or the storage is blocked.
     */
    static findStoredMode(window: Window): Exclude<ThemeMode, 'system'> | undefined {
        try {
            const stored: string | null = window.localStorage.getItem(STORAGE_KEY);
            return stored === 'light' || stored === 'dark' ? stored : undefined;
        }
        catch {
            // a blocked storage throws on access: the page follows the operating system then
            return undefined;
        }
    }

    /**
     * Remembers the mode the user chose in this browser. Following the operating system removes what was stored.
     * @param window - The window of the page, whose localStorage is written.
     * @param mode - The chosen mode.
     */
    static store(window: Window, mode: ThemeMode): void {
        try {
            if (mode === 'system') {
                window.localStorage.removeItem(STORAGE_KEY);
                return;
            }
            window.localStorage.setItem(STORAGE_KEY, mode);
        }
        catch {
            // a blocked storage throws on access: the mode then applies until the page is left
        }
    }

    /**
     * Applies a mode to an element and everything inside of it, like `<html>` for the whole page.
     * @param element - The element.
     * @param mode - The mode. 'system' removes the classes, so the operating system decides.
     */
    static apply(element: HTMLElement, mode: ThemeMode): void {
        element.classList.remove('light', 'dark');
        if (mode !== 'system') {
            element.classList.add(mode);
        }
    }
}