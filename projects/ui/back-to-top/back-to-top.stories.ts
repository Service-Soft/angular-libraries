import { afterNextRender, Component, DOCUMENT, inject, input, InputSignal } from '@angular/core';
import { LinkComponent } from '@service-soft/ui/link';
import { Meta, StoryObj } from '@storybook/angular';

import { BackToTopComponent } from './back-to-top.component';

// a page long enough to scroll, with a link at its start, where the focus goes back to.
@Component({
    selector: 'ui-long-page',
    templateUrl: './back-to-top.stories.html',
    imports: [BackToTopComponent, LinkComponent]
})
class LongPageComponent {
    private readonly document: Document = inject(DOCUMENT);

    // shows the story scrolled down, with the button showing.
    readonly scrolled: InputSignal<boolean> = input(false);

    readonly sections: number[] = Array.from({ length: 20 }, (_, index) => index + 1);

    constructor() {
        afterNextRender(() => {
            if (this.scrolled()) {
                this.document.defaultView?.scrollTo({ top: this.document.body.scrollHeight, behavior: 'instant' });
            }
        });
    }
}

const meta: Meta<BackToTopComponent> = {
    title: 'UI/Back to top',
    component: BackToTopComponent
};
export default meta;

type Story = StoryObj<BackToTopComponent>;

// the button shows once the page is scrolled further than the height of the screen.
export const Default: Story = {
    render: () => ({ template: '<ui-long-page />', moduleMetadata: { imports: [LongPageComponent] } })
};

export const Scrolled: Story = {
    render: () => ({ template: '<ui-long-page [scrolled]="true" />', moduleMetadata: { imports: [LongPageComponent] } })
};