import { DOCUMENT } from '@angular/common';
import { afterNextRender, booleanAttribute, Component, computed, DestroyRef, ElementRef, inject, input, InputSignal, InputSignalWithTransform, signal, Signal, WritableSignal } from '@angular/core';
import { faArrowUpRightFromSquare } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { LinkAppearance } from './link-appearance.type';
import { LinkConfig } from './link-config.model';
import { LINK_CONFIG } from './link-config.provider';
import { LinkUtilities } from './link.utilities';

/**
 * Styles a native link, or a button that should look like one: `<a ui-link routerLink="/orders">`,
 * `<a ui-link href="https://…">` or `<button ui-link type="button">`. It stays your own element, so routerLink, href,
 * target and routerLinkActive work as on any link. A link with `aria-current="page"`, which
 * `routerLinkActive ariaCurrentWhenActive="page"` sets, is drawn as the current page. A link to another site or one
 * that opens in a new tab shows an icon after its text, and one that opens in a new tab says so to screen readers.
 * Unset inputs fall back to the values provided with provideLinkConfig.
 */
@Component({
    selector: 'a[ui-link], button[ui-link]',
    templateUrl: './link.component.html',
    imports: [IconComponent],
    host: {
        '[class]': 'classes()'
    }
})
export class LinkComponent {
    private readonly config: LinkConfig = inject(LINK_CONFIG);

    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    private readonly origin: string = inject(DOCUMENT).location.origin;

    /**
     * How the link looks. The default comes from provideLinkConfig.
     */
    readonly appearance: InputSignal<LinkAppearance> = input<LinkAppearance>(this.config.appearance);

    /**
     * Whether the link takes the full width, like the links of a drawer below each other.
     */
    readonly block: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The tailwind classes for the appearance and the layout.
     */
    protected readonly classes: Signal<string> = computed(() => LinkUtilities.getClasses(this.appearance(), this.block()));

    /**
     * Read after the text of a link that opens in a new tab.
     */
    protected readonly newTabLabel: string = this.config.newTabLabel;

    /**
     * The icon of a link to another site or a new tab.
     */
    protected readonly externalIcon: IconDefinition = faArrowUpRightFromSquare;

    // href and target are attributes of the consumer's own element, not inputs: an input would take a bound [href] away
    // from the element, and routerLink sets the href itself. Static ones are there from the start, which also works
    // when rendered on the server; bound ones and their changes are read in the browser, see the constructor.
    private readonly href: WritableSignal<string | null> = signal(this.element.getAttribute('href'));

    private readonly target: WritableSignal<string | null> = signal(this.element.getAttribute('target'));

    /**
     * Whether the link opens in a new tab.
     */
    protected readonly opensNewTab: Signal<boolean> = computed(() => this.target() === '_blank');

    /**
     * Whether the link shows the icon of a link to another site or a new tab. A button drawn as a link has no href.
     */
    protected readonly showsExternalIcon: Signal<boolean> = computed(() => {
        return this.opensNewTab() || LinkUtilities.isExternal(this.href(), this.origin);
    });

    constructor() {
        const destroyRef: DestroyRef = inject(DestroyRef);
        afterNextRender(() => {
            this.readAttributes();
            const observer: MutationObserver = new MutationObserver(() => this.readAttributes());
            observer.observe(this.element, { attributes: true, attributeFilter: ['href', 'target'] });
            destroyRef.onDestroy(() => observer.disconnect());
        });
    }

    private readAttributes(): void {
        this.href.set(this.element.getAttribute('href'));
        this.target.set(this.element.getAttribute('target'));
    }
}