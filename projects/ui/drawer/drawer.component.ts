import { booleanAttribute, Component, computed, effect, ElementRef, inject, input, InputSignal, InputSignalWithTransform, model, ModelSignal, Signal, viewChild } from '@angular/core';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { DrawerColor } from './drawer-color.type';
import { DrawerConfig } from './drawer-config.model';
import { DRAWER_CONFIG } from './drawer-config.provider';
import { DrawerSide } from './drawer-side.type';

// a modal dialog is centered by its margins and kept smaller than the viewport. The margins put it at its side instead,
// and it takes the full height. It leaves a strip of the page visible, so the user sees there is something behind it.
// It slides in and out, and display and overlay change after the slide, so it stays visible while it moves. A drawer
// sits on elevation 3, like a dialog.
const BASE_CLASSES: string = `
    my-0 h-dvh max-h-none w-80 max-w-[85vw] overflow-auto shadow-3
    backdrop:bg-scrim
    motion-safe:transition-[translate,display,overlay] motion-safe:transition-discrete motion-safe:duration-200
`;

// a theme color is a colored surface, which gives the content the on- colors of it, so its links and buttons keep
// their contrast.
const COLOR_CLASSES: Record<DrawerColor, string> = {
    surface: 'bg-surface text-on-surface',
    container: 'bg-surface-container text-on-surface',
    primary: 'surface-primary',
    secondary: 'surface-secondary'
};

// translated off the screen while it opens and after it closed, towards its own side, which flips in right-to-left.
const SIDE_CLASSES: Record<DrawerSide, string> = {
    start: `
        ms-0 me-auto rounded-e-dialog
        not-open:-translate-x-full
        starting:open:-translate-x-full
        rtl:not-open:translate-x-full
        rtl:starting:open:translate-x-full
    `,
    end: `
        ms-auto me-0 rounded-s-dialog
        not-open:translate-x-full
        starting:open:translate-x-full
        rtl:not-open:-translate-x-full
        rtl:starting:open:-translate-x-full
    `
};

/**
 * A panel that slides in from the side of the screen, like for the navigation on a small screen, on a modal native
 * dialog: `<ui-drawer label="Navigation" [(open)]="open">`. The browser moves focus into it, keeps it there, makes the
 * rest of the page inert, closes it on escape and returns focus to where it was. A click next to it closes it as well.
 */
@Component({
    selector: 'ui-drawer',
    templateUrl: './drawer.component.html',
    imports: [ButtonComponent, IconComponent],
    host: {
        // the dialog is in the top layer while it is open and hidden otherwise, so the wrapper needs no box.
        class: 'contents'
    }
})
export class DrawerComponent {
    private readonly config: DrawerConfig = inject(DRAWER_CONFIG);

    private readonly dialog: Signal<ElementRef<HTMLDialogElement>> = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

    /**
     * Whether the drawer is open. It also closes on escape or a click next to it, bind it with [(open)] to know.
     */
    readonly open: ModelSignal<boolean> = model(false);

    /**
     * The name screen readers announce for the drawer, like "Navigation". Not aria-label, which would stay on the
     * component's own element instead of the dialog.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * The edge of the screen the drawer slides in from. The default comes from provideDrawerConfig.
     */
    readonly side: InputSignal<DrawerSide> = input(this.config.side);

    /**
     * The background of the drawer: the surface, its container, or primary or secondary, whose content takes the on-
     * colors of it. The default comes from provideDrawerConfig.
     */
    readonly color: InputSignal<DrawerColor> = input(this.config.color);

    /**
     * Whether the drawer shows its label as a heading, with a button that closes it, which touch users find more
     * easily than a tap next to it. The default comes from provideDrawerConfig.
     */
    readonly header: InputSignalWithTransform<boolean, unknown> = input(this.config.header, { transform: booleanAttribute });

    /**
     * The name of the button that closes the drawer.
     */
    protected readonly closeLabel: string = this.config.closeLabel;

    /**
     * The icon of the button that closes the drawer.
     */
    protected readonly closeIcon: IconDefinition = faXmark;

    /**
     * The classes of the dialog.
     */
    protected readonly classes: Signal<string> = computed(() => {
        return `${BASE_CLASSES} ${COLOR_CLASSES[this.color()]} ${SIDE_CLASSES[this.side()]}`;
    });

    constructor() {
        // the browser closes the dialog on its own, like on escape, and open follows it through the close event. So it
        // only acts when the two differ.
        effect(() => {
            const dialog: HTMLDialogElement = this.dialog().nativeElement;
            if (this.open() && !dialog.open) {
                dialog.showModal();
            }
            else if (!this.open() && dialog.open) {
                dialog.close();
            }
        });
    }

    /**
     * Closes the drawer when the user clicked next to it, on the backdrop.
     * @param event - The click on the dialog.
     */
    // closedby="any" does this in the browsers that have it. Its content fills the dialog, so a click whose target is
    // the dialog itself can only have been on the backdrop.
    protected closeOnBackdrop(event: MouseEvent): void {
        if (event.target === event.currentTarget) {
            this.open.set(false);
        }
    }
}