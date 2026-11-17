import { Component, input, InputSignal } from '@angular/core';
import { faFile } from '@fortawesome/free-solid-svg-icons';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';

import { InputFileView } from './input-file-view.model';

/**
 * The preview or icon, the name and the size of the only file of ui-input-file, in the box that shows it. Internal to
 * the file input.
 */
@Component({
    selector: 'ui-input-file-summary',
    templateUrl: './input-file-summary.component.html',
    imports: [IconComponent],
    host: {
        // its parts are items of the box, next to the button that removes the file
        class: 'contents'
    }
})
export class InputFileSummaryComponent {
    /**
     * The file.
     */
    readonly file: InputSignal<InputFileView> = input.required<InputFileView>();

    /**
     * The icon of a file that has no preview.
     */
    protected readonly fileIcon: IconDefinition = faFile;
}