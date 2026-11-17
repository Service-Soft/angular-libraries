/**
 * How a link looks: inline for a link inside text, nav for an item of a navigation, which marks the current page,
 * plain for something that keeps its own look and only becomes a link, like a title or an image, subtle for text in
 * the look of what is around it that is underlined on hover, like the headlines of a news ticker, menu for an item
 * of a menu, over its full width, and pill for an item of a row of pills, like the sub pages of a section, which fills
 * the current page.
 */
export type LinkAppearance = 'inline' | 'nav' | 'plain' | 'subtle' | 'menu' | 'pill';