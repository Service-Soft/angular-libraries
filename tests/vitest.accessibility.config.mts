import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// the AXE checks of the stories on their own, against a storybook built before: CI splits them over several jobs, which
// only need storybook, not the libraries and the showcase the global setup of the other workspace tests builds.
export default defineConfig({
    test: {
        root: fileURLToPath(new URL('..', import.meta.url)),
        include: ['tests/accessibility.spec.ts'],
        testTimeout: 60_000
    }
});