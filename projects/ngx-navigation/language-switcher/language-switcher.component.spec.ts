import { Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MenuComponent } from '@service-soft/ui/menu';
import { describe, expect, test } from 'vitest';

import { provideLanguageSwitcherConfig } from './language-switcher-config.provider';
import { LanguageSwitcherLanguage } from './language-switcher-language.model';
import { LanguageSwitcherComponent } from './language-switcher.component';

const LANGUAGES: LanguageSwitcherLanguage[] = [
    { code: 'de', label: 'Deutsch' },
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français', href: url => `https://example.fr${url}` },
    { code: 'nl', label: 'Nederlands', href: 'https://example.nl' }
];

@Component({
    selector: 'ngx-page',
    template: `<ngx-language-switcher [languages]="languages" /><ngx-language-switcher appearance="list" current="de" [languages]="languages" />
        <ui-menu><ngx-language-switcher [languages]="languages" /></ui-menu>`,
    imports: [LanguageSwitcherComponent, MenuComponent]
})
class PageComponent {
    readonly languages: LanguageSwitcherLanguage[] = LANGUAGES;
}

@Component({
    selector: 'ngx-regional-page',
    template: '<ngx-language-switcher appearance="list" [languages]="languages" />',
    imports: [LanguageSwitcherComponent]
})
class RegionalPageComponent {
    // languages of a region, whose builds Angular i18n serves below a shorter path
    readonly languages: LanguageSwitcherLanguage[] = [
        { code: 'de-CH', label: 'Deutsch', subPath: 'de' },
        { code: 'fr-CH', label: 'Français', subPath: 'fr' }
    ];
}

// the text, the href, the hreflang, the lang and the aria-current of a link.
type LinkAttributes = [string, ...(string | undefined)[]];

async function render(): Promise<HTMLElement[]> {
    const harness: RouterTestingHarness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/orders?page=2');
    return [...harness.routeNativeElement?.children ?? []].filter(element => element instanceof HTMLElement);
}

function findLinks(element: Element | undefined): LinkAttributes[] {
    return [...element?.querySelectorAll('a') ?? []].map(link => [
        link.textContent.trim(),
        ...['href', 'hreflang', 'lang', 'aria-current'].map(attribute => link.getAttribute(attribute) ?? undefined)
    ]);
}

describe('LanguageSwitcherComponent', () => {
    test('links to the current page in every language, the one of the LOCALE_ID marked, in a menu behind a button', async () => {
        TestBed.configureTestingModule({ providers: [provideRouter([{ path: '**', component: PageComponent }])] });
        const [menu] = await render();

        const button: HTMLButtonElement | null | undefined = menu?.querySelector('button');
        expect(button?.textContent.replaceAll(/\s+/g, ' ').trim()).toBe('Language: English');
        expect(button?.querySelector('[lang="en"]')).not.toBeNull();
        expect(button?.getAttribute('popovertarget')).toBe(menu?.querySelector('ui-menu')?.id);
        expect(findLinks(menu)).toEqual([
            ['Deutsch', '/de/orders?page=2', 'de', 'de', undefined],
            ['English', '/en/orders?page=2', 'en', 'en', 'page'],
            ['Français', 'https://example.fr/orders?page=2', 'fr', 'fr', undefined],
            ['Nederlands', 'https://example.nl', 'nl', 'nl', undefined]
        ]);
    });

    test('is a navigation of links as a list, and only the links inside of a menu of its own', async () => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([{ path: '**', component: PageComponent }]),
                provideLanguageSwitcherConfig({ label: 'Sprache', href: (url, code) => `/${code}/app${url}` })
            ]
        });
        const [, list, menu] = await render();

        expect(list?.querySelector('nav')?.getAttribute('aria-label')).toBe('Sprache');
        expect(findLinks(list).slice(0, 2)).toEqual([
            ['Deutsch', '/de/app/orders?page=2', 'de', 'de', 'page'],
            ['English', '/en/app/orders?page=2', 'en', 'en', undefined]
        ]);
        expect(menu?.querySelector('button')).toBeNull();
        expect(menu?.querySelectorAll('a[ui-menu-link]').length).toBe(4);
    });

    test('links to the path a language is served below, and names it by its code', async () => {
        TestBed.configureTestingModule({
            providers: [provideRouter([{ path: '**', component: RegionalPageComponent }]), { provide: LOCALE_ID, useValue: 'fr-CH' }]
        });
        const [list] = await render();

        expect(findLinks(list)).toEqual([
            ['Deutsch', '/de/orders?page=2', 'de-CH', 'de-CH', undefined],
            ['Français', '/fr/orders?page=2', 'fr-CH', 'fr-CH', 'page']
        ]);
    });

    test('gives the href of the config the code and the path of a language', async () => {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([{ path: '**', component: RegionalPageComponent }]),
                provideLanguageSwitcherConfig({ href: (url, code, subPath) => `https://${subPath}.example.ch${url}#${code}` })
            ]
        });
        const [list] = await render();

        expect(findLinks(list).map(([, href]) => href)).toEqual([
            'https://de.example.ch/orders?page=2#de-CH',
            'https://fr.example.ch/orders?page=2#fr-CH'
        ]);
    });
});