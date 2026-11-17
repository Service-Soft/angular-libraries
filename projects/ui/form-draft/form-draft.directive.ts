import { afterNextRender, Directive, ElementRef, inject, input, InputSignal } from '@angular/core';
import { NativeInputElement } from '@service-soft/ui/input';

import { FormDraftValue } from './form-draft-value.type';

const STORAGE_PREFIX: string = 'ui-form-draft:';

// what isn't typed into a form, or must never be stored: passwords, files, and buttons.
const SKIPPED_TYPES: ReadonlySet<string> = new Set(['password', 'file', 'hidden', 'submit', 'button', 'reset', 'image']);

// a password that shows as text is still marked by its autocomplete, like 'current-password' or 'new-password'.
const PASSWORD_AUTOCOMPLETE: RegExp = /password/i;

/**
 * Keeps what the user typed into a form while they are away, like on another page of the site, and fills it in again
 * when they come back in the same tab: `<ui-form uiFormDraft="contact">`. It keeps the value of every field of the form
 * with a name in the sessionStorage under the given key, while the user types, and forgets it once the form is
 * submitted, which the browser only does when it is valid.
 * It works on the native fields, so every control of ui that is built on one with its value takes it back, and so do
 * plain inputs. Passwords, files and hidden fields are never kept, nor is anything inside an element with
 * data-form-draft="off". The draft is only read in the browser, after the first render.
 */
@Directive({
    selector: '[uiFormDraft]',
    host: {
        '(input)': 'save()',
        '(change)': 'save()',
        '(submit)': 'clear()'
    }
})
export class FormDraftDirective {
    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    // the events the draft dispatches while it fills in the fields would save every field again.
    private restoring: boolean = false;

    /**
     * The key the draft is kept under in the sessionStorage, one for each form, like 'contact'.
     */
    readonly uiFormDraft: InputSignal<string> = input.required<string>();

    private get storageKey(): string {
        return `${STORAGE_PREFIX}${this.uiFormDraft()}`;
    }

    constructor() {
        // once rendered, so the fields of the controls exist, and only in the browser, which has the storage.
        afterNextRender(() => this.restore());
    }

    /**
     * Keeps the values of the fields.
     */
    protected save(): void {
        if (this.restoring) {
            return;
        }
        const values: Record<string, FormDraftValue> = {};
        for (const field of this.findFields()) {
            if (field instanceof HTMLInputElement && field.type === 'radio') {
                if (field.checked) {
                    values[field.name] = field.value;
                }
                continue;
            }
            values[field.name] = this.getValue(field);
        }
        sessionStorage.setItem(this.storageKey, JSON.stringify(values));
    }

    /**
     * Forgets the draft, once the form was submitted.
     */
    protected clear(): void {
        sessionStorage.removeItem(this.storageKey);
    }

    private restore(): void {
        const values: Record<string, unknown> | undefined = this.findStoredValues();
        if (values == undefined) {
            return;
        }
        this.restoring = true;
        try {
            for (const field of this.findFields()) {
                if (field.name in values && this.restoreValue(field, values[field.name])) {
                    // the events the browser fires when the user changes a field, which the controls take their value from
                    field.dispatchEvent(new Event('input', { bubbles: true }));
                    field.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
        finally {
            this.restoring = false;
        }
    }

    private findFields(): NativeInputElement[] {
        return [...this.element.querySelectorAll<NativeInputElement>('input, textarea, select')].filter(field => field.name !== ''
            && !SKIPPED_TYPES.has(field.type)
            && !PASSWORD_AUTOCOMPLETE.test(field.autocomplete)
            && field.closest('[data-form-draft="off"]') == undefined);
    }

    private getValue(field: NativeInputElement): FormDraftValue {
        if (field instanceof HTMLInputElement && field.type === 'checkbox') {
            return field.checked;
        }
        return field instanceof HTMLSelectElement && field.multiple ? [...field.selectedOptions].map(option => option.value) : field.value;
    }

    /**
     * Fills in the kept value of a field, if it is one the field can have.
     * @param field - The field.
     * @param value - The kept value.
     * @returns Whether the field changed.
     */
    private restoreValue(field: NativeInputElement, value: unknown): boolean {
        if (field instanceof HTMLInputElement && (field.type === 'checkbox' || field.type === 'radio')) {
            const checked: boolean = field.type === 'checkbox' ? value === true : value === field.value;
            const changed: boolean = field.checked !== checked;
            field.checked = checked;
            // a radio button that is unchecked by another one of its group fires nothing
            return changed && (field.type === 'checkbox' || checked);
        }
        if (field instanceof HTMLSelectElement && field.multiple) {
            if (!Array.isArray(value)) {
                return false;
            }
            for (const option of field.options) {
                option.selected = value.includes(option.value);
            }
            return true;
        }
        if (typeof value !== 'string' || field.value === value) {
            return false;
        }
        field.value = value;
        return true;
    }

    // stored by something else under the same key, it is no draft.
    private findStoredValues(): Record<string, unknown> | undefined {
        const stored: string | null = sessionStorage.getItem(this.storageKey);
        if (stored == undefined) {
            return undefined;
        }
        try {
            const values: unknown = JSON.parse(stored);
            return this.isRecord(values) ? values : undefined;
        }
        catch {
            return undefined;
        }
    }

    private isRecord(value: unknown): value is Record<string, unknown> {
        return typeof value === 'object' && value != undefined && !Array.isArray(value);
    }
}