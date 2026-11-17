import { booleanAttribute, Component, input, InputSignal, InputSignalWithTransform, output, OutputEmitterRef } from '@angular/core';
import { faFile, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { InputFileView } from './input-file-view.model';

/**
 * One file in the list of ui-input-file: its preview or icon, name, size, error and the button that removes it.
 * Internal to the file input.
 */
@Component({
    // on the li itself, since a list may only hold list items
    selector: 'li[ui-input-file-entry]',
    templateUrl: './input-file-entry.component.html',
    imports: [ButtonComponent, IconComponent],
    host: {
        '[class]': 'file().classes'
    }
})
export class InputFileEntryComponent {
    /**
     * The file.
     */
    readonly file: InputSignal<InputFileView> = input.required<InputFileView>();

    /**
     * Whether the file can be removed.
     */
    readonly removable: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The name of the button that removes the file, read together with the name of the file.
     */
    readonly removeLabel: InputSignal<string> = input.required<string>();

    /**
     * Emits when the user removes the file.
     */
    readonly removed: OutputEmitterRef<void> = output();

    /**
     * The icon of a file that has no preview.
     */
    protected readonly fileIcon: IconDefinition = faFile;

    /**
     * The icon of the button that removes the file.
     */
    protected readonly removeIcon: IconDefinition = faXmark;
}