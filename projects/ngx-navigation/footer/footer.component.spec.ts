import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavLinkComponent } from '@service-soft/ngx-navigation/nav-link';
import { NavTextComponent } from '@service-soft/ngx-navigation/nav-text';
import { FooterRow } from '@service-soft/ngx-navigation/navigation';
import { ErrorHandlerTestingUtilities } from 'testing/error-handler';
import { describe, expect, test } from 'vitest';

import { FooterComponent } from './footer.component';

const ROWS: FooterRow[] = [
    {
        elements: [
            { type: 'text', text: '© Service Soft' },
            { type: 'link', name: 'Imprint', route: 'imprint', position: 'end' },
            { type: 'link', name: 'Privacy', route: 'privacy', position: 'end' },
            { type: 'text', text: 'Hidden', position: 'center', condition: () => false }
        ]
    },
    { elements: [{ type: 'link', name: 'Status', url: 'https://status.example.com', position: 'center' }] }
];

describe('FooterComponent', () => {
    test('places the elements whose condition holds at the start, in the center and at the end of their rows', async () => {
        TestBed.configureTestingModule({ providers: [provideRouter([])] });
        const fixture: ComponentFixture<FooterComponent> = TestBed.createComponent(FooterComponent);
        fixture.componentRef.setInput('rows', ROWS);
        fixture.componentRef.setInput('components', { text: NavTextComponent, link: NavLinkComponent });
        await fixture.whenStable();
        const rows: Element[] = [...(fixture.nativeElement as HTMLElement).querySelectorAll('footer > ngx-nav-row')];

        expect(rows.map(row => [...row.children].map(group => group.textContent.replaceAll(/\s+/g, ' ').trim()))).toEqual([
            ['© Service Soft', '', 'Imprint Privacy'],
            ['', 'Status', '']
        ]);
    });

    test('throws in development builds for a type without a component', async () => {
        // the error handler of the app gets it first, whose default would log it
        const errors: unknown[] = [];
        TestBed.configureTestingModule({ providers: [provideRouter([]), ErrorHandlerTestingUtilities.provideErrorList(errors)] });
        const fixture: ComponentFixture<FooterComponent> = TestBed.createComponent(FooterComponent);
        fixture.componentRef.setInput('rows', ROWS);
        fixture.componentRef.setInput('components', { link: NavLinkComponent });

        await expect(fixture.whenStable()).rejects.toThrow('The footer needs a component for "text"');
        expect(errors).toHaveLength(1);
    });
});