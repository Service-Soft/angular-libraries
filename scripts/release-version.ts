import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { BumpVersionUtilities } from './bump-version.ts';

/**
 * A library that gets published.
 */
type ReleasedLibrary = {
    /**
     * The name it is published under, like '@service-soft/ui'.
     */
    name: string,
    /**
     * The version it is published with.
     */
    version: string,
    /**
     * Its directory in projects and in dist, like 'ui'.
     */
    directory: string
};

/**
 * What the release workflow publishes: the version of every library, the npm tag it goes out under, and the libraries
 * the registry doesn't have at that version yet.
 */
export abstract class ReleaseVersionUtilities {
    /**
     * Resolves the one version every library is released with.
     * @param libraries - The published libraries of the workspace.
     * @returns The version they share.
     * @throws {Error} When they don't share one, which `npm run release:bump` fixes.
     */
    static resolveVersion(libraries: readonly ReleasedLibrary[]): string {
        const versions: Set<string> = new Set(libraries.map(library => library.version));
        const [version] = versions;
        if (versions.size !== 1 || version == undefined) {
            throw new Error(`the libraries have different versions (${[...versions].join(', ')}): run npm run release:bump first`);
        }
        return version;
    }

    /**
     * Resolves the npm tag a version goes out under: `next` for a prerelease, `latest` for the newest major, and
     * `latest-<major>` for a fix to an older one, so it doesn't replace what `npm install` gets.
     * @param version - The version that is released.
     * @param latest - The version the `latest` tag points to on the registry, or undefined before the first release.
     * @returns The tag.
     */
    static resolveDistTag(version: string, latest: string | undefined): string {
        if (version.includes('-')) {
            return 'next';
        }
        const major: number = Number(version.split('.')[0]);
        return latest == undefined || major >= Number(latest.split('.')[0]) ? 'latest' : `latest-${major}`;
    }

    /**
     * Finds a field of a package on the registry, like the version a tag points to.
     * @param spec - The package, with a version where it asks about one, like '@service-soft/ui@22.0.0'.
     * @param field - The field, like 'dist-tags.latest'.
     * @returns Its value, or undefined when the registry has none, like for a version that isn't published.
     */
    static findRegistryField(spec: string, field: string): string | undefined {
        try {
            // npm answers a missing package or version with an error, whose log only clutters the output
            const value: string = execFileSync('npm', ['view', spec, field], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'ignore']
            }).trim();
            return value === '' ? undefined : value;
        }
        catch {
            return undefined;
        }
    }
}

// only when run as a script, not when a test imports the utilities. Writes the outputs of the release workflow.
if (process.argv[1] != undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const manifestPaths: string[] = BumpVersionUtilities.findPublishedManifests(path.resolve(import.meta.dirname, '../projects'));
    // named by their directory in projects and dist, which the workflow publishes them from
    const libraries: ReleasedLibrary[] = manifestPaths.map(manifestPath => {
        const { name, version } = JSON.parse(readFileSync(manifestPath, 'utf8')) as ReleasedLibrary;
        return { name, version, directory: path.basename(path.dirname(manifestPath)) };
    });
    const version: string = ReleaseVersionUtilities.resolveVersion(libraries);
    // ui is the one every other library needs, so it is released every time
    const latest: string | undefined = ReleaseVersionUtilities.findRegistryField('@service-soft/ui', 'dist-tags.latest');
    const distTag: string = ReleaseVersionUtilities.resolveDistTag(version, latest);
    // a release that went out halfway is finished by the next run, since npm refuses to publish over a version. Separated
    // by spaces, which the workflow loops over.
    const unpublished: string[] = libraries
        .filter(library => ReleaseVersionUtilities.findRegistryField(`${library.name}@${version}`, 'version') == undefined)
        .map(library => library.directory);
    if (!unpublished.length) {
        throw new Error(`every library is published at ${version} already: bump the version first`);
    }
    process.stdout.write(`version=${version}\ndist_tag=${distTag}\npublish=${unpublished.join(' ')}\n`);
}