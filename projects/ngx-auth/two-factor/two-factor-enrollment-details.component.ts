import { Component, computed, inject, input, InputSignal, Signal } from '@angular/core';
import { encode } from 'uqr';
import { OtpRegistration, RecoveryCodeRegistration } from 'zibri-contract';

import { TwoFactorLabels } from './two-factor-config.model';
import { TWO_FACTOR_CONFIG } from './two-factor-config.provider';

// the quiet zone scanners need around a qr code, in modules.
const QR_CODE_BORDER: number = 4;

/**
 * The qr code of an authenticator app, as an svg.
 */
type QrCode = {
    /**
     * The width and height, in modules.
     */
    size: number,
    /**
     * The path of the dark modules.
     */
    path: string
};

/**
 * What the TwoFactorEnrollmentComponent shows before the first code: the qr code and secret of an authenticator app, or
 * the recovery codes to save. Nothing for a method that sends its code.
 */
@Component({
    selector: 'ngx-two-factor-enrollment-details',
    templateUrl: './two-factor-enrollment-details.component.html',
    host: {
        class: 'contents'
    }
})
export class TwoFactorEnrollmentDetailsComponent {
    /**
     * The texts of the enrollment.
     */
    protected readonly labels: TwoFactorLabels = inject(TWO_FACTOR_CONFIG).labels;

    /**
     * What zibri answered when the enrollment started.
     */
    readonly registration: InputSignal<OtpRegistration | RecoveryCodeRegistration | undefined> = input.required<
        OtpRegistration | RecoveryCodeRegistration | undefined
    >();

    /**
     * The registration of an authenticator app.
     */
    protected readonly otpRegistration: Signal<OtpRegistration | undefined> = computed(() => {
        const registration: OtpRegistration | RecoveryCodeRegistration | undefined = this.registration();
        return registration != undefined && 'qrCodeUrl' in registration ? registration : undefined;
    });

    /**
     * The recovery codes to save.
     */
    protected readonly recoveryCodes: Signal<string[] | undefined> = computed(() => {
        const registration: OtpRegistration | RecoveryCodeRegistration | undefined = this.registration();
        return registration != undefined && 'codes' in registration ? registration.codes : undefined;
    });

    /**
     * The qr code of the otpauth url.
     */
    protected readonly qrCode: Signal<QrCode | undefined> = computed(() => {
        const registration: OtpRegistration | undefined = this.otpRegistration();
        if (registration == undefined) {
            return undefined;
        }
        const modules: boolean[][] = encode(registration.qrCodeUrl, { border: QR_CODE_BORDER }).data;
        // one square per dark module, drawn in one path
        const path: string = modules
            .flatMap((row, y) => row.map((dark, x) => dark ? `M${x} ${y}h1v1h-1z` : ''))
            .join('');
        return { size: modules.length, path };
    });
}