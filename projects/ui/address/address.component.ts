import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, Signal } from '@angular/core';
import { faEnvelope, faFax, faPhone } from '@fortawesome/free-solid-svg-icons';
import { IconComponent } from '@service-soft/ui/icon';
import { LinkComponent, LinkUtilities } from '@service-soft/ui/link';

import { AddressConfig } from './address-config.model';
import { ADDRESS_CONFIG } from './address-config.provider';
import { AddressContact } from './address-contact.model';
import { AddressLine } from './address-line.model';
import { PostalAddress } from './postal-address.model';

const SCHEMA_ORG: string = 'https://schema.org/';

// with icons the label is still read by screen readers, before the number, and the icon is decorative.
const LABEL_CLASSES: Record<'icon' | 'text', string> = {
    icon: 'sr-only',
    text: 'text-on-surface-variant'
};

const ICON_CLASSES: Record<'icon' | 'text', string> = {
    icon: 'flex text-on-surface-variant',
    text: 'hidden'
};

/**
 * The address of a business or a person and how to reach them, on the native `<address>`: the name, the street, the
 * postal code and the city, and the phone number, the fax number and the email address below. The phone number shows
 * as it is written and calls its digits, the email address writes an email.
 * It is marked up with schema.org microdata by default, as the business type of provideAddressConfig, 'LocalBusiness'.
 * Unset inputs fall back to the values provided with provideAddressConfig.
 */
@Component({
    selector: 'ui-address',
    templateUrl: './address.component.html',
    imports: [IconComponent, LinkComponent],
    host: {
        class: 'block'
    }
})
export class AddressComponent {
    private readonly config: AddressConfig = inject(ADDRESS_CONFIG);

    /**
     * The name of the business or the person, above the address.
     */
    readonly name: InputSignal<string | undefined> = input<string>();

    /**
     * The street, the postal code, the city and optionally the region and the country.
     */
    readonly address: InputSignal<PostalAddress> = input.required<PostalAddress>();

    /**
     * The phone number as it is written, like '+49 2234 12 34'. Its link calls the digits.
     */
    readonly phone: InputSignal<string | undefined> = input<string>();

    /**
     * The fax number as it is written. It isn't linked, a phone can't send a fax.
     */
    readonly fax: InputSignal<string | undefined> = input<string>();

    /**
     * The email address, whose link writes an email.
     */
    readonly email: InputSignal<string | undefined> = input<string>();

    /**
     * Whether the contacts show an icon instead of their label. Screen readers read the label for the icon.
     */
    readonly icons: InputSignalWithTransform<boolean, unknown> = input(this.config.icons, { transform: booleanAttribute });

    /**
     * Whether the address is marked up with schema.org microdata, which search engines read.
     */
    readonly microdata: InputSignalWithTransform<boolean, unknown> = input(this.config.microdata, { transform: booleanAttribute });

    /**
     * The schema.org type of the business, like 'Dentist' or 'SportsClub'. Undefined adds the name, the address and the
     * contacts to an item of your own around it instead, like one that holds the opening hours as well.
     */
    readonly businessType: InputSignal<string | undefined> = input<string | undefined>(this.config.businessType);

    /**
     * The schema.org type of the address block, or undefined when it isn't an item of its own.
     */
    protected readonly itemType: Signal<string | undefined> = computed(() => {
        const type: string | undefined = this.businessType();
        return this.microdata() && type != undefined ? `${SCHEMA_ORG}${type}` : undefined;
    });

    /**
     * The schema.org type of the postal address.
     */
    protected readonly postalAddressType: string = `${SCHEMA_ORG}PostalAddress`;

    /**
     * The phone number, the fax number and the email address that are set, in that order.
     */
    protected readonly contacts: Signal<AddressContact[]> = computed(() => {
        const phone: string | undefined = this.phone();
        const fax: string | undefined = this.fax();
        const email: string | undefined = this.email();
        const { phoneLabel, faxLabel, emailLabel } = this.config;
        const contacts: (AddressContact | undefined)[] = [
            phone == undefined
                ? undefined
                : { label: phoneLabel, icon: faPhone, text: phone, href: LinkUtilities.resolvePhoneHref(phone), itemprop: 'telephone' },
            fax == undefined ? undefined : { label: faxLabel, icon: faFax, text: fax, href: undefined, itemprop: 'faxNumber' },
            email == undefined
                ? undefined
                : { label: emailLabel, icon: faEnvelope, text: email, href: LinkUtilities.resolveEmailHref(email), itemprop: 'email' }
        ];
        return contacts.filter(contact => contact != undefined);
    });

    /**
     * The lines after the city that are set: the region and the country.
     */
    protected readonly extraLines: Signal<AddressLine[]> = computed(() => {
        const { region, country } = this.address();
        const lines: (AddressLine | undefined)[] = [
            region == undefined ? undefined : { itemprop: 'addressRegion', text: region },
            country == undefined ? undefined : { itemprop: 'addressCountry', text: country }
        ];
        return lines.filter(line => line != undefined);
    });

    /**
     * The tailwind classes of the label of a contact: shown, or only read by screen readers next to its icon.
     */
    protected readonly labelClasses: Signal<string> = computed(() => LABEL_CLASSES[this.icons() ? 'icon' : 'text']);

    /**
     * The tailwind classes around the icon of a contact, which shows in place of its label.
     */
    protected readonly iconClasses: Signal<string> = computed(() => ICON_CLASSES[this.icons() ? 'icon' : 'text']);
}