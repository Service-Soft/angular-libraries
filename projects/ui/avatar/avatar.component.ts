import { booleanAttribute, Component, computed, inject, input, InputSignal, InputSignalWithTransform, linkedSignal, LOCALE_ID, Signal, WritableSignal } from '@angular/core';

import { AvatarColor } from './avatar-color.type';
import { AvatarConfig } from './avatar-config.model';
import { AVATAR_CONFIG } from './avatar-config.provider';
import { AvatarSize } from './avatar-size.type';
import { AvatarUtilities } from './avatar.utilities';

// a min-w and aspect-square instead of a fixed size: initials that grow with the user's text size make the circle larger
// instead of overflowing it. The transparent border keeps the circle in forced colors mode, which removes backgrounds.
const BASE_CLASSES: string = `
    relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-full border
    border-transparent align-middle select-none
`;

const SIZE_CLASSES: Record<AvatarSize, string> = {
    sm: 'min-w-8 p-1 text-label-sm',
    md: 'min-w-10 p-1 text-label',
    lg: 'min-w-16 p-2 text-title'
};

// behind the initials, which take the on- color of it.
const COLOR_CLASSES: Record<AvatarColor, string> = {
    neutral: 'bg-surface-container text-on-surface',
    primary: 'bg-primary text-on-primary',
    secondary: 'bg-secondary text-on-secondary'
};

/**
 * A person as a round picture, or as the initials of their name where there is no picture or it can't be loaded.
 * Screen readers read the name, unless it is decorative, like next to the name it shows.
 * Unset inputs fall back to the values provided with provideAvatarConfig.
 */
@Component({
    selector: 'ui-avatar',
    templateUrl: './avatar.component.html',
    host: {
        // no box of its own, like an icon, so the avatar sits in the layout as if there was no wrapper.
        class: 'contents'
    }
})
export class AvatarComponent {
    private readonly config: AvatarConfig = inject(AVATAR_CONFIG);

    private readonly locale: string = inject(LOCALE_ID);

    /**
     * The name of the person, whose initials show without a picture, and which screen readers read.
     */
    readonly name: InputSignal<string> = input.required<string>();

    /**
     * The url of the picture. Without one, or while it can't be loaded, the initials show.
     */
    readonly src: InputSignal<string | undefined> = input<string>();

    /**
     * How large it is: small like in a list, medium like in a header, or large like on a profile.
     */
    readonly size: InputSignal<AvatarSize> = input<AvatarSize>(this.config.size);

    /**
     * The background of the initials.
     */
    readonly color: InputSignal<AvatarColor> = input<AvatarColor>(this.config.color);

    /**
     * Whether screen readers skip it, like next to the name it shows, which they would read twice otherwise.
     */
    readonly decorative: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * The initials of the name, like 'AL' for 'Ada Lovelace'.
     */
    protected readonly initials: Signal<string> = computed(() => AvatarUtilities.resolveInitials(this.name(), this.locale));

    /**
     * Whether the picture couldn't be loaded. A new src tries again.
     */
    protected readonly imageFailed: WritableSignal<boolean> = linkedSignal(() => {
        this.src();
        return false;
    });

    /**
     * Whether the picture shows over the initials.
     */
    protected readonly showsImage: Signal<boolean> = computed(() => this.src() != undefined && !this.imageFailed());

    /**
     * The tailwind classes for the current size and color.
     */
    protected readonly classes: Signal<string> = computed(() => {
        return [BASE_CLASSES, SIZE_CLASSES[this.size()], COLOR_CLASSES[this.color()]].join(' ');
    });
}
