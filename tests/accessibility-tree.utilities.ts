import { CDPSession, Page } from 'playwright';

import { AccessibilityNode, AccessibilityValue } from './accessibility-node.model';

/**
 * Utilities for reading what chromium tells screen readers. Playwright computes roles and states itself, without the
 * ones the browser derives from attributes like popovertarget.
 */
export abstract class AccessibilityTreeUtilities {
    /**
     * Finds whether a button is expanded, like the trigger of a popover.
     * @param page - The page with the button.
     * @param name - The accessible name of the button.
     * @returns Whether it is expanded, or undefined when it has no expanded state or there is no such button.
     */
    static async findExpanded(page: Page, name: string): Promise<boolean | undefined> {
        const session: CDPSession = await page.context().newCDPSession(page);
        const nodes: AccessibilityNode[] = (await session.send('Accessibility.getFullAXTree')).nodes;
        const button: AccessibilityNode | undefined = nodes.find(node => node.role?.value === 'button' && node.name?.value === name);
        const expanded: AccessibilityValue | undefined = button?.properties?.find(property => property.name === 'expanded')?.value;
        return expanded == undefined ? undefined : expanded.value === true;
    }
}