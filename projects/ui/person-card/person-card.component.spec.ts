import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LinkUtilities } from '@service-soft/ui/link';
import { describe, expect, test } from 'vitest';

import { PersonCardActionsComponent } from './person-card-actions.component';
import { providePersonCardConfig } from './person-card-config.provider';
import { PersonCardLayout } from './person-card-layout.type';
import { PersonCardComponent } from './person-card.component';

@Component({
    selector: 'ui-person-card-host',
    templateUrl: './person-card.component.spec.html',
    imports: [PersonCardComponent, PersonCardActionsComponent]
})
class PersonCardHostComponent {
    readonly whatsAppHref: string = LinkUtilities.resolveWhatsAppHref('+49 171 1234567');

    readonly photo: WritableSignal<string | undefined> = signal(undefined);

    readonly layout: WritableSignal<PersonCardLayout> = signal('portrait');
}

async function render(): Promise<[ComponentFixture<PersonCardHostComponent>, HTMLElement[]]> {
    const fixture: ComponentFixture<PersonCardHostComponent> = TestBed.createComponent(PersonCardHostComponent);
    await fixture.whenStable();
    return [fixture, [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('ui-person-card')]];
}

function getLinks(card: HTMLElement | undefined): [string | null, string][] {
    return [...card?.querySelectorAll('a') ?? []].map(link => [link.getAttribute('href'), link.textContent.replaceAll(/\s+/g, ' ').trim()]);
}

describe('PersonCardComponent', () => {
    test('shows the name as a heading with the position, the description, buttons that call and write the person and the actions of the app', async () => {
        const [, [card, minimal]] = await render();
        // the position is no aria role of the card
        expect(card?.hasAttribute('role')).toBe(false);

        expect(card?.querySelector('h3')?.textContent.trim()).toBe('Ada Lovelace');
        expect(card?.querySelector('ui-heading + p')?.textContent.trim()).toBe('Head coach');
        expect(card?.textContent).toContain('Trains the youth teams since 2019.');
        expect(getLinks(card)).toEqual([
            ['tel:+491711234567', '+49 (0) 171 1234567'],
            ['mailto:ada@example.com', 'ada@example.com'],
            ['https://wa.me/491711234567', 'WhatsApp']
        ]);
        // without anything to show, the rows of the description and the buttons take no space
        expect(minimal?.querySelectorAll('.empty\\:hidden')).toHaveLength(2);
        expect(minimal?.querySelector('a')).toBeNull();
    });

    test('shows the initials without a photo, the photo once there is one, and the initials again when it fails', async () => {
        const [fixture, [card]] = await render();
        // decorative, the heading names the person
        expect(card?.querySelector('ui-avatar > span')?.getAttribute('aria-hidden')).toBe('true');
        expect(card?.querySelector('ui-avatar')?.textContent.trim()).toBe('AL');

        fixture.componentInstance.photo.set('/team/ada.jpg');
        await fixture.whenStable();
        const photo: HTMLImageElement | null | undefined = card?.querySelector('img');
        expect(photo?.getAttribute('src')).toBe('/team/ada.jpg');
        expect(photo?.getAttribute('alt')).toBe('');
        expect(photo?.getAttribute('loading')).toBe('lazy');
        expect(card?.querySelector('ui-avatar')).toBeNull();

        photo?.dispatchEvent(new Event('error'));
        await fixture.whenStable();
        expect(card?.querySelector('img')).toBeNull();
        expect(card?.querySelector('ui-avatar')).not.toBeNull();

        // NgOptimizedImage refuses inline images, which show as they are
        fixture.componentInstance.photo.set('data:image/png;base64,AAAA');
        await fixture.whenStable();
        expect(card?.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,AAAA');
    });

    test('lays out a compact contact card and takes the heading level the app provides', async () => {
        TestBed.configureTestingModule({ providers: [providePersonCardConfig({ headingLevel: 2 })] });
        const [fixture, [card]] = await render();
        fixture.componentInstance.layout.set('contact');
        await fixture.whenStable();

        expect(card?.querySelector('h2')?.textContent.trim()).toBe('Ada Lovelace');
        expect(card?.querySelector('.aspect-4\\/5')?.classList).toContain('w-20');
    });
});