import path from 'node:path';

import { describe, expect, test } from 'vitest';

import { BumpVersionUtilities } from '../scripts/bump-version';

const RELEASED: ReadonlySet<string> = new Set(['@service-soft/ui', '@service-soft/ngx-error-handling']);

describe('BumpVersionUtilities', () => {
    test('bumps the version and the ranges of the released libraries, and keeps every other range', () => {
        const manifest: string = JSON.stringify({
            name: '@service-soft/ngx-entity',
            version: '0.0.1',
            peerDependencies: { '@angular/core': '^22.2.0', '@service-soft/ui': '0.0.1', '@service-soft/ngx-error-handling': '0.0.1' },
            peerDependenciesMeta: { '@service-soft/ui': { optional: true } },
            dependencies: { tslib: '^2.3.0' }
        }, undefined, 4);

        expect(JSON.parse(BumpVersionUtilities.bumpManifest(manifest, '22.0.0', RELEASED))).toEqual({
            name: '@service-soft/ngx-entity',
            version: '22.0.0',
            peerDependencies: { '@angular/core': '^22.2.0', '@service-soft/ui': '^22.0.0', '@service-soft/ngx-error-handling': '^22.0.0' },
            peerDependenciesMeta: { '@service-soft/ui': { optional: true } },
            dependencies: { tslib: '^2.3.0' }
        });
    });

    test('writes the file in its own format, with a newline at the end only where there was one', () => {
        const manifest: string = JSON.stringify({ name: '@service-soft/ui', version: '0.0.1' }, undefined, 4);

        expect(BumpVersionUtilities.bumpManifest(manifest, '22.0.0', RELEASED)).toBe('{\n    "name": "@service-soft/ui",\n    "version": "22.0.0"\n}');
        expect(BumpVersionUtilities.bumpManifest(`${manifest}\n`, '22.0.0', RELEASED).endsWith('}\n')).toBe(true);
    });

    test('refuses a version that is no complete semver version', () => {
        expect(() => BumpVersionUtilities.validateVersion(undefined)).toThrow('usage');
        expect(() => BumpVersionUtilities.validateVersion('22')).toThrow('usage');
        expect(() => BumpVersionUtilities.validateVersion('22.0.0')).not.toThrow();
        expect(() => BumpVersionUtilities.validateVersion('22.1.0-next.1')).not.toThrow();
    });

    test('finds every library of the workspace that gets published, but not the private ones or the showcase', () => {
        const names: string[] = BumpVersionUtilities.findPublishedManifests(path.resolve(import.meta.dirname, '../projects'))
            .map(manifestPath => path.basename(path.dirname(manifestPath)))
            .sort((a, b) => a.localeCompare(b));

        expect(names).toEqual([
            'ngx-auth',
            'ngx-change-sets',
            'ngx-ecommerce',
            'ngx-entity',
            'ngx-error-handling',
            'ngx-navigation',
            'ngx-persistence-logger',
            'ngx-pwa',
            'ngx-tracking',
            'ui'
        ]);
    });
});