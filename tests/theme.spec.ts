import path from 'node:path';

import { ThemeUtilities } from 'testing/theme';
import { describe, expect, test } from 'vitest';

const ROOT: string = path.resolve(import.meta.dirname, '..');

describe('ThemeUtilities.validateContrast', () => {
    test('the default tokens of ui meet WCAG AA', async () => {
        await expect(ThemeUtilities.validateContrast(path.join(ROOT, 'tests/fixtures/ui-theme.css'))).resolves.toBeUndefined();
    });

    test('the showcase theme meets WCAG AA', async () => {
        await expect(ThemeUtilities.validateContrast(path.join(ROOT, 'projects/showcase/src/styles.css'))).resolves.toBeUndefined();
    });

    test('reports failing pairs, missing tokens and every context that overrides tokens, in light and dark mode', async () => {
        const validation: Promise<void> = ThemeUtilities.validateContrast(path.join(ROOT, 'tests/fixtures/failing-theme.css'));

        // white text on the cyan secondary, resolved through var()
        await expect(validation).rejects.toThrow('default theme (light): on-secondary on secondary is 2.46:1, needs 4.5:1');
        // a hover state that is mixed too far towards its text color
        await expect(validation).rejects.toThrow(/default theme \(light\): on-primary on primary-hover is \d\.\d\d:1, needs 4\.5:1/);
        await expect(validation).rejects.toThrow('default theme (light): on-error on error can\'t be checked: --color-error is not defined');
        // the light mode green in dark mode, below the dark on-success
        await expect(validation).rejects.toThrow(/default theme \(dark\): on-success on success is \d\.\d\d:1, needs 4\.5:1/);
        await expect(validation).rejects.not.toThrow('default theme (light): on-success on success');
        await expect(validation).rejects.toThrow('.dark (dark): on-surface on surface is 1.00:1, needs 4.5:1');
        await expect(validation).rejects.not.toThrow('.dark (light)');
    });
});