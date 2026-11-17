import { Component, input, InputSignal } from '@angular/core';
import { SpinnerComponent, SpinnerSize } from '@service-soft/ui/spinner';

/**
 * What the uiLoading directive shows over an area while it loads: the scrim of the theme over the area, and a spinner
 * on the surface in its middle. Created by the directive, not used on its own.
 */
@Component({
    selector: 'ui-loading-overlay',
    templateUrl: './loading-overlay.component.html',
    imports: [SpinnerComponent],
    host: {
        // over the whole area, with its corners, and above what it covers, so a click on the area doesn't reach it
        class: 'absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-scrim'
    }
})
export class LoadingOverlayComponent {
    /**
     * What screen readers read for the spinner.
     */
    readonly label: InputSignal<string> = input.required<string>();

    /**
     * How large the spinner is.
     */
    readonly size: InputSignal<SpinnerSize> = input.required<SpinnerSize>();
}