import { Component, computed, inject, input, InputSignal, LOCALE_ID, Signal } from '@angular/core';
import { NavigationService } from '@service-soft/ngx-navigation/navigation';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { LinkComponent } from '@service-soft/ui/link';
import { MenuComponent, MenuTriggerDirective } from '@service-soft/ui/menu';

import { LanguageMenuItemsComponent } from './language-menu-items.component';
import { LanguageSwitcherAppearance } from './language-switcher-appearance.type';
import { LanguageSwitcherConfig } from './language-switcher-config.model';
import { LANGUAGE_SWITCHER_CONFIG } from './language-switcher-config.provider';
import { LanguageSwitcherItem } from './language-switcher-item.model';
import { LanguageSwitcherLanguage } from './language-switcher-language.model';

/**
 * Links to the current page in other languages, like in the navbar: `<ngx-language-switcher [languages]="languages" />`.
 * Every link has the hreflang and lang of its language, so search engines and screen readers know it, and the one of
 * the current language is marked. In a menu behind a button with the current language by default, or as a row of
 * links. Inside of a ui-menu, like a menu of the navbar, the links are items of that menu.
 * The links are plain hrefs, which load the page in the other language, like the build of the app for it.
 * Unset inputs fall back to the values provided with provideLanguageSwitcherConfig.
 */
@Component({
    selector: 'ngx-language-switcher',
    templateUrl: './language-switcher.component.html',
    imports: [ButtonComponent, IconComponent, LinkComponent, MenuComponent, MenuTriggerDirective, LanguageMenuItemsComponent],
    host: {
        class: 'contents'
    }
})
export class LanguageSwitcherComponent {
    private readonly config: LanguageSwitcherConfig = inject(LANGUAGE_SWITCHER_CONFIG);
    private readonly navigation: NavigationService = inject(NavigationService);

    /**
     * Whether it is inside of a ui-menu, whose items its links then are.
     */
    protected readonly isInMenu: boolean = inject(MenuComponent, { optional: true }) != undefined;

    /**
     * The languages, in the order they show.
     */
    readonly languages: InputSignal<LanguageSwitcherLanguage[]> = input.required<LanguageSwitcherLanguage[]>();

    /**
     * The code of the language of the page, like 'de'. The LOCALE_ID of the app by default; a language whose code is the
     * start of it, like 'en' of 'en-US', counts when no code is the same.
     */
    readonly current: InputSignal<string> = input(inject(LOCALE_ID));

    /**
     * Whether the languages are in a menu or a row of links.
     */
    readonly appearance: InputSignal<LanguageSwitcherAppearance> = input<LanguageSwitcherAppearance>(this.config.appearance);

    /**
     * What screen readers call the switcher.
     */
    readonly label: InputSignal<string> = input(this.config.label);

    /**
     * The icon of the button of the menu.
     */
    protected readonly icon: IconDefinition = this.config.icon;

    /**
     * The languages with the links to the current page in them.
     */
    protected readonly items: Signal<LanguageSwitcherItem[]> = computed(() => {
        const url: string = this.navigation.url();
        const currentCode: string | undefined = this.findCurrentCode();
        return this.languages().map(language => ({
            code: language.code,
            label: language.label,
            href: this.resolveHref(language, url),
            isCurrent: language.code === currentCode
        }));
    });

    /**
     * The language of the page, which the button of the menu shows.
     */
    protected readonly currentItem: Signal<LanguageSwitcherItem | undefined> = computed(() => this.items().find(item => item.isCurrent));

    private resolveHref(language: LanguageSwitcherLanguage, url: string): string {
        return typeof language.href === 'string' ? language.href : (language.href ?? this.config.href)(url, language.code);
    }

    // codes are compared without case, as 'en-gb' and 'en-GB' are the same language.
    private findCurrentCode(): string | undefined {
        const current: string = this.current().toLowerCase();
        const codes: string[] = this.languages().map(language => language.code);
        return codes.find(code => code.toLowerCase() === current)
            ?? codes.find(code => current.startsWith(`${code.toLowerCase()}-`));
    }
}