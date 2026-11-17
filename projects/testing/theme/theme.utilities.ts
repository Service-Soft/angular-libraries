import { readFile } from 'node:fs/promises';

import tailwindcss from '@tailwindcss/postcss';
import Color from 'colorjs.io';
import postcss, { Declaration, Root } from 'postcss';

import { ContrastRequirement } from './contrast-requirement.model';

// WCAG AA: 4.5:1 for text, 3:1 for the boundaries of controls (1.4.11).
const TEXT_CONTRAST: number = 4.5;
const CONTROL_BOUNDARY_CONTRAST: number = 3;
const SURFACE: string = 'surface';
const SURFACE_CONTAINER: string = 'surface-container';
const ON_SURFACE: string = 'on-surface';
const ON_SURFACE_VARIANT: string = 'on-surface-variant';
const SECONDARY_TEXT: string = 'secondary-text';
const SUCCESS_TEXT: string = 'success-text';
const WARNING_TEXT: string = 'warning-text';

/**
 * A color with hover and pressed states, see the states in the theme of @service-soft/ui.
 */
type InteractiveColor = {
    /**
     * The color, which the state tokens are named after.
     */
    color: string,
    /**
     * The token used when the color is text on a surface.
     */
    text: string
};

const INTERACTIVE_COLORS: InteractiveColor[] = [
    { color: 'primary', text: 'primary' },
    { color: 'secondary', text: SECONDARY_TEXT },
    { color: 'error', text: 'error' },
    { color: 'success', text: SUCCESS_TEXT }
];

// filled elements hover and press with -hover and -pressed under their text, colored text hovers and presses with
// -tint and -tint-pressed behind it.
const STATE_CONTRAST_REQUIREMENTS: ContrastRequirement[] = INTERACTIVE_COLORS.flatMap(({ color, text }) => [
    { foreground: `on-${color}`, background: `${color}-hover`, minimum: TEXT_CONTRAST },
    { foreground: `on-${color}`, background: `${color}-pressed`, minimum: TEXT_CONTRAST },
    { foreground: text, background: `${color}-tint`, minimum: TEXT_CONTRAST },
    { foreground: text, background: `${color}-tint-pressed`, minimum: TEXT_CONTRAST }
]);

// the colors the surface-primary and surface-secondary classes make a surface of.
const SURFACE_COLORS: string[] = ['primary', 'secondary'];
const COLORED_SURFACE_SELECTORS: string[] = SURFACE_COLORS.map(color => `.surface-${color}`);

// what the content inside a colored surface is drawn with, in place of the surface tokens: text, hints and links on the
// color and on its container, borders of controls, colored text with its tints behind it, and filled elements of the
// on- color with the color as their text.
const COLORED_SURFACE_REQUIREMENTS: ContrastRequirement[] = SURFACE_COLORS.flatMap(color => [
    { foreground: `on-${color}-variant`, background: color, minimum: TEXT_CONTRAST },
    { foreground: `on-${color}`, background: `${color}-surface-container`, minimum: TEXT_CONTRAST },
    { foreground: `on-${color}-variant`, background: `${color}-surface-container`, minimum: TEXT_CONTRAST },
    { foreground: `on-${color}-outline`, background: color, minimum: CONTROL_BOUNDARY_CONTRAST },
    { foreground: `on-${color}-outline`, background: `${color}-surface-container`, minimum: CONTROL_BOUNDARY_CONTRAST },
    { foreground: `on-${color}`, background: `on-${color}-tint`, minimum: TEXT_CONTRAST },
    { foreground: `on-${color}`, background: `on-${color}-tint-pressed`, minimum: TEXT_CONTRAST },
    { foreground: color, background: `on-${color}-hover`, minimum: TEXT_CONTRAST },
    { foreground: color, background: `on-${color}-pressed`, minimum: TEXT_CONTRAST }
]);

// the header and the footer of a table hold text, secondary text like the notice of its filters, and links and focus
// rings in primary.
const TABLE_BACKGROUNDS: string[] = ['table-header', 'table-footer'];
const TABLE_FOREGROUNDS: string[] = [ON_SURFACE, ON_SURFACE_VARIANT, 'primary'];
const TABLE_REQUIREMENTS: ContrastRequirement[] = TABLE_BACKGROUNDS.flatMap(
    background => TABLE_FOREGROUNDS.map(foreground => ({ foreground, background, minimum: TEXT_CONTRAST }))
);

// the faint primary behind the stripes of tables and lists holds what a row holds: text, secondary text, links,
// focus rings and text buttons in primary, and errors, like the name of the error of a log.
const FAINT_FOREGROUNDS: string[] = [ON_SURFACE, ON_SURFACE_VARIANT, 'primary', 'error'];
const FAINT_REQUIREMENTS: ContrastRequirement[] = FAINT_FOREGROUNDS.map(
    foreground => ({ foreground, background: 'primary-faint', minimum: TEXT_CONTRAST })
);

// a callout is drawn on the tint of its tone: its text, links and focus rings in primary, and its icon in the text color
// of the tone, which STATE_CONTRAST_REQUIREMENTS checks on the tints of the interactive colors already.
const CALLOUT_TINTS: string[] = ['primary-tint', 'secondary-tint', 'success-tint', 'error-tint', 'warning-tint'];
const CALLOUT_REQUIREMENTS: ContrastRequirement[] = [
    ...CALLOUT_TINTS.map(background => ({ foreground: ON_SURFACE, background, minimum: TEXT_CONTRAST })),
    ...CALLOUT_TINTS.filter(background => background !== 'primary-tint')
        .map(background => ({ foreground: 'primary', background, minimum: TEXT_CONTRAST })),
    { foreground: WARNING_TEXT, background: 'warning-tint', minimum: TEXT_CONTRAST }
];

const CONTRAST_REQUIREMENTS: ContrastRequirement[] = [
    { foreground: 'on-primary', background: 'primary', minimum: TEXT_CONTRAST },
    { foreground: 'on-secondary', background: 'secondary', minimum: TEXT_CONTRAST },
    { foreground: 'on-error', background: 'error', minimum: TEXT_CONTRAST },
    { foreground: 'on-warning', background: 'warning', minimum: TEXT_CONTRAST },
    { foreground: 'on-success', background: 'success', minimum: TEXT_CONTRAST },
    { foreground: ON_SURFACE, background: SURFACE, minimum: TEXT_CONTRAST },
    { foreground: ON_SURFACE_VARIANT, background: SURFACE, minimum: TEXT_CONTRAST },
    { foreground: ON_SURFACE, background: SURFACE_CONTAINER, minimum: TEXT_CONTRAST },
    { foreground: ON_SURFACE_VARIANT, background: SURFACE_CONTAINER, minimum: TEXT_CONTRAST },
    // links, outlined and text buttons, focus rings, validation messages
    { foreground: 'primary', background: SURFACE, minimum: TEXT_CONTRAST },
    { foreground: SECONDARY_TEXT, background: SURFACE, minimum: TEXT_CONTRAST },
    { foreground: 'error', background: SURFACE, minimum: TEXT_CONTRAST },
    { foreground: 'primary', background: SURFACE_CONTAINER, minimum: TEXT_CONTRAST },
    { foreground: SECONDARY_TEXT, background: SURFACE_CONTAINER, minimum: TEXT_CONTRAST },
    { foreground: 'error', background: SURFACE_CONTAINER, minimum: TEXT_CONTRAST },
    { foreground: SUCCESS_TEXT, background: SURFACE, minimum: TEXT_CONTRAST },
    { foreground: SUCCESS_TEXT, background: SURFACE_CONTAINER, minimum: TEXT_CONTRAST },
    { foreground: WARNING_TEXT, background: SURFACE, minimum: TEXT_CONTRAST },
    { foreground: WARNING_TEXT, background: SURFACE_CONTAINER, minimum: TEXT_CONTRAST },
    ...STATE_CONTRAST_REQUIREMENTS,
    ...CALLOUT_REQUIREMENTS,
    ...COLORED_SURFACE_REQUIREMENTS,
    ...TABLE_REQUIREMENTS,
    ...FAINT_REQUIREMENTS,
    { foreground: 'outline', background: SURFACE, minimum: CONTROL_BOUNDARY_CONTRAST },
    { foreground: 'outline', background: SURFACE_CONTAINER, minimum: CONTROL_BOUNDARY_CONTRAST },
    // the filled stars of a rating are a graphic
    { foreground: 'rating', background: SURFACE, minimum: CONTROL_BOUNDARY_CONTRAST },
    { foreground: 'rating', background: SURFACE_CONTAINER, minimum: CONTROL_BOUNDARY_CONTRAST }
];

const COLOR_TOKEN_PREFIX: string = '--color-';
const MAX_VARIABLE_DEPTH: number = 10;
const COLOR_MIX: string = 'color-mix(';
const LIGHT_DARK: string = 'light-dark(';
const COLOR_SCHEMES: ColorScheme[] = ['light', 'dark'];
// css names of color spaces that colorjs.io knows under another id
const COLOR_SPACE_IDS: Record<string, string> = { 'display-p3': 'p3', xyz: 'xyz-d65' };

/**
 * One color of a color-mix() and the percentage it was given, if any.
 */
type ColorMixComponent = {
    /**
     * The color.
     */
    color: string,
    /**
     * Its percentage, eg. 20 for 20%.
     */
    percentage?: number
};

/**
 * A color scheme, which light-dark() picks its value by.
 */
type ColorScheme = 'light' | 'dark';

/**
 * The custom properties a theme defines, by their name including the leading '--'.
 */
type CustomProperties = Map<string, string>;

/**
 * The custom properties that apply in one context, like the default theme or a dark theme.
 */
type ThemeContext = {
    /**
     * Where the properties apply, eg. '.dark' or '@media (prefers-color-scheme: dark) :root'.
     */
    name: string,
    /**
     * The properties, including those inherited from the default theme.
     */
    properties: CustomProperties,
    /**
     * The color schemes the context can be shown in.
     */
    schemes: ColorScheme[]
};

/**
 * Utilities for testing a theme.
 */
export abstract class ThemeUtilities {
    /**
     * Validates that every color token pair the libraries put on top of each other meets WCAG AA,
     * in light and dark mode, in the default theme and in every context that overrides tokens.
     * @param stylesheetPath - The path of the global stylesheet that imports tailwind and the themes.
     * @throws {Error} Listing every pair that fails, every missing token and every value that is no color.
     */
    static async validateContrast(stylesheetPath: string): Promise<void> {
        const css: string = await this.resolveCompiledCss(stylesheetPath);
        const contexts: ThemeContext[] = this.resolveContexts(postcss.parse(css));
        const failures: string[] = contexts.flatMap(context => this.findContrastFailures(context));
        if (failures.length) {
            const list: string = failures.map(failure => '- ' + failure).join('\n');
            throw new Error(`The theme does not meet WCAG AA:\n${list}`);
        }
    }

    private static async resolveCompiledCss(stylesheetPath: string): Promise<string> {
        const stylesheet: string = await readFile(stylesheetPath, 'utf8');
        // tailwind only emits the tokens a project uses. Generating a utility for every token that gets checked
        // forces all of them out, so none can pass by being absent.
        const tokens: string[] = [...new Set(CONTRAST_REQUIREMENTS.flatMap(r => [r.foreground, r.background]))];
        const forceTokens: string = `@source inline("bg-{${tokens.join(',')}}");`;
        const result: postcss.Result = await postcss([tailwindcss()]).process(`${stylesheet}\n${forceTokens}`, { from: stylesheetPath });
        return result.css;
    }

    private static resolveContexts(root: Root): ThemeContext[] {
        const defaultProperties: CustomProperties = new Map();
        const overrides: Map<string, CustomProperties> = new Map();
        const schemes: Map<string, ColorScheme[]> = new Map();
        root.walkDecls('color-scheme', declaration => {
            const contextName: string | undefined = this.findOverrideContextName(declaration);
            if (contextName != undefined) {
                schemes.set(contextName, this.resolveColorSchemes(declaration.value));
            }
        });
        root.walkDecls(/^--/, declaration => {
            const contextName: string | undefined = this.findOverrideContextName(declaration);
            if (contextName == undefined) {
                defaultProperties.set(declaration.prop, declaration.value);
                return;
            }
            const properties: CustomProperties = overrides.get(contextName) ?? new Map<string, string>();
            properties.set(declaration.prop, declaration.value);
            overrides.set(contextName, properties);
        });
        // tailwind's utilities set custom properties of their own, like --tw-shadow. Only a context that changes a color
        // token can change a contrast.
        // The colored surfaces of ui only point the surface tokens to their own, whose pairs COLORED_SURFACE_REQUIREMENTS
        // check in every other context.
        const colorOverrides: [string, CustomProperties][] = [...overrides]
            .filter(([name]) => !COLORED_SURFACE_SELECTORS.some(selector => name.startsWith(selector)))
            .filter(([, properties]) => [...properties.keys()].some(name => name.startsWith(COLOR_TOKEN_PREFIX)));
        return [
            { name: 'default theme', properties: defaultProperties, schemes: COLOR_SCHEMES },
            ...colorOverrides.map(([name, properties]) => ({
                name,
                properties: new Map([...defaultProperties, ...properties]),
                schemes: schemes.get(name) ?? COLOR_SCHEMES
            }))
        ];
    }

    /**
     * A context that allows only one color scheme, like .dark with color-scheme: dark, is only checked in that one.
     * @param value - The value of a color-scheme declaration.
     * @returns The color schemes it allows.
     */
    private static resolveColorSchemes(value: string): ColorScheme[] {
        const schemes: ColorScheme[] = COLOR_SCHEMES.filter(scheme => value.split(/\s+/).includes(scheme));
        return schemes.length ? schemes : COLOR_SCHEMES;
    }

    /**
     * Tailwind emits the theme inside of '@layer theme'. Custom properties anywhere else override it in their context.
     * Other layers are left out of the name, they change which declaration wins but not where it applies.
     * @param declaration - The declaration of a custom property or of color-scheme.
     * @returns The name of the context, or undefined when the declaration belongs to the default theme.
     */
    private static findOverrideContextName(declaration: Declaration): string | undefined {
        const parts: string[] = [];
        for (let node: postcss.Container | postcss.Document | undefined = declaration.parent; node != undefined; node = node.parent) {
            if (node.type === 'atrule') {
                const atRule: postcss.AtRule = node as postcss.AtRule;
                if (atRule.name === 'layer') {
                    if (atRule.params === 'theme') {
                        return undefined;
                    }
                    continue;
                }
                parts.unshift(`@${atRule.name} ${atRule.params}`);
            }
            if (node.type === 'rule') {
                parts.unshift((node as postcss.Rule).selector);
            }
        }
        return parts.join(' ');
    }

    private static findContrastFailures(context: ThemeContext): string[] {
        return context.schemes.flatMap(scheme => CONTRAST_REQUIREMENTS.flatMap(requirement => {
            const where: string = `${context.name} (${scheme})`;
            const pair: string = `${requirement.foreground} on ${requirement.background}`;
            try {
                const foreground: Color = this.resolveColor(requirement.foreground, context.properties, scheme);
                const background: Color = this.resolveColor(requirement.background, context.properties, scheme);
                const ratio: number = foreground.contrast(background, 'WCAG21');
                return ratio < requirement.minimum
                    ? [`${where}: ${pair} is ${ratio.toFixed(2)}:1, needs ${requirement.minimum}:1`]
                    : [];
            }
            catch (error) {
                return [`${where}: ${pair} can't be checked: ${(error as Error).message}`];
            }
        }));
    }

    private static resolveColor(token: string, properties: CustomProperties, scheme: ColorScheme): Color {
        const name: string = `${COLOR_TOKEN_PREFIX}${token}`;
        const value: string | undefined = properties.get(name);
        if (value == undefined) {
            throw new Error(`${name} is not defined`);
        }
        const resolvedValue: string = this.resolveColorMixes(this.resolveLightDarks(this.resolveVariables(value, properties), scheme));
        try {
            return new Color(resolvedValue);
        }
        catch {
            throw new Error(`${name} is no color: "${resolvedValue}"`);
        }
    }

    /**
     * Replaces every light-dark() with its color for the scheme, innermost first.
     * @param value - A value without variables.
     * @param scheme - The color scheme to pick the colors of.
     * @returns The value without light-dark().
     * @throws {Error} When a light-dark() does not have exactly two colors.
     */
    private static resolveLightDarks(value: string, scheme: ColorScheme): string {
        const start: number = value.lastIndexOf(LIGHT_DARK);
        if (start === -1) {
            return value;
        }
        const argumentsStart: number = start + LIGHT_DARK.length;
        const end: number = this.findClosingParenthesis(value, argumentsStart);
        const colors: string[] = this.splitTopLevel(value.slice(argumentsStart, end));
        if (colors.length !== 2) {
            throw new Error(`"light-dark(${value.slice(argumentsStart, end)})" needs exactly two colors`);
        }
        const color: string = (scheme === 'light' ? colors[0] : colors[1]).trim();
        return this.resolveLightDarks(value.slice(0, start) + color + value.slice(end + 1), scheme);
    }

    /**
     * Replaces every color-mix() with the color it computes, innermost first. The colorjs.io library can't parse it.
     * @param value - A value without variables.
     * @returns The value without color-mix().
     */
    private static resolveColorMixes(value: string): string {
        const start: number = value.lastIndexOf(COLOR_MIX);
        if (start === -1) {
            return value;
        }
        const argumentsStart: number = start + COLOR_MIX.length;
        const end: number = this.findClosingParenthesis(value, argumentsStart);
        const mixed: string = this.resolveColorMix(value.slice(argumentsStart, end));
        return this.resolveColorMixes(value.slice(0, start) + mixed + value.slice(end + 1));
    }

    private static resolveColorMix(mixArguments: string): string {
        const [interpolation, ...components] = this.splitTopLevel(mixArguments);
        const space: string | undefined = /^in\s+([\w-]+)$/.exec(interpolation.trim())?.[1];
        if (space == undefined || components.length !== 2) {
            const supported: string = 'color-mix(in <space>, <color> [<percentage>], <color> [<percentage>])';
            throw new Error(`"color-mix(${mixArguments})" is not supported, only "${supported}"`);
        }
        const first: ColorMixComponent = this.resolveColorMixComponent(components[0]);
        const second: ColorMixComponent = this.resolveColorMixComponent(components[1]);
        // the same defaults as css: a missing percentage is the rest to 100%, two missing ones are 50% each
        const firstPercentage: number = first.percentage ?? (second.percentage == undefined ? 50 : 100 - second.percentage);
        const secondPercentage: number = second.percentage ?? 100 - firstPercentage;
        return Color.mix(first.color, second.color, secondPercentage / (firstPercentage + secondPercentage), {
            space: COLOR_SPACE_IDS[space] ?? space
        }).toString();
    }

    private static resolveColorMixComponent(component: string): ColorMixComponent {
        const trimmed: string = component.trim();
        const percentage: RegExp = /(?:^(\d+(?:\.\d+)?)%\s+)|(?:\s+(\d+(?:\.\d+)?)%$)/;
        const match: RegExpExecArray | undefined = percentage.exec(trimmed) ?? undefined;
        return match == undefined
            ? { color: trimmed }
            : { color: trimmed.replace(percentage, '').trim(), percentage: Number(match[1] ?? match[2]) };
    }

    private static findClosingParenthesis(value: string, from: number): number {
        let depth: number = 0;
        for (let index: number = from; index < value.length; index++) {
            if (value[index] === '(') {
                depth++;
            }
            if (value[index] === ')') {
                if (depth === 0) {
                    return index;
                }
                depth--;
            }
        }
        throw new Error(`"${value}" has an unclosed parenthesis`);
    }

    private static splitTopLevel(value: string): string[] {
        const parts: string[] = [''];
        let depth: number = 0;
        for (const character of value) {
            depth += character === '(' ? 1 : character === ')' ? -1 : 0;
            if (character === ',' && depth === 0) {
                parts.push('');
                continue;
            }
            parts[parts.length - 1] += character;
        }
        return parts;
    }

    private static resolveVariables(value: string, properties: CustomProperties): string {
        const variable: RegExp = /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/;
        let resolved: string = value;
        for (let depth: number = 0; variable.test(resolved); depth++) {
            if (depth === MAX_VARIABLE_DEPTH) {
                throw new Error(`"${value}" references variables more than ${MAX_VARIABLE_DEPTH} levels deep`);
            }
            resolved = resolved.replace(variable, (match: string, name: string, fallback: string | undefined) => {
                const replacement: string | undefined = properties.get(name) ?? fallback;
                if (replacement == undefined) {
                    throw new Error(`${name} is not defined`);
                }
                return replacement;
            });
        }
        return resolved;
    }
}