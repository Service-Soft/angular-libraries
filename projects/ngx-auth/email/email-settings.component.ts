import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { AuthErrorUtilities, AuthService } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { InputStringComponent } from '@service-soft/ui/input-string';
import { CurrentUserProfile } from 'zibri-contract';

import { EmailSettingsLabels } from './email-settings-config.model';
import { EMAIL_SETTINGS_CONFIG } from './email-settings-config.provider';

/**
 * The email of the logged in user, for the page of their account: whether it is verified, a link to verify it, and
 * changing it, which zibri mails a link for. To change it, zibri wants the second factor or a recent login, which the
 * interceptor asks the user for with the secondFactorPrompt. Its heading is a h2, below the heading of that page. Its
 * texts come from provideEmailSettingsConfig.
 */
@Component({
    selector: 'ngx-email-settings',
    templateUrl: './email-settings.component.html',
    imports: [ButtonComponent, FormComponent, InputStringComponent],
    host: {
        class: 'block'
    }
})
export class EmailSettingsComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    // a second click while a request is on its way would mail a second link.
    private sending: boolean = false;

    /**
     * The texts.
     */
    protected readonly labels: EmailSettingsLabels = inject(EMAIL_SETTINGS_CONFIG).labels;

    /**
     * The user, as GET /me answered.
     */
    protected readonly user: Signal<CurrentUserProfile<string, string> | undefined> = this.authService.currentUser;

    /**
     * Whether the email of the user is verified.
     */
    protected readonly verified: Signal<boolean> = computed(() => this.user()?.emailVerifiedAt != undefined);

    /**
     * Says whether the email is verified.
     */
    protected readonly verification: Signal<string> = computed(() => this.verified() ? this.labels.verified : this.labels.notVerified);

    /**
     * The new email the user typed.
     */
    protected readonly newEmail: WritableSignal<string> = signal('');

    /**
     * Whether the input of the new email shows its error.
     */
    protected readonly newEmailErrorShown: WritableSignal<boolean> = signal(false);

    /**
     * What zibri answered the last refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last request did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    /**
     * Mails a link to verify the email.
     */
    protected async sendVerification(): Promise<void> {
        await this.run(async () => {
            await this.authService.requestEmailVerification();
            this.status.set(this.labels.verificationSent);
        });
    }

    /**
     * Mails the link of a change to the new email.
     */
    protected async change(): Promise<void> {
        await this.run(async () => {
            const newEmail: string = this.newEmail();
            await this.authService.requestEmailChange(newEmail);
            // an empty input that still shows its error would say it is required right after a success
            this.newEmail.set('');
            this.newEmailErrorShown.set(false);
            this.status.set(this.labels.changeRequested(newEmail));
        });
    }

    private async run(work: () => Promise<void>): Promise<void> {
        if (this.sending) {
            return;
        }
        this.sending = true;
        this.errorParagraphs.set([]);
        this.status.set('');
        try {
            await work();
        }
        catch (error) {
            this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
        }
        finally {
            this.sending = false;
        }
    }
}