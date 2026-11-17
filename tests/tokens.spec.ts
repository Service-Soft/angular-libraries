import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, test } from 'vitest';

const PROJECTS_PATH: string = path.resolve(import.meta.dirname, '../projects');
// ui defines the shared tokens, the showcase is a consumer and may override them.
const PROJECTS_ALLOWED_TO_DEFINE_TOKENS: string[] = ['ui', 'showcase'];
const CHECKED_EXTENSIONS: string[] = ['.css', '.scss', '.ts', '.html'];

describe('design tokens', () => {
    test('only ui defines tokens', () => {
        const files: string[] = readdirSync(PROJECTS_PATH, { recursive: true, encoding: 'utf8' })
            .filter(file => !PROJECTS_ALLOWED_TO_DEFINE_TOKENS.includes(file.split(path.sep)[0]))
            .filter(file => !file.split(path.sep).includes('node_modules'))
            .filter(file => CHECKED_EXTENSIONS.includes(path.extname(file)));

        const filesDefiningTokens: string[] = files.filter(file => readFileSync(path.join(PROJECTS_PATH, file), 'utf8').includes('@theme'));
        expect(filesDefiningTokens).toEqual([]);
    });
});