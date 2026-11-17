import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { BreadcrumbComponent } from './breadcrumb.component';
import { provideBreadcrumbsConfig } from './breadcrumbs-config.provider';
import { BreadcrumbsComponent } from './breadcrumbs.component';

@Component({
    selector: 'ui-breadcrumbs-host',
    template: `<ui-breadcrumbs>
        <ui-breadcrumb><a href="/orders">Orders</a></ui-breadcrumb><ui-breadcrumb><span aria-current="page">Order 1001</span></ui-breadcrumb>
    </ui-breadcrumbs>`,
    imports: [BreadcrumbsComponent, BreadcrumbComponent]
})
class BreadcrumbsHostComponent {}

describe('BreadcrumbsComponent', () => {
    test('is a navigation with a list of the steps, which keep the content they were given', async () => {
        TestBed.configureTestingModule({ providers: [provideBreadcrumbsConfig({ label: 'You are here' })] });
        const fixture: ComponentFixture<BreadcrumbsHostComponent> = TestBed.createComponent(BreadcrumbsHostComponent);
        await fixture.whenStable();
        const root: HTMLElement = fixture.nativeElement as HTMLElement;

        expect(root.querySelector('nav')?.getAttribute('aria-label')).toBe('You are here');
        const steps: HTMLElement[] = [...root.querySelectorAll<HTMLElement>('ol > ui-breadcrumb')];
        expect(steps.map(step => step.getAttribute('role'))).toEqual(['listitem', 'listitem']);
        expect(steps.map(step => step.textContent.trim())).toEqual(['Orders', 'Order 1001']);
        expect(steps[0]?.querySelector('a')?.getAttribute('href')).toBe('/orders');
        // the arrows are decorative
        expect(steps[1]?.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    });
});