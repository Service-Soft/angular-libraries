import { afterNextRender, Component, inject, input, InputSignal } from '@angular/core';
import { provideRouter, Router, Routes, withHashLocation } from '@angular/router';
import { NavLink } from '@service-soft/ngx-navigation/navigation';
import { applicationConfig, Meta, StoryObj } from '@storybook/angular';

import { SecondaryNavComponent } from './secondary-nav.component';

@Component({ selector: 'ngx-story-page', template: '' })
class StoryPageComponent {}

// every link of the stories leads somewhere, so following one ends in a navigation like in an app.
const ROUTES: Routes = [{ path: '**', component: StoryPageComponent }];

const LINKS: NavLink[] = [
    { type: 'link', name: 'Start', route: 'football' },
    { type: 'link', name: 'Training', route: 'football/training' },
    { type: 'link', name: 'Teams', route: 'football/teams' },
    { type: 'link', name: 'Match schedule', route: 'football/matches' },
    { type: 'link', name: 'News', route: 'football/news' },
    { type: 'link', name: 'Contact persons', route: 'football/contact' },
    { type: 'link', name: 'Association', url: 'https://example.com/football', openInNewTab: true }
];

// opens a page of the section once the links are there.
@Component({
    selector: 'ngx-secondary-nav-story',
    template: '<ngx-secondary-nav label="Football" [links]="links" />',
    imports: [SecondaryNavComponent]
})
class SecondaryNavStoryComponent {
    readonly url: InputSignal<string> = input.required<string>();

    protected readonly links: NavLink[] = LINKS;

    constructor() {
        const router: Router = inject(Router);
        afterNextRender(() => void router.navigateByUrl(this.url()));
    }
}

const meta: Meta<SecondaryNavComponent> = {
    title: 'Navigation/Secondary nav',
    component: SecondaryNavComponent,
    // the hash keeps the router off the path of the iframe storybook renders in.
    decorators: [applicationConfig({ providers: [provideRouter(ROUTES, withHashLocation())] })]
};
export default meta;

type Story = StoryObj<SecondaryNavComponent>;

export const Default: Story = {
    render: () => ({
        template: '<ngx-secondary-nav-story url="/football/training" />',
        moduleMetadata: { imports: [SecondaryNavStoryComponent] }
    })
};

// narrower than its pills, like on a phone: the row scrolls sideways, with the current page scrolled into view.
export const Narrow: Story = {
    render: () => ({
        template: '<div class="max-w-80"><ngx-secondary-nav-story url="/football/news" /></div>',
        moduleMetadata: { imports: [SecondaryNavStoryComponent] }
    })
};

// on a colored surface, like a header in the primary color.
export const OnColor: Story = {
    render: () => ({
        template: '<div class="surface-primary p-4"><div><ngx-secondary-nav-story url="/football/teams" /></div></div>',
        moduleMetadata: { imports: [SecondaryNavStoryComponent] }
    })
};