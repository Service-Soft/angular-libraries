import { Component, input, InputSignal } from '@angular/core';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

/**
 * The name of an element, with its icon in front if it has one.
 */
@Component({
    selector: 'ngx-nav-label',
    templateUrl: './nav-label.component.html',
    imports: [IconComponent],
    host: {
        // the icon and the name sit in the link or button around them, which sizes and spaces them.
        class: 'contents'
    }
})
export class NavLabelComponent {
    /**
     * The name.
     */
    readonly name: InputSignal<string> = input.required<string>();

    /**
     * The icon in front of the name.
     */
    readonly icon: InputSignal<IconDefinition | undefined> = input<IconDefinition>();
}