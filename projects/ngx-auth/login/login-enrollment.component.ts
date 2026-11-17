import { Component, computed, inject, input, InputSignal, output, OutputEmitterRef, Signal, signal, WritableSignal } from '@angular/core';
import { LoginResult } from '@service-soft/ngx-auth/auth';
import { SECOND_FACTOR_CONFIG, SecondFactorConfig } from '@service-soft/ngx-auth/second-factor';
import { TwoFactorEnrollmentComponent, TwoFactorEnrollmentResult } from '@service-soft/ngx-auth/two-factor';
import { ButtonComponent } from '@service-soft/ui/button';

import { LoginLabels } from './login-config.model';
import { LOGIN_CONFIG } from './login-config.provider';

/**
 * A two factor method the user can enroll at login.
 */
type OfferedMethod = {
    /**
     * The name of the method, like 'otp'.
     */
    method: string,
    /**
     * The name the user reads, like 'Authenticator app'.
     */
    name: string
};

/**
 * The step of the LoginComponent that enrolls the first second factor of a user who has none, when their account needs
 * one to log in: the user picks a method and enrolls it.
 */
@Component({
    selector: 'ngx-login-enrollment',
    templateUrl: './login-enrollment.component.html',
    imports: [ButtonComponent, TwoFactorEnrollmentComponent],
    host: {
        class: 'block'
    }
})
export class LoginEnrollmentComponent {
    private readonly secondFactorConfig: SecondFactorConfig = inject(SECOND_FACTOR_CONFIG);

    /**
     * The texts of the login.
     */
    protected readonly labels: LoginLabels = inject(LOGIN_CONFIG).labels;

    /**
     * The ticket of the login.
     */
    readonly ticket: InputSignal<string> = input.required<string>();

    /**
     * The email the user logged in with, which the device lists a passkey under.
     */
    readonly email: InputSignal<string> = input.required<string>();

    /**
     * Emits where the login stands once the method is on.
     */
    readonly enrolled: OutputEmitterRef<LoginResult> = output<LoginResult>();

    /**
     * The method the user picked.
     */
    protected readonly method: WritableSignal<string | undefined> = signal(undefined);

    /**
     * The methods the user can pick.
     */
    // recovery codes are no first factor: logging in with one would spend one of the codes right away
    protected readonly methods: Signal<OfferedMethod[]> = computed(() => Object.entries(this.secondFactorConfig.methods)
        .filter(([, options]) => options != undefined && options.enrollment !== 'recoveryCodes')
        .flatMap(([method]) => {
            const name: string | undefined = this.secondFactorConfig.labels.methods[method]?.name;
            return name == undefined ? [] : [{ method, name }];
        }));

    /**
     * Passes on where the login stands, which an enrollment with a ticket always says.
     * @param result - What the enrollment did.
     */
    protected finish(result: TwoFactorEnrollmentResult): void {
        // with a ticket, the enrollment always resolves the login
        this.enrolled.emit(result.loginResult ?? { type: 'secondFactorRequired', ticket: this.ticket(), methods: [result.method] });
    }
}