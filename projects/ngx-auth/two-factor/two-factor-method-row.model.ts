import { ButtonColor } from '@service-soft/ui/button';

/**
 * What a button of a two factor method in the settings does.
 */
export type TwoFactorMethodAction = {
    /**
     * Enrolls the method, or enrolls new recovery codes, or removes it.
     */
    kind: 'setUp' | 'turnOff',
    /**
     * The text of the button.
     */
    label: string,
    /**
     * The color of the button: removing a method is shown as dangerous.
     */
    color: ButtonColor
};

/**
 * A two factor method, as the settings show it.
 */
export type TwoFactorMethodRow = {
    /**
     * The name of the method, like 'otp'.
     */
    method: string,
    /**
     * The id of its name, which its buttons are described by.
     */
    nameId: string,
    /**
     * The name the user reads, like 'Authenticator app'.
     */
    name: string,
    /**
     * Whether it is on or off.
     */
    status: string,
    /**
     * What the user can do with it.
     */
    actions: TwoFactorMethodAction[],
    /**
     * Whether it is being enrolled right now.
     */
    enrolling: boolean
};