import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { afterNextRender, Component, inject, input, InputSignal, Service } from '@angular/core';
import { provideRouter } from '@angular/router';
import { authInterceptor, AuthService, provideAuth } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';
import { HttpTestingUtilities } from 'testing/http';

import { TwoFactorDialogPrompt } from './two-factor-dialog-prompt.service';

@Service()
class StoryAuthService extends AuthService {}

// asks right away, like a request that needs a second factor, and offers to ask again.
@Component({
    selector: 'ngx-second-factor-request',
    template: '<button ui-button type="button" variant="outlined" (click)="ask()">Change payment details</button>',
    imports: [ButtonComponent]
})
class SecondFactorRequestComponent {
    private readonly prompt: TwoFactorDialogPrompt = inject(TwoFactorDialogPrompt);

    readonly methods: InputSignal<string[]> = input<string[]>([]);

    constructor() {
        afterNextRender(() => void this.ask());
    }

    async ask(): Promise<void> {
        await this.prompt.resolveSecondFactor(this.methods());
    }
}

const meta: Meta<SecondFactorRequestComponent> = {
    title: 'Auth/Two factor dialog',
    component: SecondFactorRequestComponent,
    decorators: [
        applicationConfig({
            providers: [
                provideRouter([]),
                provideHttpClient(withInterceptors([
                    authInterceptor,
                    HttpTestingUtilities.answerWith({ 'POST /api/auth/2fa/request': { status: 204 } })
                ])),
                provideAuth(StoryAuthService, { apiUrl: '/api/auth', strategy: 'cookie' })
            ]
        })
    ],
    args: { methods: ['otp', 'recovery-code'] }
};
export default meta;

type Story = StoryObj<SecondFactorRequestComponent>;

export const Default: Story = {};

export const SendsCode: Story = {
    args: { methods: ['email', 'otp'] }
};