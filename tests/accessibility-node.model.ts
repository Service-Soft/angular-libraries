/**
 * A value in chromium's accessibility tree.
 */
export type AccessibilityValue = {
    /**
     * The value, like a role, a name or true for a state.
     */
    value?: unknown
};

/**
 * A state of a node in chromium's accessibility tree.
 */
export type AccessibilityProperty = {
    /**
     * The name of the state, like expanded.
     */
    name: string,
    /**
     * Its value.
     */
    value: AccessibilityValue
};

/**
 * A node of chromium's accessibility tree, with the fields the tests read. Playwright doesn't export the types of
 * the protocol.
 */
export type AccessibilityNode = {
    /**
     * The role, like button.
     */
    role?: AccessibilityValue,
    /**
     * The accessible name.
     */
    name?: AccessibilityValue,
    /**
     * The states, like expanded.
     */
    properties?: AccessibilityProperty[]
};