import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { Browser, chromium, Page } from 'playwright';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

const SHOWCASE_OUTPUT_PATH: string = path.resolve(import.meta.dirname, '../dist/showcase/browser');
// playwright answers every request to this origin from the build, so no server has to run.
const SHOWCASE_ORIGIN: string = 'http://showcase.test';

// the production build of the showcase, which has a navbar with titles and links only. The selectors of the
// components stay in the bundle as strings, so they show which components it ships.
describe('bundle of an app', () => {
    let bundle: string;

    beforeAll(() => {
        bundle = readdirSync(SHOWCASE_OUTPUT_PATH)
            .filter(file => file.endsWith('.js'))
            .map(file => readFileSync(path.join(SHOWCASE_OUTPUT_PATH, file), 'utf8'))
            .join('\n');
    });

    test('ships the components of the types of elements the navbar is given, and no others', () => {
        expect(bundle).toContain('ngx-nav-title');
        expect(bundle).toContain('ngx-nav-link');
        for (const selector of ['ngx-nav-image', 'img[ngSrc]', 'ngx-nav-menu', 'ngx-nav-button', 'ngx-nav-text']) {
            expect(bundle, selector).not.toContain(selector);
        }
    });

    test('leaves out the checks of the components that only development builds run', () => {
        expect(bundle).not.toContain('which are used but missing in its components');
        expect(bundle).not.toContain('so it stays out of the bundle');
    });
});

const FIELD_SELECTORS: string[] = [
    'string',
    'password',
    'textarea',
    'autocomplete',
    'select',
    'number',
    'slider',
    'boolean',
    'date',
    'date-range',
    'chips',
    'date-array',
    'object-array'
]
    .map(kind => `ngx-entity-${kind}-field`);

// the showcase has a form of a project, with a string and a number, on a lazy route.
describe('fields of an entity form in the bundle of an app', () => {
    let files: Map<string, string>;
    let browser: Browser;

    beforeAll(async () => {
        files = new Map(readdirSync(SHOWCASE_OUTPUT_PATH)
            .filter(file => file.endsWith('.js'))
            .map(file => [file, readFileSync(path.join(SHOWCASE_OUTPUT_PATH, file), 'utf8')]));
        browser = await chromium.launch();
    });

    afterAll(async () => {
        await browser.close();
    });

    test('keeps every field out of the main bundle, each in a chunk of its own', () => {
        const main: string = [...files].find(([file]) => file.startsWith('main-'))?.[1] ?? '';
        for (const selector of FIELD_SELECTORS) {
            expect(main, selector).not.toContain(selector);
            const chunks: string[] = findFilesContaining(files, selector);
            expect(chunks, selector).toHaveLength(1);
            const chunk: string = files.get(chunks[0] ?? '') ?? '';
            expect(FIELD_SELECTORS.filter(other => chunk.includes(other)), selector).toEqual([selector]);
        }
    });

    test('loads only the fields of the kinds the form shows', async () => {
        const page: Page = await browser.newPage();
        const loaded: string[] = await openShowcase(page, '/projects');
        await page.getByLabel('Budget').waitFor();

        const loadedFields: string[] = FIELD_SELECTORS.filter(selector => findFilesContaining(files, selector).some(file => loaded.includes(file)));
        expect(loadedFields).toEqual(['ngx-entity-string-field', 'ngx-entity-number-field']);
        await page.close();
    });

    test('loads the page of the routes of an entity only once it is opened, with the title of its route', async () => {
        const main: string = [...files].find(([file]) => file.startsWith('main-'))?.[1] ?? '';
        expect(main).not.toContain('ngx-entity-page');
        expect(main).not.toContain('ngx-entity-editor');

        const page: Page = await browser.newPage();
        await openShowcase(page, '/projects/new');
        await page.getByRole('heading', { name: 'New project' }).waitFor();
        expect(await page.title()).toBe('New project');
        // the fields load after the page
        await page.getByLabel('Name').waitFor();
        await page.close();
    });
});

/**
 * Opens a path of the built showcase, answering every request from the build like a static host of an app that is
 * prerendered in parts.
 * @param page - The page to open it in.
 * @param url - The path, like '/projects'.
 * @returns The names of the js files the page loaded, which grows while it loads more.
 */
async function openShowcase(page: Page, url: string): Promise<string[]> {
    const loaded: string[] = [];
    await page.route(`${SHOWCASE_ORIGIN}/**`, route => {
        const file: string = path.join(SHOWCASE_OUTPUT_PATH, new URL(route.request().url()).pathname);
        if (file.endsWith('.js')) {
            loaded.push(path.basename(file));
        }
        // a path that isn't prerendered is the app without content, which routes it itself. Prerendering names it
        // index.csr.html, as an index.html would be the start page built ahead of time.
        return route.fulfill({ path: existsSync(file) && path.extname(file) !== '' ? file : path.join(SHOWCASE_OUTPUT_PATH, 'index.csr.html') });
    });
    await page.goto(`${SHOWCASE_ORIGIN}${url}`);
    return loaded;
}

/**
 * Finds the files of a build whose code contains a text.
 * @param files - The code of the files, by their name.
 * @param text - The text.
 * @returns The names of the files.
 */
function findFilesContaining(files: Map<string, string>, text: string): string[] {
    return [...files].filter(([, code]) => code.includes(text)).map(([file]) => file);
}