import { afterRenderEffect, ApplicationRef, booleanAttribute, ComponentRef, createComponent, DestroyRef, Directive, DOCUMENT, ElementRef, EnvironmentInjector, inject, Injector, input, InputSignal, InputSignalWithTransform } from '@angular/core';
import { SpinnerSize } from '@service-soft/ui/spinner';

import { LoadingConfig } from './loading-config.model';
import { LOADING_CONFIG } from './loading-config.provider';
import { LoadingOverlayComponent } from './loading-overlay.component';

/**
 * Marks an area of the page as loading, like a table, a card or a list: `<ui-card [uiLoading]="loading()">`. While it
 * loads, a spinner shows in its middle over the scrim of the theme, what is inside of it can't be clicked, focused or
 * read, and screen readers learn that it is busy. The rest of the page stays usable. The spinner only turns without
 * prefers-reduced-motion. Put it on an element that can hold a div, like a card or a ui-table, not on a native table.
 * Unset inputs fall back to the values provided with provideLoadingConfig.
 */
@Directive({
    selector: '[uiLoading]',
    host: {
        // also on the server, so a page rendered while it loads says so before it is hydrated
        '[attr.aria-busy]': 'uiLoading() ? "true" : null'
    }
})
export class LoadingDirective {
    private readonly config: LoadingConfig = inject(LOADING_CONFIG);

    private readonly element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

    private readonly environmentInjector: EnvironmentInjector = inject(EnvironmentInjector);

    private readonly injector: Injector = inject(Injector);

    private readonly applicationRef: ApplicationRef = inject(ApplicationRef);

    private readonly document: Document = inject(DOCUMENT);

    private overlay: ComponentRef<LoadingOverlayComponent> | undefined;

    private overlayElement: HTMLElement | undefined;

    // the elements this made inert, which it gives back as they were, unlike the ones the app made inert itself.
    private inertElements: Element[] = [];

    // whether this positioned the area, to place the overlay over it, and has to undo it.
    private positioned: boolean = false;

    /**
     * Whether the area loads.
     */
    readonly uiLoading: InputSignalWithTransform<boolean, unknown> = input(false, { transform: booleanAttribute });

    /**
     * What screen readers read for the spinner, like 'Loading orders'. The default comes from provideLoadingConfig.
     */
    readonly loadingLabel: InputSignal<string> = input<string>(this.config.label);

    /**
     * How large the spinner is. The default comes from provideLoadingConfig.
     */
    readonly loadingSize: InputSignal<SpinnerSize> = input<SpinnerSize>(this.config.size);

    constructor() {
        // only in the browser, after a render, where the content of the area exists: the server has no overlay to show
        // and no focus to keep out.
        afterRenderEffect({
            write: () => {
                if (this.uiLoading()) {
                    this.show(this.loadingLabel(), this.loadingSize());
                }
                else {
                    this.hide();
                }
            }
        });
        inject(DestroyRef).onDestroy(() => this.hide());
    }

    private show(label: string, size: SpinnerSize): void {
        if (this.overlay == undefined) {
            // an element of its own as host, which is known to be one, unlike the location of a created component
            this.overlayElement = this.document.createElement('ui-loading-overlay');
            this.overlay = createComponent(LoadingOverlayComponent, {
                environmentInjector: this.environmentInjector,
                elementInjector: this.injector,
                hostElement: this.overlayElement
            });
            this.applicationRef.attachView(this.overlay.hostView);
            // inert rather than a block over the area alone, which would leave the keyboard inside it. Only what is
            // inside, so the spinner stays readable for screen readers.
            this.inertElements = [...this.element.children].filter(child => !child.hasAttribute('inert'));
            for (const child of this.inertElements) {
                child.setAttribute('inert', '');
            }
            // the overlay is absolute: an area that isn't positioned would place it over its parent instead. One that is,
            // like a sticky one, keeps its position.
            this.positioned = getComputedStyle(this.element).position === 'static';
            if (this.positioned) {
                this.element.style.position = 'relative';
            }
            this.element.append(this.overlayElement);
        }
        this.overlay.setInput('label', label);
        this.overlay.setInput('size', size);
    }

    private hide(): void {
        if (this.overlay == undefined) {
            return;
        }
        for (const child of this.inertElements) {
            child.removeAttribute('inert');
        }
        this.inertElements = [];
        if (this.positioned) {
            this.element.style.removeProperty('position');
            this.positioned = false;
        }
        this.overlayElement?.remove();
        this.overlayElement = undefined;
        this.overlay.destroy();
        this.overlay = undefined;
    }
}