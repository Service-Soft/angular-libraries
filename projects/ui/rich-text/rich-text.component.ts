import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { RichTextConfig } from './rich-text-config.model';
import { RICH_TEXT_CONFIG } from './rich-text-config.provider';
import { RichTextSanitizer } from './rich-text-sanitizer.type';

// the html comes from elsewhere, like a cms, so it is styled through the elements it has: arbitrary variants reach
// into it, as the classes of Angular's templates can't. The text and the spacing follow the type scale, blocks are
// spaced by the margin of the one before them, and headings get more room above them, which collapses with it.
// Links look like inline ui-links. Code wraps instead of scrolling, so a block of it never needs a scrollbar, which
// would have to be focusable. The header cells of tables are surface-container rather than table-header, which a
// colored surface gives its own value, so they keep their contrast there. Images and videos never get wider than the
// text.
const PROSE_CLASSES: string = `
    block text-body wrap-break-word text-on-surface
    *:mb-4
    *:last:mb-0
    [&_:is(h1,h2,h3,h4,h5,h6)]:mt-8 [&_:is(h1,h2,h3,h4,h5,h6)]:mb-3 [&_:is(h1,h2,h3,h4,h5,h6)]:font-heading
    [&_:is(h1,h2,h3,h4,h5,h6)]:first:mt-0
    [&_h1]:text-headline
    [&_h2]:text-title
    [&_h3]:text-label-lg [&_h3]:font-semibold
    [&_:is(h4,h5,h6)]:text-body [&_:is(h4,h5,h6)]:font-semibold
    [&_a]:rounded-link [&_a]:text-primary [&_a]:underline [&_a]:decoration-1 [&_a]:underline-offset-2
    [&_a:hover]:decoration-2
    [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-primary
    [&_ol]:list-decimal
    [&_ul]:list-disc
    [&_:is(ul,ol)]:ps-6
    [&_li]:mt-1 [&_li]:ps-1
    [&_li::marker]:text-on-surface-variant
    [&_blockquote]:border-s-4 [&_blockquote]:border-primary [&_blockquote]:ps-4 [&_blockquote]:text-on-surface-variant [&_blockquote]:italic
    [&_code]:rounded [&_code]:bg-surface-container [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-code [&_code]:text-body-sm
    [&_pre]:rounded-rich-text [&_pre]:bg-surface-container [&_pre]:p-4 [&_pre]:whitespace-pre-wrap
    [&_pre_code]:bg-transparent [&_pre_code]:p-0
    [&_table]:w-full [&_table]:border-collapse [&_table]:text-body-sm
    [&_:is(th,td)]:border [&_:is(th,td)]:border-outline-variant [&_:is(th,td)]:px-3 [&_:is(th,td)]:py-2 [&_:is(th,td)]:text-start
    [&_:is(th,td)]:align-top
    [&_th]:bg-surface-container [&_th]:font-semibold
    [&_:is(img,video,iframe)]:max-w-full
    [&_:is(img,video)]:h-auto [&_:is(img,video)]:rounded-rich-text
    [&_figcaption]:mt-2 [&_figcaption]:text-body-sm [&_figcaption]:text-on-surface-variant
    [&_hr]:my-8 [&_hr]:border-outline-variant
`;

/**
 * Html from elsewhere, like the content of a post from a cms, with the look of the rest of the app:
 * `<ui-rich-text [html]="post.content" />`. Headings, paragraphs, lists, links, quotes, code, tables and images follow
 * the type scale and the tokens, also in dark mode and on colored surfaces.
 * The sanitizer of Angular makes the html safe to show, which removes ids, inline styles and elements it doesn't know,
 * like iframes. For a less strict one, provide DOMPurify with provideRichTextDomPurify, or a function of your own with
 * provideRichTextConfig.
 */
@Component({
    selector: 'ui-rich-text',
    templateUrl: './rich-text.component.html',
    host: {
        class: 'block'
    }
})
export class RichTextComponent {
    private readonly config: RichTextConfig = inject(RICH_TEXT_CONFIG);
    private readonly domSanitizer: DomSanitizer = inject(DomSanitizer);

    /**
     * The tailwind classes of the element that holds the html.
     */
    protected readonly proseClasses: string = PROSE_CLASSES;

    /**
     * The html to show. Headings in it start at the level that fits the page, like h2 below the h1 of an article.
     */
    readonly html: InputSignal<string> = input.required<string>();

    /**
     * The html for innerHTML: as it is, which the sanitizer of Angular sanitizes, or sanitized by the sanitizer of
     * the config, whose result is trusted.
     */
    // trusting the result is what makes another sanitizer possible at all: innerHTML would run the sanitizer of
    // Angular over it again otherwise, and remove what the other one kept on purpose.
    protected readonly content: Signal<string | SafeHtml> = computed(() => {
        const sanitize: RichTextSanitizer | undefined = this.config.sanitize;
        return sanitize == undefined ? this.html() : this.domSanitizer.bypassSecurityTrustHtml(sanitize(this.html()));
    });
}