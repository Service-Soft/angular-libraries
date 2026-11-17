/**
 * Utilities for using forms in jsdom the way a user does: typing into inputs and pressing buttons. Render afterwards,
 * like with `fixture.whenStable()`.
 */
export abstract class FormTestingUtilities {
    /**
     * Finds an input by its name.
     * @param root - The element the input is in.
     * @param name - The name of the input.
     * @returns The input, or null when there is none.
     */
    static findInput(root: ParentNode, name: string): HTMLInputElement | null {
        return root.querySelector<HTMLInputElement>(`input[name="${name}"]`);
    }

    /**
     * Finds an input by the text of its label, like a user does, ignoring the mark of a required one after it.
     * @param root - The element the input and its label are in.
     * @param label - The text of the label.
     * @returns The input, or undefined when there is none.
     */
    static findLabelledInput(root: ParentNode, label: string): HTMLInputElement | undefined {
        const element: HTMLLabelElement | undefined = [...root.querySelectorAll('label')]
            .find(candidate => candidate.textContent.replace('*', '').trim() === label);
        if (element == undefined) {
            return undefined;
        }
        const input: Element | null = root.querySelector(`#${CSS.escape(element.htmlFor)}`);
        return input instanceof HTMLInputElement ? input : undefined;
    }

    /**
     * Types a value into an input, which fires its input event like typing does.
     * @param root - The element the input is in.
     * @param name - The name of the input.
     * @param value - The value to type.
     * @throws {Error} When there is no such input.
     */
    static type(root: ParentNode, name: string, value: string): void {
        const input: HTMLInputElement | null = this.findInput(root, name);
        if (input == undefined) {
            throw new Error(`There is no input named "${name}".`);
        }
        input.value = value;
        input.dispatchEvent(new Event('input'));
    }

    /**
     * Clicks the button or link with the given text.
     * @param root - The element the button is in.
     * @param text - The text of the button.
     * @throws {Error} When there is no such button or link.
     */
    static click(root: ParentNode, text: string): void {
        const element: HTMLElement | undefined = [...root.querySelectorAll<HTMLElement>('button, a')]
            .find(candidate => candidate.textContent.trim() === text);
        if (element == undefined) {
            throw new Error(`There is no button or link "${text}".`);
        }
        element.click();
    }

    /**
     * Gets the text of the first element that matches a selector.
     * @param root - The element to look in.
     * @param selector - The css selector, like '[role="alert"]'.
     * @returns The trimmed text, or an empty string when nothing matches.
     */
    static getText(root: ParentNode, selector: string): string {
        return root.querySelector(selector)?.textContent.trim() ?? '';
    }
}