import { TwoFactorEnrollmentKind } from './two-factor-enrollment-kind.type';

/**
 * The texts of a two factor method.
 */
export type SecondFactorMethodLabels = {
    /**
     * The name of the method, like 'Authenticator app'.
     */
    name: string,
    /**
     * The button that switches to the method, like 'Use a recovery code'.
     */
    choose: string,
    /**
     * Says where the user finds the code, below its input.
     */
    hint: string
};

/**
 * How the code of a two factor method is asked for and enrolled.
 */
export type SecondFactorMethodOptions = {
    /**
     * Whether the user types a code, or the browser uses a passkey of their device.
     */
    confirmation: 'code' | 'passkey',
    /**
     * Whether zibri sends the code first, like by email or text message. It is sent when the user picks the method,
     * and the user can have a new one sent.
     */
    sendsCode: boolean,
    /**
     * Whether the code is digits only, which shows the number keyboard on phones.
     */
    numeric: boolean,
    /**
     * How the method is enrolled.
     */
    enrollment: TwoFactorEnrollmentKind
};

/**
 * The texts of the form that asks for the code of a second factor.
 */
export type SecondFactorLabels = {
    /**
     * The label of the input of the code.
     */
    code: string,
    /**
     * The texts of each two factor method, by its name, like 'otp'.
     */
    methods: Partial<Record<string, SecondFactorMethodLabels>>,
    /**
     * Shown when the user has no two factor method the form can ask for.
     */
    noMethod: string,
    /**
     * The button that sends a new code.
     */
    sendCode: string,
    /**
     * The button that confirms the second factor.
     */
    confirm: string,
    /**
     * The button that has the browser use a passkey as the second factor.
     */
    usePasskey: string,
    /**
     * Announced once a code was sent, when the user picked a method that sends one.
     */
    codeSent: string,
    /**
     * Announced once a new code was sent.
     */
    newCodeSent: string
};

/**
 * How second factors are asked for and enrolled, in the login, the dialog of a request and the settings.
 */
export type SecondFactorConfig = {
    /**
     * The texts of the form.
     */
    labels: SecondFactorLabels,
    /**
     * The two factor methods that can be asked for and enrolled, by their name. A method the user has enrolled but
     * isn't listed isn't offered. A method of your own needs its labels as well.
     */
    methods: Partial<Record<string, SecondFactorMethodOptions>>
};