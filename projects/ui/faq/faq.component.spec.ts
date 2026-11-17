import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideFaqConfig } from './faq-config.provider';
import { FaqItemComponent } from './faq-item.component';
import { FaqComponent } from './faq.component';

@Component({
    selector: 'ui-faq-host',
    template: `
        <ui-faq [microdata]="microdata()"><ui-faq-item question="How much is a membership?" [(open)]="open"><p>From 15 € a month.</p>
            <p>Children pay half.</p></ui-faq-item><ui-faq-item question="Can I try it?"><p>For two weeks, for free.</p></ui-faq-item></ui-faq>
    `,
    imports: [FaqComponent, FaqItemComponent]
})
class FaqHostComponent {
    readonly microdata: WritableSignal<boolean> = signal(true);

    readonly open: WritableSignal<boolean> = signal(true);
}

@Component({
    selector: 'ui-default-faq-host',
    template: '<ui-faq><ui-faq-item question="Can I try it?"><p>For two weeks.</p></ui-faq-item></ui-faq>',
    imports: [FaqComponent, FaqItemComponent]
})
class DefaultFaqHostComponent {}

@Component({
    selector: 'ui-exclusive-faq-host',
    template: `
        <ui-faq exclusive><ui-faq-item question="One?"><p>1</p></ui-faq-item><ui-faq-item question="Two?"><p>2</p></ui-faq-item></ui-faq>
        <ui-faq exclusive><ui-faq-item question="Three?"><p>3</p></ui-faq-item></ui-faq>
    `,
    imports: [FaqComponent, FaqItemComponent]
})
class ExclusiveFaqHostComponent {}

async function render<T>(component: new () => T): Promise<[ComponentFixture<T>, HTMLElement]> {
    const fixture: ComponentFixture<T> = TestBed.createComponent(component);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

/**
 * A thing of schema.org as search engines read it from microdata.
 */
type MicrodataItem = {
    type: string | null,
    properties: Record<string, string | MicrodataItem>
};

// reads the microdata the way search engines do: an itemscope is a thing of its itemtype, an itemprop inside of it
// is a property of the nearest thing around it, its text or, with its own itemscope, a thing of its own.
function readMicrodata(scope: Element): MicrodataItem {
    const properties: Record<string, string | MicrodataItem> = {};
    for (const property of scope.querySelectorAll('[itemprop]')) {
        if (property.parentElement?.closest('[itemscope]') !== scope) {
            continue;
        }
        const name: string = property.getAttribute('itemprop') ?? '';
        properties[name] = property.hasAttribute('itemscope') ? readMicrodata(property) : property.textContent.trim();
    }
    return { type: scope.getAttribute('itemtype'), properties };
}

describe('FaqComponent', () => {
    test('is an FAQPage of schema.org, whose questions hold their accepted answer, read from the content', async () => {
        const [, root] = await render(FaqHostComponent);
        const page: Element | null = root.querySelector('ui-faq > [itemscope]');
        const questions: Element[] = [...root.querySelectorAll('[itemprop="mainEntity"]')];

        expect(page?.getAttribute('itemtype')).toBe('https://schema.org/FAQPage');
        expect(questions.map(question => readMicrodata(question))).toEqual([
            {
                type: 'https://schema.org/Question',
                properties: {
                    name: 'How much is a membership?',
                    acceptedAnswer: { type: 'https://schema.org/Answer', properties: { text: 'From 15 € a month.Children pay half.' } }
                }
            },
            {
                type: 'https://schema.org/Question',
                properties: {
                    name: 'Can I try it?',
                    acceptedAnswer: { type: 'https://schema.org/Answer', properties: { text: 'For two weeks, for free.' } }
                }
            }
        ]);
        expect(questions.every(question => question.parentElement?.closest('[itemscope]') === page)).toBe(true);
    });

    test('opens a question to its answer, bound two-way, on a plain details section', async () => {
        const [fixture, root] = await render(FaqHostComponent);
        const [first, second] = [...root.querySelectorAll('details')];

        expect(first.open).toBe(true);
        expect(second.open).toBe(false);
        expect(first.querySelector('summary')?.textContent).toContain('How much is a membership?');
        expect(first.classList).toContain('border-b');

        fixture.componentInstance.open.set(false);
        await fixture.whenStable();
        expect(first.open).toBe(false);
    });

    test('an exclusive list gives its questions one name, which makes the browser keep only one of them open', async () => {
        const [, root] = await render(ExclusiveFaqHostComponent);
        const [one, two, three] = [...root.querySelectorAll('details')].map(details => details.getAttribute('name'));

        expect(one).toBeTruthy();
        expect(two).toBe(one);
        // another list on the same page doesn't close the questions of this one
        expect(three).toBeTruthy();
        expect(three).not.toBe(one);

        const [, other] = await render(FaqHostComponent);
        expect([...other.querySelectorAll('details')].some(details => details.hasAttribute('name'))).toBe(false);
    });

    test('leaves the microdata out when it is turned off', async () => {
        const [fixture, root] = await render(FaqHostComponent);
        fixture.componentInstance.microdata.set(false);
        await fixture.whenStable();

        expect(root.querySelectorAll('[itemscope], [itemprop], [itemtype]').length).toBe(0);
        expect(root.textContent).toContain('From 15 € a month.');
    });

    test('takes the variant, whether there is microdata and whether it is exclusive from the app', async () => {
        TestBed.configureTestingModule({ providers: [provideFaqConfig({ variant: 'outlined', microdata: false, exclusive: true })] });
        const [, root] = await render(DefaultFaqHostComponent);

        expect(root.querySelector('details')?.getAttribute('name')).toMatch(/^ui-faq-\d+$/);
        expect(root.querySelectorAll('[itemscope]').length).toBe(0);
        expect(root.querySelector('details')?.classList).toContain('rounded-details');
        expect(root.querySelector('ui-faq > div')?.classList).toContain('gap-2');
    });
});