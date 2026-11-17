import { TableOfContentsItem } from './table-of-contents-item.model';
import { TableOfContentsLevel } from './table-of-contents-level.type';

/**
 * An item while the tree is built, with the level of its heading.
 */
type OpenItem = {
    /**
     * The level of the heading of the item.
     */
    level: number,
    /**
     * The item, whose children are still being added.
     */
    item: Required<TableOfContentsItem>
};

/**
 * Utilities for tables of contents.
 */
export abstract class TableOfContentsUtilities {
    /**
     * Resolves the sections of a container from its headings, nested by their levels, like the h3s below an h2. A
     * heading without an id gets one from its text, like 'cookies-and-tracking' for 'Cookies and tracking', so it can
     * be linked to.
     * @param container - The element whose headings to read.
     * @param levels - The levels of the headings that become sections, like [2, 3].
     * @returns The sections, in the order of the page.
     */
    static resolveItems(container: HTMLElement, levels: TableOfContentsLevel[]): TableOfContentsItem[] {
        if (levels.length === 0) {
            return [];
        }
        const headings: HTMLElement[] = [...container.querySelectorAll<HTMLElement>(levels.map(level => `h${level}`).join(', '))];
        const items: TableOfContentsItem[] = [];
        const open: OpenItem[] = [];
        for (const heading of headings) {
            const level: number = Number(heading.tagName.slice(1));
            const name: string = heading.textContent.replaceAll(/\s+/g, ' ').trim();
            // the id is written into the page: a link needs an element to lead to, and a text gives the same id on
            // the server and in the browser, and after every change of the content.
            heading.id ||= this.resolveUniqueId(name, heading.ownerDocument);
            const item: Required<TableOfContentsItem> = { name, fragment: heading.id, children: [] };
            while ((open.at(-1)?.level ?? 0) >= level) {
                open.pop();
            }
            (open.at(-1)?.item.children ?? items).push(item);
            open.push({ level, item });
        }
        return items;
    }

    /**
     * Resolves the slug of a text, which an id or a url can hold: in small letters, without accents, and with dashes
     * between its words, like 'cafe-and-bar' for 'Café & Bar'.
     * @param text - The text.
     * @returns The slug, 'section' for a text without letters or digits.
     */
    static resolveSlug(text: string): string {
        const slug: string = text
            .normalize('NFKD')
            // the accents, which NFKD splits from their letters
            .replaceAll(/\p{M}/gu, '')
            .toLowerCase()
            .replaceAll(/[^\p{L}\p{N}]+/gu, '-')
            .replaceAll(/^-|-$/g, '');
        return slug === '' ? 'section' : slug;
    }

    // two headings with the same text, like 'Details' in two sections, get a number after the second one.
    private static resolveUniqueId(name: string, document: Document): string {
        const slug: string = this.resolveSlug(name);
        let id: string = slug;
        for (let number: number = 2; document.getElementById(id) != undefined; number++) {
            id = `${slug}-${number}`;
        }
        return id;
    }
}