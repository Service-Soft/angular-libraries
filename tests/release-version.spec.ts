import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { BumpVersionUtilities } from '../scripts/bump-version';
import { ReleaseVersionUtilities } from '../scripts/release-version';

const ROOT: string = path.resolve(import.meta.dirname, '..');

describe('ReleaseVersionUtilities', () => {
    test('releases the one version every library has, and refuses libraries with different ones', () => {
        expect(ReleaseVersionUtilities.resolveVersion([
            { name: '@service-soft/ui', version: '22.0.0', directory: 'ui' },
            { name: '@service-soft/ngx-pwa', version: '22.0.0', directory: 'ngx-pwa' }
        ])).toBe('22.0.0');
        expect(() => ReleaseVersionUtilities.resolveVersion([
            { name: '@service-soft/ui', version: '22.0.0', directory: 'ui' },
            { name: '@service-soft/ngx-pwa', version: '0.0.1', directory: 'ngx-pwa' }
        ])).toThrow('release:bump');
    });

    // the release workflow publishes the libraries it lists, in that order: a library missing there is never published
    test('the release workflow publishes every library that isn\'t private, ui first', () => {
        const workflow: string = readFileSync(path.join(ROOT, '.github/workflows/cd.yml'), 'utf8');
        const listed: string[] = /^\s*LIBRARIES: (.+)$/m.exec(workflow)?.[1]?.trim().split(' ') ?? [];
        const published: string[] = BumpVersionUtilities.findPublishedManifests(path.join(ROOT, 'projects'))
            .map(manifestPath => path.basename(path.dirname(manifestPath)));

        expect(listed[0]).toBe('ui');
        expect([...listed].sort((a, b) => a.localeCompare(b))).toEqual(published.sort((a, b) => a.localeCompare(b)));
    });

    test('tags the newest major latest, a fix to an older one latest-<major>, and a prerelease next', () => {
        expect(ReleaseVersionUtilities.resolveDistTag('22.0.0', undefined)).toBe('latest');
        expect(ReleaseVersionUtilities.resolveDistTag('22.1.0', '22.0.0')).toBe('latest');
        expect(ReleaseVersionUtilities.resolveDistTag('23.0.0', '22.4.1')).toBe('latest');
        expect(ReleaseVersionUtilities.resolveDistTag('22.4.2', '23.0.0')).toBe('latest-22');
        expect(ReleaseVersionUtilities.resolveDistTag('23.0.0-next.1', '22.4.1')).toBe('next');
    });
});