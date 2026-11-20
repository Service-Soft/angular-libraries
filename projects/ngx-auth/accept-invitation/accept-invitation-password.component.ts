import { Component, input, InputSignal, output, OutputEmitterRef, signal, WritableSignal } from '@angular/core';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { InputStringComponent } from '@service-soft/ui/input-string';

import { AcceptInvitationLabels } from './accept-invitation-config.model';

/**
 * The form of the page of an invitation that creates its account, which asks for its password.
 */
@Component({
    selector: 'ngx-accept-invitation-password',
    templateUrl: './accept-invitation-password.component.html',
    imports: [FormComponent, InputStringComponent, ButtonComponent],
    host: {
        class: 'block'
    }
})
export class AcceptInvitationPasswordComponent {
    /**
     * The texts of the page.
     */
    readonly labels: InputSignal<AcceptInvitationLabels> = input.required<AcceptInvitationLabels>();

    /**
     * The least number of characters of the password, or undefined to leave it to zibri.
     */
    readonly minLength: InputSignal<number | undefined> = input.required<number | undefined>();

    /**
     * Whether the invitation may be declined, which a button next to accepting does.
     */
    readonly declinable: InputSignal<boolean> = input.required<boolean>();

    /**
     * Emits the password once the user accepts with it.
     */
    readonly accepted: OutputEmitterRef<string> = output<string>();

    /**
     * Emits once the user declines.
     */
    readonly declined: OutputEmitterRef<void> = output<void>();

    /**
     * The password the user typed.
     */
    protected readonly password: WritableSignal<string> = signal('');
}