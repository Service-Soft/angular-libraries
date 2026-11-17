import { Location } from '@angular/common';

import { LinkAppearance } from './link-appearance.type';

// icons are sized in em like in buttons, so they grow with the text. A button drawn as a link starts its text at the
// start, like a link does.
const BASE_CLASSES: string = `
    cursor-pointer text-start
    focus-visible:outline-2 focus-visible:outline-primary
    disabled:cursor-default disabled:opacity-50
    [&_svg]:size-[1.25em] [&_svg]:shrink-0
`;

// colored text on a surface hovers and is pressed with its tint behind it. The current page is underlined in a
// navigation, so it stands out by more than its color, and drawn as text inside text, like the last step of breadcrumbs.
// An item of a navigation or a menu is at least 40px high, like a button; plain and subtle keep the color and the font of what is
// around it, and is at least 24px high, a target that can be hit. The focus ring of a menu item is inside of it, where
// the edge of the menu doesn't cut it off.
const APPEARANCE_CLASSES: Record<LinkAppearance, string> = {
    inline: `
        rounded-link text-primary underline decoration-1 underline-offset-2
        hover:decoration-2
        focus-visible:outline-offset-2
        aria-[current=page]:text-on-surface aria-[current=page]:no-underline
    `,
    nav: `
        min-h-10 items-center gap-2 rounded-link px-3 py-2 text-label text-primary no-underline transition
        hover:bg-primary-tint
        focus-visible:outline-offset-2
        active:bg-primary-tint-pressed
        aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-4
    `,
    plain: 'min-h-6 items-center gap-2 rounded-link no-underline focus-visible:outline-offset-2',
    // like plain, but its text is underlined on hover, which says it is a link where its color doesn't.
    subtle: `
        min-h-6 items-center gap-2 rounded-link no-underline decoration-1 underline-offset-2
        hover:underline
        focus-visible:outline-offset-2
    `,
    menu: `
        min-h-10 items-center gap-3 px-4 py-2 text-body text-on-surface no-underline transition
        hover:bg-surface-container
        focus-visible:-outline-offset-2
    `,
    // the current page is filled like a pressed toggle button, so it stands out by its shape as well, under its on-
    // color, and hovers with -hover: checked pairs. Its border turns transparent, which forced colors mode still draws,
    // where the fill is gone, so there it is underlined instead.
    pill: `
        min-h-10 items-center gap-2 rounded-link-pill border border-outline-variant px-4 py-2 text-label text-primary no-underline
        transition
        hover:bg-primary-tint
        focus-visible:outline-offset-2
        active:bg-primary-tint-pressed
        aria-[current=page]:border-transparent aria-[current=page]:bg-primary aria-[current=page]:text-on-primary
        aria-[current=page]:hover:bg-primary-hover
        aria-[current=page]:active:bg-primary-pressed
        forced-colors:aria-[current=page]:underline forced-colors:aria-[current=page]:underline-offset-4
    `
};

// how it sits in the layout: in the flow of the text, next to others, or over the full width, like in a drawer.
const DISPLAY_CLASSES: Record<'text' | 'item' | 'block', string> = {
    text: 'inline',
    item: 'inline-flex',
    block: 'flex w-full'
};

/**
 * Utilities for links: their look, for components that draw an element of their own like a link, such as the items
 * of a menu, and the hrefs of links that call, write or message someone.
 */
export abstract class LinkUtilities {
    /**
     * Gets the classes that draw an element like a link.
     * @param appearance - How it looks.
     * @param block - Whether it takes the full width. A menu item always does.
     * @returns The classes.
     */
    static getClasses(appearance: LinkAppearance, block: boolean): string {
        const display: keyof typeof DISPLAY_CLASSES = block || appearance === 'menu' ? 'block' : appearance === 'inline' ? 'text' : 'item';
        return `${BASE_CLASSES} ${APPEARANCE_CLASSES[appearance]} ${DISPLAY_CLASSES[display]}`;
    }

    /**
     * Whether a link leads to another site: a web address with another origin than the page.
     * @param href - The href of the link, or null for none.
     * @param origin - The origin of the page, like 'https://example.com'.
     * @returns Whether it leads to another site. A relative path, a fragment, mailto: or tel: don't.
     */
    // resolved against the origin, so a relative path or a protocol-relative '//other.com' reads like the browser does.
    static isExternal(href: string | null, origin: string): boolean {
        if (href == undefined || !URL.canParse(href, origin)) {
            return false;
        }
        const url: URL = new URL(href, origin);
        return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== origin;
    }

    /**
     * Resolves the href of a link to an element of the current page, like a heading or a footnote.
     * @param location - The Location of the app.
     * @param fragment - The id of the element, without the '#'.
     * @returns The path of the current page with the fragment, like '/legal/privacy#cookies'.
     */
    // a plain '#cookies' resolves against the <base href> of an Angular app, which leads to the start page instead.
    static resolveFragmentHref(location: Location, fragment: string): string {
        return location.prepareExternalUrl(`${location.path()}#${encodeURIComponent(fragment)}`);
    }

    /**
     * Resolves the href of a link that calls a phone number, like 'tel:+4922341234' for '+49 (0) 2234 12 34'. Show the
     * number as it is written, and link it with this: phones dial the digits only.
     * @param phone - The number as it is written, like '+49 2234 12 34' or '02234 12 34'.
     * @returns The tel: href.
     */
    static resolvePhoneHref(phone: string): string {
        return `tel:${this.resolveDialledNumber(phone)}`;
    }

    /**
     * Resolves the href of a link that writes an email.
     * @param email - The address, like 'info@example.com'.
     * @returns The mailto: href.
     */
    static resolveEmailHref(email: string): string {
        return `mailto:${email.trim()}`;
    }

    /**
     * Resolves the href of a link that opens a chat on WhatsApp, like 'https://wa.me/491711234567' for
     * '+49 171 1234567'. WhatsApp only knows numbers with their country code, so give it as '+49 …' or '0049 …'.
     * @param phone - The number as it is written, with its country code.
     * @returns The https://wa.me href.
     */
    static resolveWhatsAppHref(phone: string): string {
        // wa.me takes the international number without the + or the 00 before it.
        return `https://wa.me/${this.resolveDialledNumber(phone).replace(/^\+/, '')}`;
    }

    // the digits a phone dials: an international number written as '+49 (0) 2234' drops the trunk prefix in the
    // parentheses, which is only dialled from within the country, and '0049' is the same as '+49'.
    private static resolveDialledNumber(phone: string): string {
        const international: boolean = /^\s*(\+|00)/.test(phone);
        const digits: string = (international ? phone.replaceAll('(0)', '') : phone).replaceAll(/\D/g, '');
        return international ? `+${digits.replace(/^00/, '')}` : digits;
    }
}