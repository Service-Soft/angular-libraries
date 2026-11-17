import { faHeart } from '@fortawesome/free-solid-svg-icons';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';

import { CheckListColor } from './check-list-color.type';
import { CheckListItemComponent } from './check-list-item.component';
import { CheckListComponent } from './check-list.component';

const COLORS: CheckListColor[] = ['neutral', 'primary', 'secondary', 'success'];

const meta: Meta<CheckListComponent> = {
    title: 'UI/Check list',
    component: CheckListComponent,
    decorators: [moduleMetadata({ imports: [CheckListItemComponent] })],
    argTypes: {
        color: { control: 'inline-radio', options: COLORS }
    },
    args: {
        color: 'primary'
    },
    render: args => ({
        props: args,
        template: `
            <ui-check-list class="max-w-sm" [color]="color">
                <ui-check-list-item>Every course of every department</ui-check-list-item>
                <ui-check-list-item>The gym, every day from 6 am</ui-check-list-item>
                <ui-check-list-item [included]="false">A personal coach</ui-check-list-item>
                <ui-check-list-item [included]="false">The sauna</ui-check-list-item>
            </ui-check-list>
        `
    })
};
export default meta;

type Story = StoryObj<CheckListComponent>;

export const Playground: Story = {};

// every color, next to an item that is not included, which looks the same in all of them.
export const Colors: Story = {
    render: () => ({
        props: { colors: COLORS },
        template: `
            <div class="grid max-w-3xl gap-6 sm:grid-cols-2">
                @for (color of colors; track color) {
                    <ui-check-list [color]="color">
                        <ui-check-list-item>Included, {{ color }}</ui-check-list-item>
                        <ui-check-list-item [included]="false">Not included</ui-check-list-item>
                    </ui-check-list>
                }
            </div>
        `
    })
};

// an icon list: the icon of the list, or of a single item, replaces the check.
export const Icons: Story = {
    render: () => ({
        props: { heart: faHeart },
        template: `
            <ui-check-list class="max-w-sm" color="secondary" [icon]="heart">
                <ui-check-list-item>Run by its members</ui-check-list-item>
                <ui-check-list-item>Open to everyone</ui-check-list-item>
            </ui-check-list>
        `
    })
};

// on a colored surface, primary and neutral take its on- color.
export const OnColoredSurface: Story = {
    render: () => ({
        template: `
            <div class="surface-primary max-w-sm p-6">
                <ui-check-list>
                    <ui-check-list-item>Every course of every department</ui-check-list-item>
                    <ui-check-list-item [included]="false">A personal coach</ui-check-list-item>
                </ui-check-list>
            </div>
        `
    })
};

// a long item wraps, and its icon stays next to its first line.
export const LongItems: Story = {
    render: () => ({
        template: `
            <ui-check-list class="max-w-xs">
                <ui-check-list-item>An item that is far too long for a single line, so it wraps below its icon</ui-check-list-item>
                <ui-check-list-item [included]="false">Another long item that is not included and wraps as well</ui-check-list-item>
            </ui-check-list>
        `
    })
};