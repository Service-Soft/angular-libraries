import { Component, viewChild, Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormComponent } from '@service-soft/ui/form';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { provideSpamProtectionConfig } from './spam-protection-config.provider';
import { SpamProtectionComponent } from './spam-protection.component';

@Component({
    selector: 'ui-spam-protection-host',
    template: `
        <ui-form (submit)="spam.isSpam() ? dropped = dropped + 1 : sent = sent + 1"><ui-spam-protection #spam /><button type="submit">Send</button></ui-form>
    `,
    imports: [FormComponent, SpamProtectionComponent]
})
class SpamProtectionHostComponent {
    readonly spam: Signal<SpamProtectionComponent> = viewChild.required(SpamProtectionComponent);

    sent: number = 0;

    dropped: number = 0;
}

async function render(): Promise<[ComponentFixture<SpamProtectionHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<SpamProtectionHostComponent> = TestBed.createComponent(SpamProtectionHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

async function submit(fixture: ComponentFixture<SpamProtectionHostComponent>, root: HTMLElement): Promise<void> {
    root.querySelector('button')?.click();
    await fixture.whenStable();
}

describe('SpamProtectionComponent', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    test('is a field hidden from people, screen readers, the keyboard and autofill, which bots fill in', async () => {
        const [fixture, root] = await render();
        const honeypot: HTMLInputElement | null = root.querySelector('input[name="website"]');

        expect(honeypot?.closest('[aria-hidden="true"]')?.classList).toContain('sr-only');
        expect(honeypot?.tabIndex).toBe(-1);
        expect(honeypot?.getAttribute('autocomplete')).toBe('off');
        expect(honeypot?.closest('[data-form-draft="off"]')).not.toBeNull();
        expect(root.querySelector(`label[for="${honeypot?.id}"]`)?.textContent.trim()).toBe('Leave this field empty');

        await submit(fixture, root);
        expect(fixture.componentInstance.sent).toBe(1);

        if (honeypot) {
            honeypot.value = 'https://spam.example.com';
        }
        await submit(fixture, root);
        expect(fixture.componentInstance.dropped).toBe(1);
    });

    test('looks like spam when the form is sent faster than a person could fill it in', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2026-11-16T09:00:00Z'));
        TestBed.configureTestingModule({ providers: [provideSpamProtectionConfig({ minimumFillTime: 3000 })] });
        const [fixture] = await render();

        vi.setSystemTime(new Date('2026-11-16T09:00:01Z'));
        expect(fixture.componentInstance.spam().isSpam()).toBe(true);
        vi.setSystemTime(new Date('2026-11-16T09:00:04Z'));
        expect(fixture.componentInstance.spam().isSpam()).toBe(false);
    });
});