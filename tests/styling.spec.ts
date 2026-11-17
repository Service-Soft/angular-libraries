import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

import tailwindcss from '@tailwindcss/postcss';
import postcss from 'postcss';
import { beforeAll, describe, expect, test } from 'vitest';

const ROOT: string = path.resolve(import.meta.dirname, '..');
const SHOWCASE_STYLES_PATH: string = path.join(ROOT, 'projects/showcase/src/styles.css');
const SHOWCASE_OUTPUT_PATH: string = path.join(ROOT, 'dist/showcase/browser');
const PRIMARY_OVERRIDE: string = 'light-dark(#0e7068, #5fd5c3)';

// the parts every variant shares with the showcase's real styles.css. Only what gets scanned for classes differs,
// so only the tokens of ui are imported, without scanning its components.
const CONSUMER_HEADER: string = '@import "tailwindcss" source("../");\n@import "@service-soft/ui/theme.css";';
const CONSUMER_OVERRIDES: string = `@theme { --color-primary: ${PRIMARY_OVERRIDE}; }`;

/**
 * Compiles the given css as if it was the showcase's styles.css, with the same plugin the angular build uses.
 * @param css - The content of the stylesheet.
 * @returns The minified css.
 */
async function compileShowcaseCss(css: string): Promise<string> {
    const result: postcss.Result = await postcss([tailwindcss({ optimize: { minify: true } })])
        .process(css, { from: SHOWCASE_STYLES_PATH });
    return result.css;
}

function hasClass(css: string, className: string): boolean {
    return new RegExp(`\\.${className}\\s*\\{`).test(css);
}

function findTokenValues(css: string, token: string): string[] {
    return [...css.matchAll(new RegExp(`${token}:\\s*([^;}]+)`, 'g'))].map(match => match[1].trim());
}

function getGzipSize(css: string): number {
    return gzipSync(css, { level: 9 }).byteLength;
}

describe('consumer styling setup', () => {
    let builtCss: string;

    beforeAll(() => {
        const stylesFile: string | undefined = readdirSync(SHOWCASE_OUTPUT_PATH).find(f => f.startsWith('styles-') && f.endsWith('.css'));
        if (stylesFile == undefined) {
            throw new Error(`No built stylesheet in ${SHOWCASE_OUTPUT_PATH}`);
        }
        builtCss = readFileSync(path.join(SHOWCASE_OUTPUT_PATH, stylesFile), 'utf8');
    });

    test('generates the classes of a library built on ui', () => {
        // only ngx-change-sets uses them, so they come from scanning it
        expect(hasClass(builtCss, 'bg-warning')).toBe(true);
        expect(hasClass(builtCss, 'text-on-warning')).toBe(true);
    });

    test('consumer token overrides replace the defaults', () => {
        // a colored surface of ui points the token to the on- color inside of it, which is no definition of its own
        expect(findTokenValues(builtCss, '--color-primary').filter(value => !value.startsWith('var(--surface-'))).toEqual([PRIMARY_OVERRIDE]);
    });

    // the showcase scans every component of ui, some of which use the display text, so the check scans only the entry
    // points ngx-change-sets uses, none of which do.
    test('only emits tokens that are used', async () => {
        const css: string = await compileShowcaseCss([
            CONSUMER_HEADER,
            '@source "../../../node_modules/@service-soft/ui/fesm2022/service-soft-ui-{button,details,dialog,icon,menu}.mjs";',
            '@import "@service-soft/ngx-change-sets";',
            CONSUMER_OVERRIDES
        ].join('\n'));

        expect(findTokenValues(css, '--text-display')).toEqual([]);
    });
});

describe('css size by scan strategy', () => {
    test('a second pass over the build output only keeps the classes of used components', async () => {
        const variants: Record<string, string> = {
            'no library': '',
            // every package the showcase imports, like its styles.css: the build output holds the lazy chunks of all of them
            'whole packages': [
                '@source "../../../node_modules/@service-soft/ui/fesm2022";',
                '@import "@service-soft/ngx-change-sets";',
                '@import "@service-soft/ngx-navigation";',
                '@import "@service-soft/ngx-entity";'
            ].join('\n'),
            // the entry points ngx-change-sets imports
            'used entry points only': [
                '@source "../../../node_modules/@service-soft/ui/fesm2022/service-soft-ui-{button,details,dialog,icon,menu}.mjs";',
                '@import "@service-soft/ngx-change-sets";'
            ].join('\n'),
            // only js, which the templates are compiled into: the built stylesheet, and index.html with the critical css
            // angular copies into it, contain every class of the first pass as a selector.
            '2nd pass over build output': '@source "../../../dist/showcase/browser/**/*.js";'
        };

        const sizes: Record<string, { raw: number, gzip: number }> = {};
        const results: Record<string, string> = {};
        for (const [name, sources] of Object.entries(variants)) {
            const css: string = await compileShowcaseCss(`${CONSUMER_HEADER}\n${sources}\n${CONSUMER_OVERRIDES}`);
            results[name] = css;
            sizes[name] = { raw: Buffer.byteLength(css), gzip: getGzipSize(css) };
        }
        // eslint-disable-next-line no-console
        console.table(sizes);

        // object-cover is only used by the file input of ui, which the showcase doesn't use
        for (const name of ['whole packages', 'used entry points only', '2nd pass over build output']) {
            expect(hasClass(results[name], 'bg-warning'), name).toBe(true);
            expect(hasClass(results[name], 'object-cover'), name).toBe(name === 'whole packages');
        }
        expect(sizes['used entry points only'].raw).toBeLessThan(sizes['whole packages'].raw);
        expect(sizes['2nd pass over build output'].raw).toBeLessThan(sizes['whole packages'].raw);
    });
});