import { Component, computed, input, InputSignal, Signal } from '@angular/core';

import { IconDefinition } from './icon-definition.model';

/**
 * Draws an icon from its definition, like the icons of Font Awesome: `<ui-icon [icon]="faClock" />`.
 * It is sized in em and drawn in the text color, so it grows with the text and takes its contrast: change its size with
 * the font size and its color with the text color. Decorative unless it has a label, which screen readers read instead
 * of the icon.
 */
@Component({
    selector: 'ui-icon',
    templateUrl: './icon.component.html',
    host: {
        // no box of its own, so the svg sits in the layout as if there was no wrapper, and components that size the
        // svgs inside of them, like buttons, size this one too.
        class: 'contents'
    }
})
export class IconComponent {
    /**
     * The icon to draw, like faClock from '@fortawesome/free-solid-svg-icons'. Importing single icons like that keeps
     * every other icon out of the bundle.
     */
    readonly icon: InputSignal<IconDefinition> = input.required<IconDefinition>();

    /**
     * What the icon means, for an icon that stands on its own. Leave it out for an icon next to text that says the same,
     * which screen readers then skip.
     */
    readonly label: InputSignal<string | undefined> = input<string>();

    /**
     * The view box of the svg, from the size of the icon.
     */
    protected readonly viewBox: Signal<string> = computed(() => `0 0 ${this.icon().icon[0]} ${this.icon().icon[1]}`);

    /**
     * An image for screen readers when the icon has a label.
     */
    protected readonly role: Signal<'img' | undefined> = computed(() => this.label() == undefined ? undefined : 'img');

    /**
     * Hides a decorative icon from screen readers.
     */
    protected readonly ariaHidden: Signal<'true' | undefined> = computed(() => this.label() == undefined ? 'true' : undefined);

    /**
     * The paths of the icon: one, or several for duotone icons.
     */
    protected readonly paths: Signal<string[]> = computed(() => {
        const path: string | string[] = this.icon().icon[4];
        return typeof path === 'string' ? [path] : path;
    });
}