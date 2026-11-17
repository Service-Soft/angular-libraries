import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input, InputSignal, linkedSignal, Signal, WritableSignal } from '@angular/core';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';
import { AvatarComponent, AvatarSize } from '@service-soft/ui/avatar';
import { ButtonComponent } from '@service-soft/ui/button';
import { CardComponent } from '@service-soft/ui/card';
import { HeadingComponent, HeadingLevel } from '@service-soft/ui/heading';
import { IconComponent } from '@service-soft/ui/icon';
import { LinkUtilities } from '@service-soft/ui/link';

import { PersonCardConfig } from './person-card-config.model';
import { PERSON_CARD_CONFIG } from './person-card-config.provider';
import { PersonCardContact } from './person-card-contact.model';
import { PersonCardLayout } from './person-card-layout.type';

// portrait: the photo over the full width above the text, and the card as high as its row, so cards next to each other
// in a grid are equally high. contact: a small photo next to the text, which wraps below it where the card is too narrow.
const LAYOUT_CLASSES: Record<PersonCardLayout, string> = {
    portrait: 'flex h-full flex-col gap-4',
    contact: 'flex flex-wrap items-start gap-4'
};

// 4:5, the format of a portrait. The container color shows behind the initials where there is no photo.
const PHOTO_CLASSES: Record<PersonCardLayout, string> = {
    portrait: 'relative flex aspect-4/5 w-full items-center justify-center overflow-hidden rounded-person-card-photo bg-surface-container',
    contact: `
        relative flex aspect-4/5 w-20 shrink-0 items-center justify-center overflow-hidden rounded-person-card-photo bg-surface-container
    `
};

// the text of a contact card wraps below the photo where the card is too narrow for both. min-w-0, so a long email
// address wraps instead of widening the card. The actions of a portrait stay at the bottom, so they line up in a row of
// cards.
const TEXT_CLASSES: Record<PersonCardLayout, string> = {
    portrait: 'flex min-w-0 grow flex-col gap-3',
    contact: 'flex min-w-0 grow basis-48 flex-col gap-3'
};

// the name of a portrait is the title of the card, the one of a contact card as large as the text next to it.
const NAME_CLASSES: Record<PersonCardLayout, string> = {
    portrait: 'font-heading text-title',
    contact: 'font-heading text-label-lg'
};

const AVATAR_SIZES: Record<PersonCardLayout, AvatarSize> = {
    portrait: 'lg',
    contact: 'md'
};

// NgOptimizedImage refuses inline images, which photos stored by a backend often are.
const INLINE_IMAGE: RegExp = /^(data|blob):/;

/**
 * A person on a card, like a member of a team or the contact person of a page: their photo, name and position, an
 * optional description as your own content, and buttons that call or write them. `<ui-person-card-actions>` inside
 * adds more after them, like a link to a chat on WhatsApp with its logo. Without a photo, or while it can't be loaded, their initials show.
 * The portrait layout is for a grid of a team page, the contact layout a compact card with a small photo. Place the
 * cards with a grid of your own. The card follows provideCardConfig.
 * Unset inputs fall back to the values provided with providePersonCardConfig.
 */
@Component({
    selector: 'ui-person-card',
    templateUrl: './person-card.component.html',
    imports: [AvatarComponent, ButtonComponent, CardComponent, HeadingComponent, IconComponent, NgOptimizedImage],
    host: {
        class: 'block'
    }
})
export class PersonCardComponent {
    private readonly config: PersonCardConfig = inject(PERSON_CARD_CONFIG);

    /**
     * The name of the person, which is the heading of the card.
     */
    readonly name: InputSignal<string> = input.required<string>();

    // not role, which as a static attribute would also end up on the element as its aria role.
    /**
     * What the person does, below their name, like 'Head coach' or 'Dentist'.
     */
    readonly position: InputSignal<string | undefined> = input<string>();

    /**
     * The url of a photo of the person, best in the format 4:5. Without one, or while it can't be loaded, their
     * initials show.
     */
    readonly photo: InputSignal<string | undefined> = input<string>();

    /**
     * The phone number as it is written. Its button calls the digits.
     */
    readonly phone: InputSignal<string | undefined> = input<string>();

    /**
     * The email address, whose button writes an email.
     */
    readonly email: InputSignal<string | undefined> = input<string>();

    /**
     * How the card is laid out: a portrait for a team page, or a compact contact card.
     */
    readonly layout: InputSignal<PersonCardLayout> = input<PersonCardLayout>(this.config.layout);

    /**
     * The level of the heading the name is, so it fits the headings of the page.
     */
    readonly headingLevel: InputSignal<HeadingLevel> = input<HeadingLevel>(this.config.headingLevel);

    /**
     * Whether the photo couldn't be loaded. A new photo tries again.
     */
    protected readonly photoFailed: WritableSignal<boolean> = linkedSignal(() => {
        this.photo();
        return false;
    });

    /**
     * The photo that shows, or undefined for the initials.
     */
    protected readonly shownPhoto: Signal<string | undefined> = computed(() => this.photoFailed() ? undefined : this.photo());

    /**
     * Whether the photo is an inline image, which NgOptimizedImage can't show.
     */
    protected readonly isInlinePhoto: Signal<boolean> = computed(() => INLINE_IMAGE.test(this.photo() ?? ''));

    // other ways to reach the person, like WhatsApp or Instagram, are links of the app in ui-person-card-actions, with
    // the logo it chooses: a phone and an email address are the ones every person has.
    /**
     * The buttons that call and write the person, of the contacts that are set, in that order.
     */
    protected readonly contacts: Signal<PersonCardContact[]> = computed(() => {
        const phone: string | undefined = this.phone();
        const email: string | undefined = this.email();
        const contacts: (PersonCardContact | undefined)[] = [
            phone == undefined ? undefined : { href: LinkUtilities.resolvePhoneHref(phone), text: phone, icon: faPhone },
            email == undefined ? undefined : { href: LinkUtilities.resolveEmailHref(email), text: email, icon: faEnvelope }
        ];
        return contacts.filter(contact => contact != undefined);
    });

    /**
     * The tailwind classes of the layout.
     */
    protected readonly layoutClasses: Signal<string> = computed(() => LAYOUT_CLASSES[this.layout()]);

    /**
     * The tailwind classes of the box of the photo.
     */
    protected readonly photoClasses: Signal<string> = computed(() => PHOTO_CLASSES[this.layout()]);

    /**
     * The tailwind classes of the column of the text.
     */
    protected readonly textClasses: Signal<string> = computed(() => TEXT_CLASSES[this.layout()]);

    /**
     * The tailwind classes of the name.
     */
    protected readonly nameClasses: Signal<string> = computed(() => NAME_CLASSES[this.layout()]);

    /**
     * The size of the initials without a photo.
     */
    protected readonly avatarSize: Signal<AvatarSize> = computed(() => AVATAR_SIZES[this.layout()]);
}