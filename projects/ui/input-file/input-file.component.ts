import { afterNextRender, booleanAttribute, Component, computed, DestroyRef, effect, ElementRef, inject, Injector, input, InputSignal, InputSignalWithTransform, LOCALE_ID, model, ModelSignal, Signal, viewChild } from '@angular/core';
import { faUpload, faXmark } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { BaseInputDirective, InputFieldComponent, InputSize, InputValidityError } from '@service-soft/ui/input';

import { InputFileEntryComponent } from './input-file-entry.component';
import { InputFileSummaryComponent } from './input-file-summary.component';
import { InputFileValue } from './input-file-value.type';
import { InputFileView } from './input-file-view.model';
import { InputFileUtilities } from './input-file.utilities';

// the entry of a file that can't be uploaded is marked by its border and says why below its name, so color is never
// the only cue.
const FILE_CLASSES: Record<'valid' | 'invalid', string> = {
    valid: 'flex items-center gap-3 rounded-input border border-outline-variant p-2',
    invalid: 'flex items-center gap-3 rounded-input border border-error p-2'
};

// the box of the only file, as high as an input of the same size, so a chosen file doesn't move the rows of a form. The
// end leaves room for the button that removes it.
const SINGLE_FILE_CLASSES: string = 'flex w-full items-center gap-2 rounded-input border text-body';

const SINGLE_FILE_SIZE_CLASSES: Record<InputSize, string> = {
    sm: 'min-h-8 ps-2.5 pe-1',
    md: 'min-h-10 ps-3 pe-2',
    lg: 'min-h-12 ps-4 pe-3'
};

// invalid only colors the border, the message below says what is wrong, so color is never the only cue.
const SINGLE_FILE_STATE_CLASSES: Record<'editable' | 'invalid' | 'readonly' | 'disabled', string> = {
    editable: 'border-outline bg-surface',
    invalid: 'border-error bg-surface',
    readonly: 'border-outline bg-surface-container',
    disabled: 'border-outline bg-surface opacity-50'
};

// as large as the smallest target allowed, which fits into the box of every size.
const REMOVE_BUTTON_CLASSES: string = `
    ms-auto inline-flex min-h-6 min-w-6 shrink-0 cursor-pointer items-center justify-center rounded-button text-on-surface-variant
    hover:text-on-surface
    focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary
`;

/**
 * An input for files, like an attachment or a picture, with its label, a button that chooses them, the list of the
 * files with a preview of every image, and a hint and validation error. It takes files the backend stored already as
 * well, which the user can remove like the ones they chose.
 * Bind its value two-way with [(value)]: the File objects the user chose, to upload, and the files that were there.
 * It checks required, the size and the type of the files itself, so a form only submits when they are valid.
 * Unset inputs fall back to the values provided with provideInputConfig.
 */
@Component({
    selector: 'ui-input-file',
    templateUrl: './input-file.component.html',
    imports: [ButtonComponent, IconComponent, InputFieldComponent, InputFileEntryComponent, InputFileSummaryComponent],
    host: {
        class: 'flex flex-col'
    }
})
export class InputFileComponent extends BaseInputDirective<InputFileValue[]> {
    private readonly locale: string = inject(LOCALE_ID);

    // created once per image while it is listed, and revoked once it isn't, so no file stays in memory for nothing.
    private readonly previewUrls: Map<File, string> = new Map();

    /**
     * The files: File objects the user chose, and files the backend stored already.
     */
    readonly value: ModelSignal<InputFileValue[]> = model<InputFileValue[]>([]);

    /**
     * Whether it takes several files. Then choosing adds to the files, otherwise it replaces them.
     */
    readonly multiple: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The types of files it takes, like the native accept: mime types like 'application/pdf', groups like 'image/*'
     * or extensions like '.pdf', separated by commas.
     */
    readonly accept: InputSignal<string | undefined> = input<string>();

    /**
     * The largest size of a chosen file, in bytes.
     */
    readonly maxSize: InputSignal<number | undefined> = input<number>();

    /**
     * The text of the button that chooses files.
     */
    protected readonly chooseLabel: Signal<string> = computed(() => {
        return this.multiple() ? this.config.chooseFilesLabel : this.config.chooseFileLabel;
    });

    /**
     * The name of the buttons that remove a file, read together with its name.
     */
    protected readonly removeLabel: string = this.config.removeLabel;

    /**
     * The files as the list shows them, each with its own error, so the user sees which of many files to remove.
     */
    protected readonly files: Signal<InputFileView[]> = computed(() => this.value().map((file, index) => {
        const nameId: string = `${this.inputId()}-file-${index}`;
        const errorId: string = `${nameId}-error`;
        const error: string | undefined = this.showValidationError() ? this.resolveFileError(file) : undefined;
        return {
            file,
            name: file.name,
            size: file.size == undefined ? undefined : InputFileUtilities.getReadableSize(file.size, this.locale),
            previewUrl: this.resolvePreviewUrl(file),
            error,
            classes: FILE_CLASSES[error == undefined ? 'valid' : 'invalid'],
            nameId,
            errorId,
            describedBy: error == undefined ? nameId : `${nameId} ${errorId}`
        };
    }));

    /**
     * Whether files can be chosen and removed.
     */
    protected readonly isEditable: Signal<boolean> = computed(() => !this.disabled() && !this.readonly());

    /**
     * The file while it takes only one and has it, which shows in a box as high as an input instead of the button and
     * the list.
     */
    protected readonly singleFile: Signal<InputFileView | undefined> = computed(() => {
        const files: InputFileView[] = this.files();
        return !this.multiple() && files.length === 1 ? files[0] : undefined;
    });

    /**
     * The tailwind classes of the box of the only file.
     */
    protected readonly singleFileClasses: Signal<string> = computed(() => {
        const state: keyof typeof SINGLE_FILE_STATE_CLASSES = this.disabled()
            ? 'disabled'
            : this.readonly() ? 'readonly' : this.errorMessage() ? 'invalid' : 'editable';
        return [SINGLE_FILE_CLASSES, SINGLE_FILE_SIZE_CLASSES[this.size()], SINGLE_FILE_STATE_CLASSES[state]].join(' ');
    });

    /**
     * The tailwind classes of the button that removes the only file.
     */
    protected readonly removeButtonClasses: string = REMOVE_BUTTON_CLASSES;

    /**
     * The icon of the button that chooses files.
     */
    protected readonly chooseIcon: IconDefinition = faUpload;

    /**
     * The icon of the button that removes the only file.
     */
    protected readonly removeIcon: IconDefinition = faXmark;

    /**
     * The button that chooses a file, or the one that removes the only file, whichever shows.
     */
    // read as the element, since the one that chooses a file is a ui-button component
    private readonly control: Signal<ElementRef<HTMLButtonElement> | undefined> = viewChild('control', {
        read: ElementRef<HTMLButtonElement>
    });

    private readonly injector: Injector = inject(Injector);

    // the native input never holds the files the backend stored, so it checks nothing itself: required and the rules
    // of the files are the custom error.
    /**
     * The errors of the native ValidityState a file input checks: none.
     */
    protected readonly validityErrors: readonly InputValidityError[] = [];

    constructor() {
        super();
        effect(() => {
            const listed: Set<InputFileValue> = new Set(this.value());
            for (const [file, url] of this.previewUrls) {
                if (!listed.has(file)) {
                    URL.revokeObjectURL(url);
                    this.previewUrls.delete(file);
                }
            }
        });
        inject(DestroyRef).onDestroy(() => {
            for (const url of this.previewUrls.values()) {
                URL.revokeObjectURL(url);
            }
        });
    }

    /**
     * Resolves whether the files are missing or one of them can't be uploaded, then the custom validation.
     * @returns The message, or undefined when the files meet the rules.
     */
    protected override resolveCustomError(): string | undefined {
        const files: InputFileValue[] = this.value();
        if (this.required() && !files.length) {
            return this.config.errorMessages.valueMissing;
        }
        // the box of the only file has no room for its error, so it is the error of the input. In the list, which
        // files and why each of them says itself.
        const fileError: string | undefined = files.map(file => this.resolveFileError(file)).find(error => error != undefined);
        if (fileError != undefined) {
            return this.singleFile() == undefined ? this.config.errorMessages.invalidFiles : fileError;
        }
        return super.resolveCustomError();
    }

    /**
     * Takes the files the user chose: in addition to the others when it takes several, in their place otherwise.
     * @param nativeInput - The native file input.
     */
    protected addFiles(nativeInput: HTMLInputElement): void {
        const chosen: File[] = [...nativeInput.files ?? []];
        // emptied, so choosing the same file again still changes it
        nativeInput.value = '';
        if (!chosen.length) {
            return;
        }
        this.value.set(this.multiple() ? [...this.value(), ...chosen] : chosen.slice(0, 1));
        // the user acted on it, so a file that is too large says so right away
        this.showValidationError.set(true);
        this.focusControl();
    }

    /**
     * Removes a file.
     * @param index - The index of the file.
     */
    protected removeFile(index: number): void {
        this.value.update(files => files.filter((_, i) => i !== index));
        this.showValidationError.set(true);
        this.focusControl();
    }

    // the button that chooses a file and the one that removes the only file take each other's place, so the focus moves
    // on to the one that shows.
    private focusControl(): void {
        if (this.multiple()) {
            return;
        }
        afterNextRender(() => this.control()?.nativeElement.focus(), { injector: this.injector });
    }

    // only for a chosen file: the backend stored the others under its own rules.
    private resolveFileError(file: InputFileValue): string | undefined {
        if (!(file instanceof File)) {
            return undefined;
        }
        const maxSize: number | undefined = this.maxSize();
        if (maxSize != undefined && file.size > maxSize) {
            return this.config.errorMessages.fileTooLarge;
        }
        return InputFileUtilities.isAccepted(file, this.accept()) ? undefined : this.config.errorMessages.fileTypeMismatch;
    }

    // the cache makes the computed list stay pure for every read but the first of a new image.
    private resolvePreviewUrl(file: InputFileValue): string | undefined {
        if (!InputFileUtilities.isImage(file)) {
            return undefined;
        }
        return file instanceof File ? this.previewUrls.get(file) ?? this.createPreviewUrl(file) : file.url;
    }

    private createPreviewUrl(file: File): string {
        const url: string = URL.createObjectURL(file);
        this.previewUrls.set(file, url);
        return url;
    }
}