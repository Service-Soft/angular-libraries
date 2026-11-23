import {
    booleanAttribute,
    Component,
    computed,
    inject,
    input,
    InputSignal,
    InputSignalWithTransform,
    output,
    OutputEmitterRef,
    Signal
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NavLinkView } from '@service-soft/ngx-navigation/navigation';
import { BUTTON_CONFIG, ButtonColor, ButtonComponent, ButtonConfig, ButtonVariant } from '@service-soft/ui/button';
import { IconDefinition } from '@service-soft/ui/icon';
import { LinkAppearance, LinkComponent } from '@service-soft/ui/link';

import { NavLabelComponent } from './nav-label.component';

/**
 * The `<a ui-link>` of a link with a name: a routerLink inside the app, which tells screen readers when it is the
 * current page, or an href to another site. With a variant it is an `<a ui-button>` instead.
 */
@Component({
    selector: 'ngx-nav-anchor',
    templateUrl: './nav-anchor.component.html',
    imports: [ButtonComponent, LinkComponent, NavLabelComponent, RouterLink, RouterLinkActive],
    host: {
        class: 'contents'
    }
})
export class NavAnchorComponent {
    private readonly buttonConfig: ButtonConfig = inject(BUTTON_CONFIG);

    /**
     * The attributes of the link.
     */
    readonly link: InputSignal<NavLinkView> = input.required<NavLinkView>();

    /**
     * How the link looks.
     */
    readonly appearance: InputSignal<LinkAppearance> = input.required<LinkAppearance>();

    /**
     * Whether the link takes the full width, like in the drawer.
     */
    readonly block: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The name of the link.
     */
    readonly name: InputSignal<string> = input.required<string>();

    /**
     * The icon in front of the name.
     */
    readonly icon: InputSignal<IconDefinition | undefined> = input<IconDefinition>();

    /**
     * Draws the link as a button of this variant, undefined for a link.
     */
    readonly variant: InputSignal<ButtonVariant | undefined> = input<ButtonVariant>();

    /**
     * The color of the button, the one of `ui-button` by default.
     */
    readonly color: InputSignal<ButtonColor | undefined> = input<ButtonColor>();

    /**
     * The color the button is drawn with.
     */
    protected readonly buttonColor: Signal<ButtonColor> = computed(() => this.color() ?? this.buttonConfig.color);

    /**
     * Emits whether a link inside the app is the current page, whenever that changes, once it says so to screen
     * readers.
     */
    readonly activeChange: OutputEmitterRef<boolean> = output<boolean>();
}