import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideAvatarConfig } from './avatar-config.provider';
import { AvatarComponent } from './avatar.component';
import { AvatarUtilities } from './avatar.utilities';

@Component({
    selector: 'ui-avatar-host',
    template: `
        <ui-avatar name="Ada Lovelace" [src]="src()" />
        <ui-avatar name="Ada Lovelace" decorative />
    `,
    imports: [AvatarComponent]
})
class AvatarHostComponent {
    readonly src: WritableSignal<string | undefined> = signal(undefined);
}

async function render(): Promise<[ComponentFixture<AvatarHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<AvatarHostComponent> = TestBed.createComponent(AvatarHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getAvatars(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll<HTMLElement>('ui-avatar > span'));
}

describe('AvatarComponent', () => {
    test('is an image named by the name, which shows the initials without a picture', async () => {
        const [, root] = await render();
        const [avatar, decorative] = getAvatars(root);

        expect(avatar?.getAttribute('role')).toBe('img');
        expect(avatar?.getAttribute('aria-label')).toBe('Ada Lovelace');
        expect(avatar?.textContent?.trim()).toBe('AL');
        expect(avatar?.querySelector('span')?.getAttribute('aria-hidden')).toBe('true');
        expect(avatar?.querySelector('img')).toBeNull();
        expect(avatar?.classList.contains('bg-primary')).toBe(true);

        // next to the name it shows, screen readers would read the name twice
        expect(decorative?.getAttribute('role')).toBeNull();
        expect(decorative?.getAttribute('aria-label')).toBeNull();
        expect(decorative?.getAttribute('aria-hidden')).toBe('true');
    });

    test('shows the picture, falls back to the initials when it can\'t be loaded, and tries a new one again', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.src.set('/photos/ada.jpg');
        await fixture.whenStable();
        const [avatar] = getAvatars(root);
        const image: HTMLImageElement | null | undefined = avatar?.querySelector('img');
        expect(image?.getAttribute('src')).toBe('/photos/ada.jpg');
        expect(image?.getAttribute('alt')).toBe('');

        image?.dispatchEvent(new Event('error'));
        await fixture.whenStable();
        expect(avatar?.querySelector('img')).toBeNull();
        expect(avatar?.textContent?.trim()).toBe('AL');

        fixture.componentInstance.src.set('/photos/ada-2.jpg');
        await fixture.whenStable();
        expect(avatar?.querySelector('img')?.getAttribute('src')).toBe('/photos/ada-2.jpg');
    });

    test('takes the size and color the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideAvatarConfig({ size: 'lg', color: 'neutral' })] });
        const [, root] = await render();
        const [avatar] = getAvatars(root);

        expect(avatar?.classList.contains('min-w-16')).toBe(true);
        expect(avatar?.classList.contains('bg-surface-container')).toBe(true);
    });
});

describe('AvatarUtilities', () => {
    test('takes the first letters of the first and the last word, uppercased in the language', () => {
        expect(AvatarUtilities.resolveInitials('Ada King Lovelace', 'en')).toBe('AL');
        expect(AvatarUtilities.resolveInitials('  ada   lovelace ', 'en')).toBe('AL');
        expect(AvatarUtilities.resolveInitials('Ada', 'en')).toBe('A');
        expect(AvatarUtilities.resolveInitials('   ', 'en')).toBe('');
        // Turkish has a dotted capital I
        expect(AvatarUtilities.resolveInitials('ilker irmak', 'tr')).toBe('İİ');
        // a letter outside of the basic plane takes two utf-16 units
        expect(AvatarUtilities.resolveInitials('𝒜da 𝓛ovelace', 'en')).toBe('𝒜𝓛');
    });
});
