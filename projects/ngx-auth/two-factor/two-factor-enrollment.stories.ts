import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, Provider, Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { HttpTestingUtilities } from 'testing/http';
import { OtpRegistration, RecoveryCodeRegistration } from 'zibri-contract';

import { TwoFactorEnrollmentComponent } from './two-factor-enrollment.component';

@Service()
class StoryAuthService extends AuthService {}

// zibri, as far as an enrollment gets: it starts with what the method of the story answers.
function answerRegistrationWith(
    registration: OtpRegistration | RecoveryCodeRegistration | PublicKeyCredentialCreationOptionsJSON | undefined
): (Provider | EnvironmentProviders)[] {
    return [
        provideRouter([]),
        provideHttpClient(withInterceptors([
            authInterceptor,
            HttpTestingUtilities.answerWith({
                'POST /api/auth/2fa/registration/request': registration == undefined ? { status: 204 } : { status: 200, body: registration }
            })
        ])),
        provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
    ];
}

const meta: Meta<TwoFactorEnrollmentComponent> = {
    title: 'Auth/Two factor enrollment',
    component: TwoFactorEnrollmentComponent,
    decorators: [
        applicationConfig({
            providers: answerRegistrationWith({
                qrCodeUrl: 'otpauth://totp/Example:ada%40example.com?secret=SECRET&issuer=Example',
                secret: 'SECRET'
            })
        })
    ],
    args: { method: 'otp' }
};
export default meta;

type Story = StoryObj<TwoFactorEnrollmentComponent>;

export const AuthenticatorApp: Story = {};

export const Email: Story = {
    args: { method: 'email' },
    decorators: [applicationConfig({ providers: answerRegistrationWith(undefined) })]
};

export const TextMessage: Story = {
    args: { method: 'sms' },
    decorators: [applicationConfig({ providers: answerRegistrationWith(undefined) })]
};

export const Passkey: Story = {
    args: { method: 'passkey', passkeyName: 'Ada' },
    decorators: [
        applicationConfig({
            providers: answerRegistrationWith({
                challenge: 'challenge',
                rp: { name: 'Example' },
                user: { id: 'user-1', name: 'Ada', displayName: 'Ada' },
                pubKeyCredParams: [{ type: 'public-key', alg: -7 }]
            })
        })
    ]
};

export const RecoveryCodes: Story = {
    args: { method: 'recovery-code' },
    decorators: [
        applicationConfig({
            providers: answerRegistrationWith({ codes: ['FIRST-CODE', 'SECOND-CODE', 'THIRD-CODE', 'FOURTH-CODE', 'FIFTH-CODE'] })
        })
    ]
};