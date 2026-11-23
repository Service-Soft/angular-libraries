import { Meta, StoryObj } from '@storybook/angular';

import { LogoCloudLogo } from './logo-cloud-logo.model';
import { LogoCloudComponent } from './logo-cloud.component';

// logos without a request, in different sizes and aspect ratios, which all show as high as each other.
function createLogo(name: string, width: number, height: number, color: string): LogoCloudLogo {
    const src: string = `data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`
        + `<rect width="${width}" height="${height}" rx="${height / 4}" fill="${color}"/>`
        + '<text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-family="sans-serif" font-weight="700" '
        + `font-size="${height / 2.5}" fill="#ffffff">${name}</text></svg>`
    )}`;
    return { src, alt: name, width, height };
}

const LOGOS: LogoCloudLogo[] = [
    { ...createLogo('Acme', 160, 48, '#0e456f'), href: 'https://example.com/acme' },
    { ...createLogo('Bakery Miller', 300, 60, '#7a3d12'), href: 'https://example.com/bakery' },
    createLogo('Garage', 96, 96, '#2f6f62'),
    { ...createLogo('Smith & Sons', 240, 80, '#5a2d82'), href: 'https://example.com/smith' },
    createLogo('ISO 9001', 120, 120, '#3d5a7a'),
    { ...createLogo('Town hall', 200, 50, '#8a1c1c'), href: 'https://example.com/town', openInNewTab: false }
];

const meta: Meta<LogoCloudComponent> = {
    title: 'UI/Logo cloud',
    component: LogoCloudComponent,
    args: {
        logos: LOGOS
    }
};
export default meta;

type Story = StoryObj<LogoCloudComponent>;

// linked and plain logos of every aspect ratio; the town hall opens in the same tab.
export const Playground: Story = {};

// on a narrow screen the logos wrap into more rows, and one wider than the screen shrinks.
export const Narrow: Story = {
    render: () => ({
        props: { logos: LOGOS },
        template: '<ui-logo-cloud class="max-w-xs" [logos]="logos" />'
    })
};

// gray until the pointer is on a logo or its link has the focus.
export const Grayscale: Story = {
    args: {
        grayscale: true
    }
};

// on the container, like in a section that is set apart.
export const OnContainer: Story = {
    render: () => ({
        props: { logos: LOGOS.slice(0, 4) },
        template: '<div class="bg-surface-container p-8"><ui-logo-cloud [logos]="logos" /></div>'
    })
};