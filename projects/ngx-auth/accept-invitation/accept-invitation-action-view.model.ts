import { ButtonVariant } from '@service-soft/ui/button';

/**
 * A link or a button of the page of an invitation, ready to render.
 */
export type AcceptInvitationActionView = {
    /**
     * The text of the link or the button.
     */
    label: string,
    /**
     * How it looks.
     */
    variant: ButtonVariant
} & ({
    /**
     * Says that it is a link.
     */
    kind: 'link',
    /**
     * Where it goes.
     */
    route: string,
    /**
     * The query of the route, like the returnUrl of the login.
     */
    queryParams?: Record<string, string>
} | {
    /**
     * Says that it is a button.
     */
    kind: 'button',
    /**
     * What it does.
     */
    run: () => Promise<void>
});