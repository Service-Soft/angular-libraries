import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const ROOT: string = path.resolve(import.meta.dirname, '..');
const LIBRARIES: string[] = ['ui', 'ngx-change-sets', 'ngx-persistence-logger', 'ngx-tracking', 'ngx-pwa', 'ngx-auth', 'ngx-error-handling', 'ngx-navigation', 'ngx-entity', 'ngx-ecommerce', 'testing'];

/**
 * The part of a built package.json that says what can be imported.
 */
type BuiltPackage = {
    /**
     * The import paths of the package, like './button'.
     */
    exports: Record<string, unknown>
};

/**
 * Finds the secondary entry points in the sources of a library: every directory next to src with a public-api.ts.
 * @param library - The directory of the library in projects.
 * @returns The import paths, like './button'.
 */
function findSourceEntryPoints(library: string): string[] {
    const libraryPath: string = path.join(ROOT, 'projects', library);
    return readdirSync(libraryPath, { withFileTypes: true })
        .filter(entry => entry.isDirectory() && entry.name !== 'src')
        .filter(entry => existsSync(path.join(libraryPath, entry.name, 'public-api.ts')))
        .map(entry => `./${entry.name}`);
}

// specs and stories import the sources through the paths of the tsconfig, so they work whether the build has an entry
// point or not. Only the built package shows what a consumer can import.
describe('entry points', () => {
    test.for(LIBRARIES)('the build of %s exports every entry point of its sources', library => {
        const built: BuiltPackage = JSON.parse(readFileSync(path.join(ROOT, 'dist', library, 'package.json'), 'utf8')) as BuiltPackage;
        expect(Object.keys(built.exports)).toEqual(expect.arrayContaining(findSourceEntryPoints(library)));
    });
});