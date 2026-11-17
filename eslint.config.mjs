import betterTailwindcss from 'eslint-plugin-better-tailwindcss';
import { getDefaultSelectors } from 'eslint-plugin-better-tailwindcss/defaults';
import { configs } from '@service-soft/eslint-config';

/** @type {import('eslint').Linter.Config} */
export default [
    ...configs,
    {
        // the root tsconfig.json only references the project configs and includes no files itself.
        files: ['**/*.ts'],
        languageOptions: {
            parserOptions: {
                project: ['tsconfig.eslint.json']
            }
        }
    },
    {
        files: ['*.js', '*.mjs'],
        rules: {
            'jsdoc/require-description': 'off'
        }
    },
    {
        files: ['**/*.html'],
        rules: {
            // reading signals in templates is a call expression.
            'angular/no-call-expression': 'off'
        }
    },
    {
        // the controls pass their autofocus input on to their native element, like every other native attribute. Only a
        // consumer that asks for it gets it, like a control in a popover, which the browser focuses as the popover opens.
        files: ['projects/ui/input-*/*.component.html', 'projects/ngx-ecommerce/input-*/*.component.html'],
        rules: {
            'angular/no-autofocus': 'off'
        }
    },
    {
        files: ['**/*.stories.ts'],
        rules: {
            // stories are documentation themselves.
            'jsdoc/require-jsdoc': 'off',
            // stories render inline templates anyway, so the components that help them do too.
            'angular/component-max-inline-declarations': 'off'
        }
    },
    {
        // zibri is a node backend: a type of it would end up in the published declarations, and every consumer would need
        // zibri to compile. What a library shares with it is in zibri-contract, which zibri checks its models against.
        files: ['projects/**/*.ts', 'tests/**/*.ts'],
        rules: {
            'no-restricted-imports': ['warn', { paths: [{ name: 'zibri', message: 'Import the shared models from zibri-contract.' }] }]
        }
    },
    {
        files: ['projects/ui/**/*.ts'],
        rules: {
            // attribute selectors keep native elements like button as the host.
            'angular/component-selector': ['warn', { style: 'kebab-case', type: ['element', 'attribute'], prefix: 'ui' }],
            'angular/directive-selector': ['warn', { style: 'camelCase', type: 'attribute', prefix: 'ui' }]
        }
    },
    {
        files: [
            'projects/ngx-auth/**/*.ts',
            'projects/ngx-change-sets/**/*.ts',
            'projects/ngx-ecommerce/**/*.ts',
            'projects/ngx-entity/**/*.ts',
            'projects/ngx-error-handling/**/*.ts',
            'projects/ngx-navigation/**/*.ts',
            'projects/ngx-persistence-logger/**/*.ts',
            'projects/ngx-tracking/**/*.ts',
            'projects/ngx-pwa/**/*.ts'
        ],
        rules: {
            'angular/component-selector': ['warn', { style: 'kebab-case', type: 'element', prefix: 'ngx' }],
            'angular/directive-selector': ['warn', { style: 'camelCase', type: 'attribute', prefix: 'ngx' }]
        }
    },
    {
        // libraries may only use the tokens shared by ui, see projects/ui/lint.css.
        files: ['projects/**/*.ts', 'projects/**/*.html'],
        ignores: ['projects/showcase/**'],
        plugins: {
            'better-tailwindcss': betterTailwindcss
        },
        settings: {
            'better-tailwindcss': {
                entryPoint: 'projects/ui/lint.css',
                selectors: [
                    ...getDefaultSelectors(),
                    {
                        kind: 'callee',
                        name: '^(Component|Directive)$',
                        match: [{ type: 'objectValues', path: String.raw`^host\.class$` }]
                    },
                    {
                        // class lists picked at runtime, like the classes of each variant
                        kind: 'variable',
                        name: '^[A-Z_]+_CLASSES$',
                        match: [{ type: 'strings' }, { type: 'objectValues' }]
                    }
                ]
            }
        },
        rules: {
            'better-tailwindcss/no-unknown-classes': 'warn',
            'better-tailwindcss/no-concatenated-classes': 'warn',
            'better-tailwindcss/enforce-consistent-line-wrapping': ['warn', { printWidth: 140, indent: 4, preferSingleLine: true }],
            'better-tailwindcss/no-restricted-classes': [
                'warn',
                {
                    restrict: [
                        {
                            pattern: String.raw`\[(#|[a-z]+\(|var\()|\(--`,
                            message: 'Arbitrary colors and css variables bypass the shared tokens. Use or add a token in ui instead.'
                        }
                    ]
                }
            ]
        }
    },
    {
        ignores: ['dist', '.angular', '.claude']
    }
];