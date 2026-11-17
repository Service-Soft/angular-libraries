import { DOCUMENT } from '@angular/common';
import { ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, inject, Injector, Service, Type } from '@angular/core';

import { DIALOG_DATA } from './dialog-data.provider';
import { DialogOptions } from './dialog-options.model';
import { DialogRef } from './dialog-ref.model';
import { DialogComponent } from './dialog.component';

/**
 * Opens components as modal dialogs from code, inside a `<ui-dialog>`.
 */
@Service()
export class DialogService {
    private readonly document: Document = inject(DOCUMENT);
    private readonly applicationRef: ApplicationRef = inject(ApplicationRef);
    private readonly environmentInjector: EnvironmentInjector = inject(EnvironmentInjector);
    private readonly injector: Injector = inject(Injector);

    /**
     * Opens a component as a modal dialog. The component injects DialogRef to close it with a result, and DIALOG_DATA
     * for the data. The dialog is labelled by the first heading of the component.
     * Import the component with a dynamic import() right before opening it, so its code is only loaded when it is used.
     * @param component - The component to show inside the dialog.
     * @param data - What the component gets as DIALOG_DATA.
     * @param options - How the dialog behaves, like whether escape closes it.
     * @returns The dialog, whose closed promise resolves with the result.
     */
    open<Result = unknown>(component: Type<unknown>, data?: unknown, options: DialogOptions = {}): DialogRef<Result> {
        // the element of the content exists before the dialog, which projects it, and the dialog exists before the
        // content, whose DialogRef needs it.
        const contentElement: HTMLElement = this.document.createElement('div');
        const dialog: ComponentRef<DialogComponent> = createComponent(DialogComponent, {
            environmentInjector: this.environmentInjector,
            projectableNodes: [[contentElement]]
        });
        dialog.setInput('closeOnEscape', options.closeOnEscape ?? true);
        dialog.setInput('size', options.size ?? 'md');
        const dialogRef: DialogRef<Result> = new DialogRef<Result>(dialog.instance);
        const content: ComponentRef<unknown> = createComponent(component, {
            environmentInjector: this.environmentInjector,
            hostElement: contentElement,
            elementInjector: Injector.create({
                providers: [{ provide: DialogRef, useValue: dialogRef }, { provide: DIALOG_DATA, useValue: data }],
                parent: this.injector
            })
        });
        this.applicationRef.attachView(dialog.hostView);
        this.applicationRef.attachView(content.hostView);
        this.document.body.append(dialog.location.nativeElement as Node);
        // rendered before it opens, so the browser finds what to focus and the dialog its heading.
        dialog.changeDetectorRef.detectChanges();
        content.changeDetectorRef.detectChanges();
        dialog.instance.open();

        void this.removeWhenClosed(dialogRef, [content, dialog]);
        return dialogRef;
    }

    private async removeWhenClosed(dialogRef: DialogRef<unknown>, components: ComponentRef<unknown>[]): Promise<void> {
        await dialogRef.closed;
        for (const component of components) {
            // destroying detaches the view from the application as well, but leaves the element on the page.
            component.destroy();
            (component.location.nativeElement as Element).remove();
        }
    }
}