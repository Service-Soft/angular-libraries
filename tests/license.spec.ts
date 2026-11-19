import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from 'vitest';

import { BumpVersionUtilities } from '../scripts/bump-version';

const ROOT: string = path.resolve(import.meta.dirname, '..');

// ng-packagr only copies a LICENSE from the folder of a package, never from outside of it, so every published package
// has its own copy of the license of the repository, which this keeps the same.
test('every published package has the license of the repository', () => {
    const license: string = readFileSync(path.join(ROOT, 'LICENSE.md'), 'utf8');
    const manifestPaths: string[] = BumpVersionUtilities.findPublishedManifests(path.join(ROOT, 'projects'));

    expect(manifestPaths.length).toBeGreaterThan(0);
    for (const manifestPath of manifestPaths) {
        expect(readFileSync(path.join(path.dirname(manifestPath), 'LICENSE'), 'utf8'), manifestPath).toBe(license);
    }
});