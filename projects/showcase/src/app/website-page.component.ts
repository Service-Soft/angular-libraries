import { Component } from '@angular/core';
import { AddressComponent, PostalAddress } from '@service-soft/ui/address';
import { ConsentGateComponent } from '@service-soft/ui/consent-gate';
import { DatePeriodComponent } from '@service-soft/ui/date-period';
import { FaqComponent, FaqItemComponent } from '@service-soft/ui/faq';
import { FootnoteComponent, FootnotesComponent } from '@service-soft/ui/footnotes';
import { HeadingComponent } from '@service-soft/ui/heading';
import { IframeComponent } from '@service-soft/ui/iframe';
import { OpeningHoursComponent, OpeningHoursDay } from '@service-soft/ui/opening-hours';
import { RichTextComponent } from '@service-soft/ui/rich-text';
import { SectionComponent } from '@service-soft/ui/section';
import { StatComponent } from '@service-soft/ui/stat';
import { TableOfContentsComponent, TableOfContentsItem } from '@service-soft/ui/table-of-contents';

// a post like a cms delivers it, with a script that the sanitizer has to remove, on the server as well.
const POST_HTML: string = `
<h2>Summer party</h2>
<p>The whole club celebrates the end of the season.</p>
<ul><li>Barbecue</li><li>Football for children</li></ul>
<script>document.body.dataset['injected'] = 'true';</script>
`;

const WEEK: OpeningHoursDay[] = [
    { weekday: 1, ranges: [{ opens: '08:00', closes: '12:00' }, { opens: '14:00', closes: '18:00' }] },
    { weekday: 3, ranges: [{ opens: '08:00', closes: '12:00' }] },
    { weekday: 5, ranges: [{ opens: '08:00', closes: '13:00' }], note: 'Only by appointment' }
];

const ADDRESS: PostalAddress = { street: 'Main Street 1', postalCode: '50999', city: 'Cologne', country: 'Germany' };

const CONTENTS: TableOfContentsItem[] = [
    { name: 'News', fragment: 'news', children: [{ name: 'Summer party', fragment: 'summer-party' }] },
    { name: 'Practice', fragment: 'practice' },
    { name: 'Questions', fragment: 'questions' }
];

/**
 * A page of a website, with the components whose content search engines read, built ahead of time from fixed data.
 */
@Component({
    selector: 'app-website-page',
    templateUrl: './website-page.component.html',
    imports: [
        AddressComponent,
        ConsentGateComponent,
        DatePeriodComponent,
        FaqComponent,
        FaqItemComponent,
        FootnoteComponent,
        FootnotesComponent,
        HeadingComponent,
        IframeComponent,
        OpeningHoursComponent,
        RichTextComponent,
        SectionComponent,
        StatComponent,
        TableOfContentsComponent
    ]
})
export class WebsitePageComponent {
    protected readonly post: string = POST_HTML;

    protected readonly week: OpeningHoursDay[] = WEEK;

    protected readonly address: PostalAddress = ADDRESS;

    protected readonly contents: TableOfContentsItem[] = CONTENTS;
}