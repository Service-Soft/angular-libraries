/**
 * What DOMPurify needs of a window to sanitize in it: the browser's window, or one of a dom on the server, like
 * `new JSDOM('').window`.
 */
export type RichTextDomPurifyWindow = Pick<
    typeof globalThis,
    'DocumentFragment' | 'HTMLTemplateElement' | 'Node' | 'Element' | 'NodeFilter' | 'NamedNodeMap' | 'HTMLFormElement' | 'DOMParser'
>;