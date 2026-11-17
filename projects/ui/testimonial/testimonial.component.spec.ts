import { Component, signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, test } from 'vitest';

import { provideTestimonialConfig } from './testimonial-config.provider';
import { TestimonialComponent } from './testimonial.component';

@Component({
    selector: 'ui-testimonial-host',
    template: `
        <ui-testimonial name="Ada Lovelace" [subtitle]="subtitle()" [rating]="rating()">
            <p>A great club with great coaches.</p>
        </ui-testimonial>
    `,
    imports: [TestimonialComponent]
})
class TestimonialHostComponent {
    readonly subtitle: WritableSignal<string | undefined> = signal('Member since 2019');

    readonly rating: WritableSignal<number | undefined> = signal(4.5);
}

@Component({
    selector: 'ui-quote-testimonial-host',
    template: `
        <ui-testimonial variant="quote" name="Dr. Ada Lovelace" subtitle="Dentist" [avatar]="avatar()"><p>We take the time it takes.</p>
            <p>Every patient is different.</p></ui-testimonial>
    `,
    imports: [TestimonialComponent]
})
class QuoteTestimonialHostComponent {
    readonly avatar: WritableSignal<string | undefined> = signal('/team/ada.jpg');
}

// the name and the subtitle next to the avatar.
function getCaption(root: HTMLElement): string[] {
    return [...root.querySelectorAll('figcaption > span > span')].map(line => line.textContent.trim());
}

async function render(): Promise<[ComponentFixture<TestimonialHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<TestimonialHostComponent> = TestBed.createComponent(TestimonialHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

async function renderQuote(): Promise<[ComponentFixture<QuoteTestimonialHostComponent>, HTMLElement]> {
    const fixture: ComponentFixture<QuoteTestimonialHostComponent> = TestBed.createComponent(QuoteTestimonialHostComponent);
    await fixture.whenStable();
    return [fixture, fixture.nativeElement as HTMLElement];
}

describe('TestimonialComponent', () => {
    test('is a figure of the quote and the person who said it, with the rating they gave', async () => {
        const [, root] = await render();
        const figure: HTMLElement | null = root.querySelector('ui-card figure');

        expect(figure?.querySelector('blockquote')?.textContent.trim()).toBe('A great club with great coaches.');
        expect(getCaption(root)).toEqual(['Ada Lovelace', 'Member since 2019']);
        // the name is read next to it already
        expect(figure?.querySelector('figcaption ui-avatar > span')?.getAttribute('aria-hidden')).toBe('true');
        expect(figure?.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('4.5 out of 5 stars');
    });

    test('shows no stars without a rating, and only the name without a subtitle', async () => {
        const [fixture, root] = await render();
        fixture.componentInstance.rating.set(undefined);
        fixture.componentInstance.subtitle.set(undefined);
        await fixture.whenStable();

        expect(root.querySelector('ui-rating')).toBeNull();
        expect(getCaption(root)).toEqual(['Ada Lovelace']);
    });

    test('as a quote, is a figure of the quote, the person and a portrait of them, without a card', async () => {
        const [, root] = await renderQuote();
        const figure: HTMLElement | null = root.querySelector('ui-testimonial figure');

        expect(root.querySelector('ui-card')).toBeNull();
        expect([...figure?.querySelectorAll('blockquote p') ?? []].map(paragraph => paragraph.textContent))
            .toEqual(['We take the time it takes.', 'Every patient is different.']);
        expect([...figure?.querySelectorAll('figcaption > span') ?? []].map(line => line.textContent.trim())).toEqual(['Dr. Ada Lovelace', 'Dentist']);
        // the portrait is decorative, the caption names the person
        expect(figure?.querySelector('img')?.getAttribute('src')).toBe('/team/ada.jpg');
        expect(figure?.querySelector('img')?.getAttribute('alt')).toBe('');
        expect(root.querySelector('ui-testimonial')?.classList).toContain('@container');
    });

    test('as a quote without a picture, has no portrait and no initials', async () => {
        const [fixture, root] = await renderQuote();
        fixture.componentInstance.avatar.set(undefined);
        await fixture.whenStable();

        expect(root.querySelector('img')).toBeNull();
        expect(root.querySelector('ui-avatar')).toBeNull();
        expect(root.querySelector('blockquote')?.textContent).toContain('We take the time it takes.');
    });

    test('takes the variant the app provides', async () => {
        TestBed.configureTestingModule({ providers: [provideTestimonialConfig({ variant: 'quote' })] });
        const [, root] = await render();

        expect(root.querySelector('ui-card')).toBeNull();
        expect(root.querySelector('blockquote')?.classList).toContain('text-title');
        // the rating shows in a quote as well
        expect(root.querySelector('[role="img"]')?.getAttribute('aria-label')).toBe('4.5 out of 5 stars');
    });
});