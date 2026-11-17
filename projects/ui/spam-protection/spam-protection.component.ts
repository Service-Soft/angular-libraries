import { afterNextRender, Component, ElementRef, inject, input, InputSignal, Signal, viewChild } from '@angular/core';

import { SpamProtectionConfig } from './spam-protection-config.model';
import { SPAM_PROTECTION_CONFIG } from './spam-protection-config.provider';

// one counter for every spam protection, so no two fields get the same id.
let nextId: number = 0;

/**
 * Tells submissions of a form by simple bots apart from the ones of people, so the app can drop them: a field that is
 * hidden from people, which bots that fill in every field fill in too, and optionally a minimum time it takes a person
 * to fill in the form. Put it inside of the form, and ask isSpam() on submit:
 * `<ui-spam-protection #spam />` and `(submit)="spam.isSpam() || send()"`.
 * It only keeps out bots that don't render the page like a browser. Check submissions on the server as well.
 * Unset inputs fall back to the values provided with provideSpamProtectionConfig.
 */
@Component({
    selector: 'ui-spam-protection',
    templateUrl: './spam-protection.component.html',
    host: {
        // the hidden field takes no space, also not as an item of a flex row, like the one of an inline form
        class: 'contents'
    }
})
export class SpamProtectionComponent {
    private readonly config: SpamProtectionConfig = inject(SPAM_PROTECTION_CONFIG);

    private readonly honeypot: Signal<ElementRef<HTMLInputElement>> = viewChild.required<ElementRef<HTMLInputElement>>('honeypot');

    // when the form could first be filled in, in the browser.
    private shownAt: number | undefined;

    /**
     * The name of the hidden field, one a bot expects in a form, like 'website'. Change it when the form has a real
     * field of that name.
     */
    readonly name: InputSignal<string> = input<string>(this.config.name);

    /**
     * How many milliseconds a person needs at least to fill in the form, like 3000. A submission that is faster looks
     * like spam. 0 checks no time.
     */
    readonly minimumFillTime: InputSignal<number> = input<number>(this.config.minimumFillTime);

    /**
     * The label of the hidden field.
     */
    protected readonly label: string = this.config.label;

    /**
     * The id of the hidden field, which its label points to.
     */
    protected readonly inputId: string = `ui-spam-protection-${nextId++}`;

    constructor() {
        afterNextRender(() => this.shownAt = Date.now());
    }

    /**
     * Whether the submission looks like spam: the hidden field is filled in, or the form was sent faster than the
     * minimum fill time. Ask it when the form is submitted.
     * @returns Whether to drop the submission.
     */
    isSpam(): boolean {
        if (this.honeypot().nativeElement.value !== '') {
            return true;
        }
        const minimumFillTime: number = this.minimumFillTime();
        return minimumFillTime > 0 && (this.shownAt == undefined || Date.now() - this.shownAt < minimumFillTime);
    }
}