import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, symlinkSync } from 'node:fs';
import path from 'node:path';

const ROOT: string = path.resolve(import.meta.dirname, '..');

/**
 * Builds the libraries and the showcase, which consumes them from node_modules exactly like an external project would,
 * and the storybook of ui.
 */
export function setup(): void {
    ng('run', 'ui:build-storybook');
    ng('build', 'ui');
    // libraries built on ui import it from node_modules, like their consumers do.
    linkPackage('@service-soft/ui', 'dist/ui');
    ng('build', 'ngx-change-sets');
    linkPackage('@service-soft/ngx-change-sets', 'dist/ngx-change-sets');
    ng('build', 'ngx-persistence-logger');
    linkPackage('@service-soft/ngx-persistence-logger', 'dist/ngx-persistence-logger');
    ng('build', 'ngx-tracking');
    linkPackage('@service-soft/ngx-tracking', 'dist/ngx-tracking');
    ng('build', 'ngx-pwa');
    linkPackage('@service-soft/ngx-pwa', 'dist/ngx-pwa');
    ng('build', 'ngx-auth');
    linkPackage('@service-soft/ngx-auth', 'dist/ngx-auth');
    ng('build', 'ngx-error-handling');
    linkPackage('@service-soft/ngx-error-handling', 'dist/ngx-error-handling');
    ng('build', 'ngx-navigation');
    linkPackage('@service-soft/ngx-navigation', 'dist/ngx-navigation');
    ng('build', 'ngx-entity');
    linkPackage('@service-soft/ngx-entity', 'dist/ngx-entity');
    ng('build', 'ngx-ecommerce');
    linkPackage('@service-soft/ngx-ecommerce', 'dist/ngx-ecommerce');
    ng('build', 'testing');
    linkPackage('testing', 'dist/testing');
    ng('build', 'showcase');
}

/**
 * Runs the angular cli in the workspace root.
 * @param args - The arguments passed to the cli.
 */
function ng(...args: string[]): void {
    execFileSync('npx', ['ng', ...args], { cwd: ROOT, stdio: 'inherit' });
}

/**
 * Links a package into node_modules, where consumers would have it installed.
 * @param name - The name of the package.
 * @param target - The directory of the package, relative to the workspace root.
 */
function linkPackage(name: string, target: string): void {
    const linkPath: string = path.join(ROOT, 'node_modules', name);
    rmSync(linkPath, { recursive: true, force: true });
    // a scoped name lives in a directory of its scope, which doesn't exist before the first link.
    mkdirSync(path.dirname(linkPath), { recursive: true });
    symlinkSync(path.relative(path.dirname(linkPath), path.join(ROOT, target)), linkPath);
}