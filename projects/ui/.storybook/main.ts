import { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
    // one storybook for every library, so AXE checks all of them. Libraries built on ui render from its sources.
    stories: [
        '../**/*.stories.ts',
        '../../ngx-change-sets/**/*.stories.ts',
        '../../ngx-persistence-logger/**/*.stories.ts',
        '../../ngx-tracking/**/*.stories.ts',
        '../../ngx-pwa/**/*.stories.ts',
        '../../ngx-auth/**/*.stories.ts',
        '../../ngx-error-handling/**/*.stories.ts',
        '../../ngx-navigation/**/*.stories.ts',
        '../../ngx-entity/**/*.stories.ts',
        '../../ngx-ecommerce/**/*.stories.ts'
    ],
    // files the stories show, like the logo of the navigation.
    staticDirs: ['./public'],
    addons: ['@storybook/addon-a11y'],
    framework: {
        name: '@storybook/angular',
        options: {}
    }
};
export default config;