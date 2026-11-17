import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vitest/config';

// workspace level tests that build real packages and apps, separate from the angular unit tests run by `ng test`.
export default defineConfig({
    test: {
        root: fileURLToPath(new URL('..', import.meta.url)),
        include: ['tests/**/*.spec.ts'],
        globalSetup: ['tests/global-setup.ts'],
        hookTimeout: 300_000,
        testTimeout: 60_000
    }
});