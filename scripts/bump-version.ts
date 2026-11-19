import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * The fields of a package.json that name other packages with a version range.
 */
const DEPENDENCY_FIELDS: readonly string[] = ['dependencies', 'peerDependencies', 'devDependencies', 'optionalDependencies'];

/**
 * The parts of a package.json the bump reads, everything else is kept as it is.
 */
type PackageManifest = Record<string, unknown> & {
    /**
     * The name it is published under, like '@service-soft/ui'.
     */
    name: string,
    /**
     * The version it is published with.
     */
    version: string,
    /**
     * Whether it is never published, like testing.
     */
    private?: boolean
};

/**
 * The version ranges of a dependency field, by the name of the package.
 */
type DependencyRanges = Record<string, string>;

/**
 * Bumps every published library of the workspace to one version, and the ranges they require each other in to it.
 * The libraries follow the major of Angular they are built for, so they are always released together.
 */
export abstract class BumpVersionUtilities {
    /**
     * Sets the version of a package.json, and every range of a released library in it to the same version.
     * @param text - The package.json as it is in the file.
     * @param version - The version to release, like '22.0.0'.
     * @param releasedNames - The names of the libraries released together.
     * @returns The package.json as it is written back, in the format of the original.
     */
    static bumpManifest(text: string, version: string, releasedNames: ReadonlySet<string>): string {
        const manifest: PackageManifest = JSON.parse(text) as PackageManifest;
        const bumped: PackageManifest = { ...manifest, version };
        for (const field of DEPENDENCY_FIELDS) {
            const ranges: DependencyRanges | undefined = manifest[field] as DependencyRanges | undefined;
            if (ranges == undefined) {
                continue;
            }
            bumped[field] = Object.fromEntries(
                Object.entries(ranges).map(([name, range]) => [name, releasedNames.has(name) ? `^${version}` : range])
            );
        }
        // written the way the files are: four spaces, and a newline at the end only where there was one
        return `${JSON.stringify(bumped, undefined, 4)}${text.endsWith('\n') ? '\n' : ''}`;
    }

    /**
     * Validates that a version is a complete semver version, like '22.0.0' or '22.1.0-next.1'.
     * @param version - The version from the command line.
     * @throws {Error} When it is none.
     */
    static validateVersion(version: string | undefined): asserts version is string {
        if (version == undefined || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
            throw new Error('usage: npm run release:bump -- <major.minor.patch>');
        }
    }

    /**
     * Finds the package.json of every library that gets published: each project that isn't private, like testing.
     * @param projectsPath - The directory of the projects.
     * @returns The paths of their package.json.
     */
    static findPublishedManifests(projectsPath: string): string[] {
        return readdirSync(projectsPath, { withFileTypes: true })
            .filter(entry => entry.isDirectory())
            .map(entry => path.join(projectsPath, entry.name, 'package.json'))
            .filter(manifestPath => {
                try {
                    return (JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest).private !== true;
                }
                catch {
                    // an app like the showcase has no package.json of its own
                    return false;
                }
            });
    }
}

// only when run as a script, not when a test imports the utilities.
if (process.argv[1] != undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
    const version: string | undefined = process.argv[2];
    BumpVersionUtilities.validateVersion(version);
    const manifestPaths: string[] = BumpVersionUtilities.findPublishedManifests(path.resolve(import.meta.dirname, '../projects'));
    const releasedNames: Set<string> = new Set(manifestPaths.map(manifestPath => {
        return (JSON.parse(readFileSync(manifestPath, 'utf8')) as PackageManifest).name;
    }));
    for (const manifestPath of manifestPaths) {
        writeFileSync(manifestPath, BumpVersionUtilities.bumpManifest(readFileSync(manifestPath, 'utf8'), version, releasedNames));
    }
    process.stdout.write(`Bumped ${[...releasedNames].join(', ')} to ${version}.\n`);
}