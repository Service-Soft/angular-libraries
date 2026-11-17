import { afterNextRender, Component, computed, ElementRef, inject, Injector, Signal, signal, WritableSignal } from '@angular/core';
import { AuthErrorUtilities, AuthService } from '@service-soft/ngx-auth/auth';
import { SECOND_FACTOR_CONFIG, SecondFactorConfig } from '@service-soft/ngx-auth/second-factor';
import { ButtonComponent } from '@service-soft/ui/button';
import { ConfirmDialogComponent, ConfirmDialogData, DialogService } from '@service-soft/ui/dialog';

import { TwoFactorLabels } from './two-factor-config.model';
import { TWO_FACTOR_CONFIG } from './two-factor-config.provider';
import { TwoFactorEnrollmentComponent } from './two-factor-enrollment.component';
import { TwoFactorMethodAction, TwoFactorMethodRow } from './two-factor-method-row.model';

/**
 * The two factor methods of the logged in user, for the page of their account: which ones are on, setting one up and
 * turning one off. To change them, zibri asks for the second factor or a recent login, which the interceptor asks the
 * user for with the secondFactorPrompt. Its heading is a h2, below the heading of that page. The methods it offers come
 * from provideSecondFactorConfig, its texts from provideTwoFactorConfig.
 */
@Component({
    selector: 'ngx-two-factor-settings',
    templateUrl: './two-factor-settings.component.html',
    imports: [ButtonComponent, TwoFactorEnrollmentComponent],
    host: {
        class: 'block'
    }
})
export class TwoFactorSettingsComponent {
    private readonly authService: AuthService = inject<AuthService>(AuthService);

    private readonly dialogService: DialogService = inject(DialogService);

    private readonly secondFactorConfig: SecondFactorConfig = inject(SECOND_FACTOR_CONFIG);

    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    private readonly injector: Injector = inject(Injector);

    // the methods the user enrolled, undefined until zibri answered.
    private readonly enrolledMethods: WritableSignal<string[] | undefined> = signal(undefined);

    // the method being enrolled.
    private readonly enrolling: WritableSignal<string | undefined> = signal(undefined);

    /**
     * The texts of the settings.
     */
    protected readonly labels: TwoFactorLabels = inject(TWO_FACTOR_CONFIG).labels;

    /**
     * What zibri answered the last refused request with, empty while nothing was refused.
     */
    protected readonly errorParagraphs: WritableSignal<string[]> = signal([]);

    /**
     * What the last action did, which screen readers announce.
     */
    protected readonly status: WritableSignal<string> = signal('');

    /**
     * The methods, once zibri said which ones the user enrolled.
     */
    protected readonly rows: Signal<TwoFactorMethodRow[]> = computed(() => {
        const enrolledMethods: string[] | undefined = this.enrolledMethods();
        if (enrolledMethods == undefined) {
            return [];
        }
        return Object.keys(this.secondFactorConfig.methods).flatMap(method => {
            const name: string | undefined = this.secondFactorConfig.labels.methods[method]?.name;
            if (name == undefined) {
                return [];
            }
            const enrolled: boolean = enrolledMethods.includes(method);
            return [
                {
                    method,
                    nameId: `ngx-two-factor-method-${method}`,
                    name,
                    status: enrolled ? this.labels.on : this.labels.off,
                    actions: this.resolveActions(method, enrolled),
                    enrolling: this.enrolling() === method
                }
            ];
        });
    });

    constructor() {
        afterNextRender(() => void this.run(async () => await this.loadMethods()));
    }

    /**
     * Sets a method up, or turns it off once the user confirmed it.
     * @param row - The method.
     * @param action - What to do.
     */
    protected async act(row: TwoFactorMethodRow, action: TwoFactorMethodAction): Promise<void> {
        if (action.kind === 'setUp') {
            this.status.set('');
            this.enrolling.set(row.method);
            return;
        }
        const data: ConfirmDialogData = {
            title: this.labels.turnOffTitle,
            paragraphs: [this.labels.turnOffMessage],
            confirmButtonLabel: this.labels.turnOff,
            cancelButtonLabel: this.labels.cancel,
            confirmButtonColor: 'error'
        };
        if (await this.dialogService.open<boolean>(ConfirmDialogComponent, data).closed !== true) {
            return;
        }
        await this.run(async () => {
            await this.authService.removeTwoFactorRegistration(row.method);
            await this.loadMethods();
            this.status.set(this.labels.turnedOff);
        });
        this.focusActionsOf(row.method);
    }

    /**
     * Ends the enrollment once the method is on.
     * @param method - The method.
     */
    protected async finishEnrollment(method: string): Promise<void> {
        this.enrolling.set(undefined);
        this.status.set(this.labels.turnedOn);
        await this.run(async () => await this.loadMethods());
        this.focusActionsOf(method);
    }

    /**
     * Ends the enrollment without turning the method on.
     * @param method - The method.
     */
    protected cancelEnrollment(method: string): void {
        this.enrolling.set(undefined);
        this.focusActionsOf(method);
    }

    private resolveActions(method: string, enrolled: boolean): TwoFactorMethodAction[] {
        if (!enrolled) {
            return [{ kind: 'setUp', label: this.labels.setUp, color: 'primary' }];
        }
        const turnOff: TwoFactorMethodAction = { kind: 'turnOff', label: this.labels.turnOff, color: 'error' };
        // a new set of recovery codes replaces the old one once it is confirmed
        return this.secondFactorConfig.methods[method]?.enrollment === 'recoveryCodes'
            ? [{ kind: 'setUp', label: this.labels.newRecoveryCodes, color: 'primary' }, turnOff]
            : [turnOff];
    }

    private async loadMethods(): Promise<void> {
        this.enrolledMethods.set(await this.authService.resolveTwoFactorMethods());
    }

    // the enrollment or the button the user pressed is gone, and the focus with it
    private focusActionsOf(method: string): void {
        afterNextRender(
            () => this.element.querySelector<HTMLElement>(`[data-method="${method}"] button`)?.focus(),
            { injector: this.injector }
        );
    }

    private async run(work: () => Promise<void>): Promise<void> {
        this.errorParagraphs.set([]);
        try {
            await work();
        }
        catch (error) {
            this.errorParagraphs.set(AuthErrorUtilities.findErrorParagraphs(error) ?? [this.labels.failed]);
        }
    }
}