import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { provideSnackbarConfig } from './snackbar-config.provider';
import { SnackbarService } from './snackbar.service';

function getRegion(): Element | null {
    return document.querySelector('ui-snackbar');
}

describe('SnackbarService', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    });

    afterEach(() => {
        getRegion()?.remove();
        vi.useRealTimers();
    });

    test('shows the message in a live region that exists before it, and hides it after the duration', () => {
        TestBed.configureTestingModule({ providers: [provideSnackbarConfig({ duration: 3000 })] });
        TestBed.inject(SnackbarService).open('Saved.');

        // the region is there at once, the message comes after the browser noticed it
        expect(getRegion()?.getAttribute('role')).toBe('status');
        expect(getRegion()?.textContent?.trim()).toBe('');
        vi.advanceTimersByTime(100);
        expect(getRegion()?.textContent?.trim()).toBe('Saved.');

        vi.advanceTimersByTime(2999);
        expect(getRegion()?.textContent?.trim()).toBe('Saved.');
        vi.advanceTimersByTime(1);
        expect(getRegion()?.textContent?.trim()).toBe('');
    });

    test('replaces the message before, in the same region, with its own duration', () => {
        const snackbarService: SnackbarService = TestBed.inject(SnackbarService);
        snackbarService.open('Saved.');
        vi.advanceTimersByTime(100);

        snackbarService.open('Deleted.', { duration: 1000 });
        expect(document.querySelectorAll('ui-snackbar')).toHaveLength(1);
        expect(getRegion()?.textContent?.trim()).toBe('Deleted.');
        vi.advanceTimersByTime(1000);
        expect(getRegion()?.textContent?.trim()).toBe('');
    });

    test('shows a message in its own color, or the one of the config', () => {
        TestBed.configureTestingModule({ providers: [provideSnackbarConfig({ color: 'success' })] });
        const snackbarService: SnackbarService = TestBed.inject(SnackbarService);
        snackbarService.open('Saved.');
        vi.advanceTimersByTime(100);
        expect(getRegion()?.querySelector('p')?.classList.contains('bg-success')).toBe(true);

        snackbarService.open('Couldn\'t save.', { color: 'error' });
        expect(getRegion()?.querySelector('p')?.classList.contains('bg-error')).toBe(true);
        expect(getRegion()?.querySelector('p')?.classList.contains('text-on-error')).toBe(true);
    });
});