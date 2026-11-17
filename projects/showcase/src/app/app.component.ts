import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ChangeSetsComponent } from '@service-soft/ngx-change-sets/change-sets';
import { NavElementComponents } from '@service-soft/ngx-navigation/nav-element';
import { NavLinkComponent } from '@service-soft/ngx-navigation/nav-link';
import { NavTitleComponent } from '@service-soft/ngx-navigation/nav-title';
import { NavbarComponent } from '@service-soft/ngx-navigation/navbar';
import { NavbarRow } from '@service-soft/ngx-navigation/navigation';
import { ChangeSetEntity, ChangeSetType } from 'zibri-contract';

import { OrderChangeSetService } from './order-change-set.service';

const NAVBAR_ROWS: NavbarRow[] = [
    {
        elements: [
            { type: 'title', title: 'Showcase', link: { route: '' }, collapse: 'never' },
            { type: 'link', name: 'Orders', route: 'orders' },
            { type: 'link', name: 'Projects', route: 'projects' },
            { type: 'link', name: 'Documentation', url: 'https://github.com/Service-Soft/angular-libraries', position: 'end' }
        ]
    }
];

const ORDER: ChangeSetEntity = {
    id: 'order-1',
    changeSets: [
        {
            id: '1',
            type: ChangeSetType.CREATE,
            // 2026-10-01 09:00 UTC, in nanoseconds like the backend sends it
            createdAt: '1790845200000000000',
            createdBy: 'Jane Doe',
            changeSetEntityId: 'order-1',
            changes: [{ id: '1-0', changeSetId: '1', key: 'total', newValue: 120.5 }]
        },
        {
            id: '2',
            type: ChangeSetType.UPDATE,
            // 2026-10-03 14:30 UTC
            createdAt: '1791037800000000000',
            changeSetEntityId: 'order-1',
            changes: [{ id: '2-0', changeSetId: '2', key: 'total', previousValue: 120.5, newValue: 99.9 }]
        }
    ]
};

/**
 * The root component of the showcase.
 */
@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    imports: [ChangeSetsComponent, NavbarComponent, RouterOutlet]
})
export class AppComponent {
    protected readonly changeSetService: OrderChangeSetService = inject(OrderChangeSetService);

    protected readonly order: ChangeSetEntity = ORDER;

    protected readonly navbarRows: NavbarRow[] = NAVBAR_ROWS;

    protected readonly navComponents: Partial<NavElementComponents> = { title: NavTitleComponent, link: NavLinkComponent };
}