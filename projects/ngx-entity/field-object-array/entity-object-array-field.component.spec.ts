// the DialogService renders the dialogs into the body, so the tests find them there.
import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntityClass, EntityUtilities, Property } from '@service-soft/ngx-entity/entity';
import { EntityFormComponent } from '@service-soft/ngx-entity/form';
import { FormComponent } from '@service-soft/ui/form';
import { DialogTestingUtilities } from 'testing/dialog';
import { FormTestingUtilities } from 'testing/form';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

class Position {
    @Property.string({ displayName: 'Title' })
    title!: string;

    @Property.number({ displayName: 'Amount', default: 1 })
    amount!: number;
}

class Invoice {
    @Property.array({ displayName: 'Positions', required: true, items: { type: 'object', cls: () => Position } })
    positions!: Position[];
}

@Component({
    selector: 'ngx-host',
    template: `
        <ui-form (submit)="submits.set(submits() + 1)">
            <ngx-entity-form [entity]="entity" [(value)]="value" /><button type="submit">Save</button>
        </ui-form>
    `,
    imports: [FormComponent, EntityFormComponent]
})
class HostComponent {
    readonly entity: EntityClass<Invoice> = Invoice;
    readonly value: WritableSignal<Partial<Invoice>> = signal(EntityUtilities.resolveDefaults(Invoice));
    readonly submits: WritableSignal<number> = signal(0);
}

async function render(): Promise<[ComponentFixture<HostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<HostComponent> = TestBed.createComponent(HostComponent);
    // the fields load their components first.
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

function findButton(root: ParentNode, name: string): HTMLButtonElement {
    const button: HTMLButtonElement | undefined = [...root.querySelectorAll('button')]
        .find(candidate => (candidate.getAttribute('aria-label') ?? candidate.textContent.trim()) === name);
    if (button == undefined) {
        throw new Error(`No button named "${name}".`);
    }
    return button;
}

// the dialog loads the fields of its form first.
async function findDialogInput(fixture: ComponentFixture<HostComponent>, label: string): Promise<HTMLInputElement> {
    return await vi.waitFor(async () => {
        await fixture.whenStable();
        const dialog: HTMLDialogElement | undefined = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1);
        const input: HTMLInputElement | undefined = dialog == undefined ? undefined : FormTestingUtilities.findLabelledInput(dialog, label);
        if (input == undefined) {
            throw new Error(`No input labelled "${label}" in a dialog.`);
        }
        return input;
    });
}

async function type(fixture: ComponentFixture<HostComponent>, input: HTMLInputElement, text: string): Promise<void> {
    input.value = text;
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
}

async function save(fixture: ComponentFixture<HostComponent>): Promise<void> {
    document.querySelector<HTMLFormElement>('dialog[open] form')?.requestSubmit();
    // the dialog closes, then the field takes the item.
    await fixture.whenStable();
    await new Promise(resolve => setTimeout(resolve));
    await fixture.whenStable();
}

describe('EntityObjectArrayFieldComponent', () => {
    let removeModalDialogs: () => void;

    beforeEach(() => {
        removeModalDialogs = DialogTestingUtilities.addModalDialogs();
    });

    afterEach(() => {
        removeModalDialogs();
        document.querySelectorAll('dialog').forEach(dialog => dialog.remove());
    });

    test('adds an item in a dialog with the fields and defaults of its class, and edits it in place', async () => {
        const [fixture, root] = await render();

        findButton(root, 'Add').click();
        expect(document.querySelector('dialog[open] h2')?.textContent?.trim()).toBe('Add to Positions');
        await type(fixture, await findDialogInput(fixture, 'Title'), 'Design');
        expect((await findDialogInput(fixture, 'Amount')).value).toBe('1');
        await save(fixture);
        expect(fixture.componentInstance.value().positions).toEqual([{ title: 'Design', amount: 1 }]);
        expect(root.querySelector('tbody')?.textContent).toContain('Design');

        findButton(root, 'Edit Design').click();
        const title: HTMLInputElement = await findDialogInput(fixture, 'Title');
        expect(title.value).toBe('Design');
        await type(fixture, title, 'Design and build');
        await save(fixture);
        expect(fixture.componentInstance.value().positions).toEqual([{ title: 'Design and build', amount: 1 }]);

        findButton(root, 'Remove Design and build').click();
        await fixture.whenStable();
        expect(fixture.componentInstance.value().positions).toEqual([]);
    });

    test('takes nothing when the dialog is cancelled', async () => {
        const [fixture, root] = await render();

        findButton(root, 'Add').click();
        await type(fixture, await findDialogInput(fixture, 'Title'), 'Design');
        findButton(document, 'Cancel').click();
        await fixture.whenStable();
        await new Promise(resolve => setTimeout(resolve));
        expect(fixture.componentInstance.value().positions).toEqual([]);
    });

    test('doesn\'t submit while a required array has no item, and says so at the button that adds one', async () => {
        const [fixture, root] = await render();

        root.querySelector('form')?.requestSubmit();
        await fixture.whenStable();
        const add: HTMLButtonElement = findButton(root, 'Add');
        expect(fixture.componentInstance.submits()).toBe(0);
        expect(document.getElementById(add.getAttribute('aria-describedby') ?? '')?.textContent?.trim()).toBe('This field is required.');
        expect(document.activeElement).toBe(add);
    });

    test('shows its label marked as required next to the button that adds an item, and frames the table in red once it is invalid', async () => {
        const [fixture, root] = await render();
        const table: HTMLElement | null = root.querySelector('ui-table');
        const labelId: string | null | undefined = table?.querySelector('table')?.getAttribute('aria-labelledby');
        const label: HTMLElement | null = root.querySelector(`[id="${labelId}"]`);

        expect(label?.firstChild?.textContent?.trim()).toBe('Positions');
        expect(label?.querySelector('[aria-hidden="true"]')?.textContent).toBe('*');
        expect(findButton(root, 'Add').closest('ui-table-actions')?.parentElement).toBe(label?.parentElement);
        expect(table?.classList.contains('border-error')).toBe(false);

        root.querySelector('form')?.requestSubmit();
        await fixture.whenStable();
        expect(table?.classList.contains('border-error')).toBe(true);
    });
});