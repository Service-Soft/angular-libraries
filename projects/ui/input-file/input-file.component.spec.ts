import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideInputConfig } from '@service-soft/ui/input';
import { describe, expect, test } from 'vitest';

import { InputExistingFile } from './input-existing-file.model';
import { InputFileValue } from './input-file-value.type';
import { InputFileComponent } from './input-file.component';
import { InputFileUtilities } from './input-file.utilities';

const CONTRACT: InputExistingFile = { name: 'contract.pdf', url: '/files/1', mimeType: 'application/pdf', size: 1_500_000 };

@Component({
    selector: 'ui-single-host',
    template: '<ui-input-file label="Invoice" hint="A PDF" accept=".pdf" [maxSize]="1000" [(value)]="files" />',
    imports: [InputFileComponent]
})
class SingleHostComponent {
    readonly files: WritableSignal<InputFileValue[]> = signal([]);
}

@Component({
    selector: 'ui-multiple-host',
    template: '<ui-input-file label="Attachments" multiple [required]="false" [(value)]="files" />',
    imports: [InputFileComponent]
})
class MultipleHostComponent {
    readonly files: WritableSignal<InputFileValue[]> = signal([CONTRACT]);
}

@Component({
    selector: 'ui-limited-host',
    template: '<ui-input-file label="Attachments" multiple accept=".pdf" [maxSize]="1000" [(value)]="files" />',
    imports: [InputFileComponent]
})
class LimitedHostComponent {
    readonly files: WritableSignal<InputFileValue[]> = signal([]);
}

@Component({
    selector: 'ui-read-only-host',
    template: '<ui-input-file label="Attachments" readonly [value]="files" />',
    imports: [InputFileComponent]
})
class ReadOnlyHostComponent {
    readonly files: InputFileValue[] = [CONTRACT];
}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function getNativeInput(root: HTMLElement): HTMLInputElement {
    const input: HTMLInputElement | undefined = root.querySelector<HTMLInputElement>('input[type="file"]') ?? undefined;
    if (input == undefined) {
        throw new Error('The file input did not render.');
    }
    return input;
}

function getChooseButton(root: HTMLElement): HTMLButtonElement {
    const button: HTMLButtonElement | undefined = root.querySelector('button') ?? undefined;
    if (button == undefined) {
        throw new Error('The button did not render.');
    }
    return button;
}

// what the native picker does once the user picked files: the files are the input's, and it says so with change.
async function choose(fixture: ComponentFixture<unknown>, root: HTMLElement, files: File[]): Promise<void> {
    const input: HTMLInputElement = getNativeInput(root);
    Object.defineProperty(input, 'files', { value: files, configurable: true });
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
}

function findNames(root: HTMLElement): string[] {
    return [...root.querySelectorAll('li p:first-child')].map(name => name.textContent?.trim() ?? '');
}

// the name of the file in the box that shows the only file in place of the list
function findSingleName(root: HTMLElement): string | undefined {
    return root.querySelector('span[id$="-file-0"]')?.textContent?.trim();
}

function getRemoveButton(root: HTMLElement): HTMLButtonElement {
    const button: HTMLButtonElement | undefined = root.querySelector<HTMLButtonElement>('button[aria-label="Remove"]') ?? undefined;
    if (button == undefined) {
        throw new Error('The button that removes the file did not render.');
    }
    return button;
}

function findDescription(root: HTMLElement, element: HTMLElement): string | undefined {
    const ids: string[] = element.getAttribute('aria-describedby')?.split(' ') ?? [];
    return ids.map(id => root.querySelector(`#${id}`)?.textContent?.trim()).join(' ') || undefined;
}

describe('InputFileComponent', () => {
    test('opens the native picker with its own button, labelled and described by the hint', async () => {
        const [, root] = await render(SingleHostComponent);
        const button: HTMLButtonElement = getChooseButton(root);
        const input: HTMLInputElement = getNativeInput(root);
        let opened: boolean = false;
        input.addEventListener('click', () => opened = true);

        expect(button.textContent?.trim()).toBe('Choose a file');
        expect(root.querySelector('label')?.getAttribute('for')).toBe(button.id);
        expect(findDescription(root, button)).toBe('A PDF');
        expect(input.accept).toBe('.pdf');
        expect(input.multiple).toBe(false);

        button.click();
        expect(opened).toBe(true);
    });

    test('takes the chosen file in place of the one before, and empties the native input for the next choice', async () => {
        const [fixture, root] = await render(SingleHostComponent);
        const first: File = new File(['a'], 'first.pdf', { type: 'application/pdf' });
        const second: File = new File(['b'], 'second.pdf', { type: 'application/pdf' });

        await choose(fixture, root, [first]);
        expect(fixture.componentInstance.files()).toEqual([first]);
        expect(getNativeInput(root).value).toBe('');

        await choose(fixture, root, [second]);
        expect(fixture.componentInstance.files()).toEqual([second]);
        expect(findSingleName(root)).toBe('second.pdf');
    });

    test('shows its only file in place of the button, whose own button removes it, and moves the focus between both', async () => {
        const [fixture, root] = await render(SingleHostComponent);
        const label: HTMLLabelElement | null = root.querySelector('label');

        await choose(fixture, root, [new File(['a'], 'invoice.pdf', { type: 'application/pdf' })]);
        expect(root.querySelector('li')).toBeNull();
        expect(root.querySelectorAll('button')).toHaveLength(1);
        const remove: HTMLButtonElement = getRemoveButton(root);
        // the label focuses the button that removes it, which is described by the name of the file and the hint
        expect(label?.getAttribute('for')).toBe(remove.id);
        expect(findDescription(root, remove)).toBe('invoice.pdf A PDF');
        expect(document.activeElement).toBe(remove);

        remove.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.files()).toEqual([]);
        expect(getChooseButton(root).textContent?.trim()).toBe('Choose a file');
        expect(label?.getAttribute('for')).toBe(getChooseButton(root).id);
        expect(document.activeElement).toBe(getChooseButton(root));
    });

    test('adds chosen files to the stored ones when it takes several, and removes any of them', async () => {
        const [fixture, root] = await render(MultipleHostComponent);
        const photo: File = new File(['x'], 'notes.txt', { type: 'text/plain' });
        expect(getChooseButton(root).textContent?.trim()).toBe('Choose files');
        expect(findNames(root)).toEqual(['contract.pdf']);
        expect(root.querySelector('li')?.textContent).toContain('1.5 MB');

        await choose(fixture, root, [photo]);
        expect(fixture.componentInstance.files()).toEqual([CONTRACT, photo]);

        const remove: HTMLButtonElement | undefined = root.querySelectorAll<HTMLButtonElement>('li button')[0];
        expect(remove?.getAttribute('aria-label')).toBe('Remove');
        expect(remove == undefined ? undefined : findDescription(root, remove)).toBe('contract.pdf');
        remove?.click();
        await fixture.whenStable();
        expect(fixture.componentInstance.files()).toEqual([photo]);
    });

    test('is required by default, and refuses a file too large or of a type it doesn\'t take', async () => {
        TestBed.configureTestingModule({ providers: [provideInputConfig({ errorMessages: { fileTooLarge: 'Zu groß.' } })] });
        const [fixture, root] = await render(SingleHostComponent);
        const input: HTMLInputElement = getNativeInput(root);
        expect(input.checkValidity()).toBe(false);

        // the only file has no room for an error of its own, so its error is the one of the input
        await choose(fixture, root, [new File(['x'.repeat(2000)], 'large.pdf', { type: 'application/pdf' })]);
        expect(findDescription(root, getRemoveButton(root))).toBe('large.pdf Zu groß.');
        expect(getRemoveButton(root).getAttribute('aria-invalid')).toBe('true');
        expect(root.querySelector('ui-input-file div.border-error')).not.toBeNull();

        await choose(fixture, root, [new File(['x'], 'photo.png', { type: 'image/png' })]);
        expect(findDescription(root, getRemoveButton(root))).toBe('photo.png This file is of a type that isn\'t accepted.');

        await choose(fixture, root, [new File(['x'], 'invoice.pdf', { type: 'application/pdf' })]);
        expect(input.checkValidity()).toBe(true);
        expect(getRemoveButton(root).hasAttribute('aria-invalid')).toBe(false);
        expect(findDescription(root, getRemoveButton(root))).toBe('invoice.pdf A PDF');
    });

    test('marks exactly the files that can\'t be uploaded, and is valid again once they are removed', async () => {
        const [fixture, root] = await render(LimitedHostComponent);
        await choose(fixture, root, [
            new File(['x'], 'first.pdf', { type: 'application/pdf' }),
            new File(['x'.repeat(2000)], 'scan.pdf', { type: 'application/pdf' }),
            new File(['x'], 'notes.txt', { type: 'text/plain' }),
            new File(['x'], 'last.pdf', { type: 'application/pdf' })
        ]);
        const entries: HTMLElement[] = [...root.querySelectorAll('li')];

        expect(entries.map(entry => entry.querySelector('.text-error')?.textContent?.trim())).toEqual([
            undefined,
            'This file is too large.',
            'This file is of a type that isn\'t accepted.',
            undefined
        ]);
        expect(entries.map(entry => entry.classList.contains('border-error'))).toEqual([false, true, true, false]);
        // the button that removes a marked file says why it is marked as well
        const removeScan: HTMLButtonElement | undefined = entries[1]?.querySelector('button') ?? undefined;
        expect(removeScan == undefined ? undefined : findDescription(root, removeScan)).toBe('scan.pdf This file is too large.');

        removeScan?.click();
        await fixture.whenStable();
        root.querySelectorAll<HTMLButtonElement>('li button')[1]?.click();
        await fixture.whenStable();
        expect(findNames(root)).toEqual(['first.pdf', 'last.pdf']);
        expect(getNativeInput(root).checkValidity()).toBe(true);
    });

    test('lists its files but can\'t change them while read only', async () => {
        const [, root] = await render(ReadOnlyHostComponent);

        expect(findSingleName(root)).toBe('contract.pdf');
        expect(root.querySelectorAll('button')).toHaveLength(0);
    });
});

describe('InputFileUtilities', () => {
    test('accepts a file by its mime type, its group or its extension', () => {
        const photo: File = new File(['x'], 'Photo.JPG', { type: 'image/jpeg' });

        expect(InputFileUtilities.isAccepted(photo, undefined)).toBe(true);
        expect(InputFileUtilities.isAccepted(photo, 'image/*')).toBe(true);
        expect(InputFileUtilities.isAccepted(photo, '.pdf, .jpg')).toBe(true);
        expect(InputFileUtilities.isAccepted(photo, 'image/jpeg')).toBe(true);
        expect(InputFileUtilities.isAccepted(photo, 'application/pdf,.png')).toBe(false);
    });

    test('writes a size in the largest unit it has one of', () => {
        expect(InputFileUtilities.getReadableSize(512, 'en-US')).toBe('512 byte');
        expect(InputFileUtilities.getReadableSize(1_500_000, 'en-US')).toBe('1.5 MB');
        expect(InputFileUtilities.getReadableSize(1_500_000, 'de-DE')).toBe('1,5 MB');
    });
});