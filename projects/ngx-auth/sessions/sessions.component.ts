import { afterNextRender, Component, computed, inject, LOCALE_ID, Signal, signal, WritableSignal } from '@angular/core';
import { AuthErrorUtilities, AuthService } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';
import { ConfirmDialogComponent, ConfirmDialogData, DialogService } from '@service-soft/ui/dialog';
import { UserLogin } from 'zibri-contract';

import { SessionRow } from './session-row.model';
import { SessionsLabels } from './sessions-config.model';
import { SESSIONS_CONFIG } from './sessions-config.provider';

/**
 * Where the logged in user is logged in, for the page of their account, the most recently used first: ends one login,
 * like on a device that went missing, or every login after asking. Its heading is a h2, below the heading of that page.
 * Its texts come from provideSessionsConfig.
 */
@Component({
    selector: 'ngx-sessions',
    templateUrl: './sessions.component.html',
    imports: [ButtonComponent],
    host: {
        class: 'block'
    }
})
export class SessionsComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    private readonly dialogService: DialogService = inject(DialogService);

    private readonly dateFormat: Intl.DateTimeFormat = new Intl.DateTimeFormat(
        inject(LOCALE_ID),
        { dateStyle: 'medium', timeStyle: 'short' }
    );

    // the logins, undefined until zibri answered.
    private readonly logins: WritableSignal<UserLogin[] | undefined> = signal(undefined);

    // a second click while a request is on its way would send it twice.
    private sending: boolean = false;

    /**
     * The texts.
     */
    protected readonly labels: SessionsLabels = inject(SESSIONS_CONFIG).labels;

    /**
     * What zibri answered the last refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last action did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    /**
     * The logins, as the user reads them.
     */
    protected readonly rows: Signal<SessionRow[]> = computed(() => (this.logins() ?? []).map(login => ({
        login,
        browserId: `ngx-session-${login.id}`,
        browser: login.userAgent ?? this.labels.unknownBrowser,
        detail: this.resolveDetail(login)
    })));

    constructor() {
        afterNextRender(() => void this.run(async () => await this.loadLogins()));
    }

    /**
     * Ends one login. Ending the one of this browser logs it out.
     * @param row - The login.
     */
    protected async logout(row: SessionRow): Promise<void> {
        await this.run(async () => {
            await this.authService.endLogin(row.login);
            if (!row.login.current) {
                await this.loadLogins();
                this.status.set(this.labels.loggedOut);
            }
        });
    }

    /**
     * Ends every login once the user confirmed it, this one too.
     */
    protected async logoutEverywhere(): Promise<void> {
        const data: ConfirmDialogData = {
            title: this.labels.logoutEverywhereTitle,
            paragraphs: [this.labels.logoutEverywhereMessage],
            confirmButtonLabel: this.labels.logoutEverywhere,
            cancelButtonLabel: this.labels.cancel,
            confirmButtonColor: 'error'
        };
        if (await this.dialogService.open<boolean>(ConfirmDialogComponent, data).closed !== true) {
            return;
        }
        await this.run(async () => await this.authService.logoutEverywhere());
    }

    private resolveDetail(login: UserLogin): string {
        const parts: string[] = [
            ...login.current ? [this.labels.thisDevice] : [],
            ...login.lastUsedAt == undefined ? [] : [this.labels.lastUsedOn(this.dateFormat.format(new Date(login.lastUsedAt)))],
            ...login.ipAddress == undefined ? [] : [login.ipAddress]
        ];
        return parts.join(' · ');
    }

    private async loadLogins(): Promise<void> {
        this.logins.set(await this.authService.resolveLogins());
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