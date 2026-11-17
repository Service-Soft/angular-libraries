import { NgTemplateOutlet } from '@angular/common';
import { Component, input, InputSignal } from '@angular/core';

import { HeadingLevel } from './heading-level.type';

/**
 * A native heading whose level is a value, for a component whose heading has to fit the page it is used on:
 * `<ui-heading class="font-heading text-title" [level]="level()">Prices</ui-heading>` renders an `<h2>` to `<h6>`, or
 * an `<h1>`, which search engines and screen readers read as the heading it is. Its content is your own, like a text or
 * a link. The heading takes the look of the element, so style the element; Tailwind's preflight gives headings the font
 * of what they are in.
 */
@Component({
    selector: 'ui-heading',
    templateUrl: './heading.component.html',
    imports: [NgTemplateOutlet],
    host: {
        class: 'block'
    }
})
export class HeadingComponent {
    /**
     * The level of the heading, 1 for the title of a page.
     */
    readonly level: InputSignal<HeadingLevel> = input.required<HeadingLevel>();
}