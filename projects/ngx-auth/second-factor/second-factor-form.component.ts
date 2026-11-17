import { afterNextRender, Component, computed, ElementRef, inject, Injector, input, InputSignal, linkedSignal, output, OutputEmitterRef, Signal, signal, viewChild, WritableSignal } from '@angular/core';
import { SecondFactor } from '@service-soft/ngx-auth/auth';
import { ButtonComponent } from '@service-soft/ui/button';
import { FormComponent } from '@service-soft/ui/form';
import { InputMode, InputStringComponent } from '@service-soft/ui/input-string';
import { LinkComponent } from '@service-soft/ui/link';

import { SecondFactorCodeRequest } from './second-factor-code-request.model';
import { SecondFactorConfig, SecondFactorLabels } from './second-factor-config.model';
import { SECOND_FACTOR_CONFIG } from './second-factor-config.provider';

/**
 * A two factor method the user can switch to.
 */
type OtherMethod = {
    /**
     * The name of the method, like 'otp'.
     */
    method: string,
    /**
     * The button that switches to it.
     */
    label: string
};

/**
 * Asks for the code of a second factor, of one of the methods the user enrolled, and lets them switch to another. It
 * sends no request itself: it emits the second factor once the user confirms it, and asks for the code of a method that
 * sends one when the user picks it or wants a new one. The LoginComponent and the TwoFactorDialogPrompt use it. Its
 * texts and the methods it offers come from provideSecondFactorConfig.
 */
@Component({
    selector: 'ngx-second-factor-form',
    templateUrl: './second-factor-form.component.html',
    imports: [FormComponent, InputStringComponent, ButtonComponent, LinkComponent],
    host: {
        class: 'block'
    }
})
export class SecondFactorFormComponent {
    private readonly config: SecondFactorConfig = inject(SECOND_FACTOR_CONFIG);

    private readonly injector: Injector = inject(Injector);

    private readonly codeInput: Signal<InputStringComponent | undefined> = viewChild(InputStringComponent);

    // the element, not the button component on it
    private readonly passkeyButton: Signal<ElementRef<HTMLElement> | undefined> = viewChild(
        'passkeyButton',
        { read: ElementRef<HTMLElement> }
    );

    /**
     * The texts of the form.
     */
    protected readonly labels: SecondFactorLabels = this.config.labels;

    /**
     * The two factor methods the user enrolled, like the methods zibri answered with. The first one the form can ask for
     * shows first.
     */
    readonly methods: InputSignal<string[]> = input.required<string[]>();

    /**
     * Emits the second factor once the user confirms it.
     */
    readonly confirmed: OutputEmitterRef<SecondFactor> = output<SecondFactor>();

    /**
     * Emits when the code of a method that sends one should be sent: when the user picks the method, and when they want
     * a new code.
     */
    readonly codeRequested: OutputEmitterRef<SecondFactorCodeRequest> = output<SecondFactorCodeRequest>();

    /**
     * Emits the method when the user wants to present a passkey, which the component around it has the browser use.
     */
    readonly passkeyRequested: OutputEmitterRef<string> = output<string>();

    /**
     * The methods of the user the form can ask for.
     */
    protected readonly usableMethods: Signal<string[]> = computed(() => {
        return this.methods().filter(method => this.config.methods[method] != undefined && this.labels.methods[method] != undefined);
    });

    /**
     * The method the user presents, or undefined when there is none the form can ask for.
     */
    protected readonly method: WritableSignal<string | undefined> = linkedSignal(() => this.usableMethods().at(0));

    /**
     * The current method, when the browser confirms it with a passkey.
     */
    protected readonly passkeyMethod: Signal<string | undefined> = computed(() => {
        const method: string | undefined = this.method();
        return method != undefined && this.config.methods[method]?.confirmation === 'passkey' ? method : undefined;
    });

    /**
     * The current method, when the user confirms it with a code.
     */
    protected readonly codeMethod: Signal<string | undefined> = computed(() => {
        const method: string | undefined = this.method();
        return method != undefined && this.config.methods[method]?.confirmation === 'code' ? method : undefined;
    });

    /**
     * The code the user typed.
     */
    protected readonly code: WritableSignal<string> = signal('');

    /**
     * Says where the user finds the code of the current method.
     */
    protected readonly codeHint: Signal<string | undefined> = computed(() => {
        const method: string | undefined = this.method();
        return method == undefined ? undefined : this.labels.methods[method]?.hint;
    });

    /**
     * The keyboard phones show for the code of the current method.
     */
    protected readonly codeInputMode: Signal<InputMode> = computed(() => {
        const method: string | undefined = this.method();
        return method != undefined && this.config.methods[method]?.numeric === true ? 'numeric' : 'text';
    });

    /**
     * Whether zibri sends the code of the current method, which the user can have sent again.
     */
    protected readonly sendsCode: Signal<boolean> = computed(() => {
        const method: string | undefined = this.method();
        return method != undefined && this.config.methods[method]?.sendsCode === true;
    });

    /**
     * The methods the user can switch to.
     */
    protected readonly otherMethods: Signal<OtherMethod[]> = computed(() => {
        const current: string | undefined = this.method();
        return this.usableMethods()
            .filter(method => method !== current)
            .map(method => ({ method, label: this.labels.methods[method]?.choose ?? method }));
    });

    constructor() {
        // once rendered, so the component around it listens already
        afterNextRender(() => this.requestFirstCode());
    }

    /**
     * Focuses the input of the code, or the button of a passkey.
     */
    focus(): void {
        const codeInput: InputStringComponent | undefined = this.codeInput();
        if (codeInput == undefined) {
            this.passkeyButton()?.nativeElement.focus();
            return;
        }
        codeInput.focus();
    }

    /**
     * Switches to another method, and asks for its code when zibri sends it.
     * @param method - The name of the method.
     */
    protected choose(method: string): void {
        this.method.set(method);
        this.code.set('');
        this.requestFirstCode();
        // the button the user pressed is gone, and the focus with it
        afterNextRender(() => this.focus(), { injector: this.injector });
    }

    /**
     * Emits the second factor the user typed.
     * @param method - The method of the code.
     */
    protected confirm(method: string): void {
        this.confirmed.emit({ method, code: this.code() });
    }

    /**
     * Asks for a new code of the current method.
     * @param method - The method of the code.
     */
    protected requestNewCode(method: string): void {
        this.codeRequested.emit({ method, again: true });
    }

    private requestFirstCode(): void {
        const method: string | undefined = this.method();
        if (method != undefined && this.config.methods[method]?.sendsCode === true) {
            this.codeRequested.emit({ method, again: false });
        }
    }
}