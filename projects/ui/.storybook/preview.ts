// the default texts of the libraries are $localize, which an app defines with this polyfill
import '@angular/localize/init';
import { Preview } from '@storybook/angular';

import { PAGE_LEVEL_RULES } from './page-level-rules';

// whether the app runs on a server, which the angular cli defines in every bundle, but storybook's webpack doesn't.
// Angular reads it unguarded since 22.2.6 (`ngDevMode || ngServerMode`), so every story threw a ReferenceError in a
// production build. The cli sets it on globalThis as well, for its server bundles.
globalThis.ngServerMode ??= false;

const preview: Preview = {
    parameters: {
        a11y: {
            // every story has to pass all AXE checks.
            test: 'error',
            config: { rules: PAGE_LEVEL_RULES.map(id => ({ id, enabled: false })) }
        }
    },
    globalTypes: {
        theme: {
            description: 'Light or dark mode',
            toolbar: { title: 'Theme', icon: 'mirror', items: ['system', 'light', 'dark'], dynamicTitle: true }
        }
    },
    initialGlobals: {
        theme: 'system'
    },
    decorators: [
        // the same classes a consumer's toggle would set, system leaves the choice to the operating system.
        (story, context) => {
            const theme: unknown = context.globals['theme'];
            document.documentElement.classList.toggle('light', theme === 'light');
            document.documentElement.classList.toggle('dark', theme === 'dark');
            return story();
        }
    ]
};
export default preview;