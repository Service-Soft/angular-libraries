import { afterNextRender, Component, computed, DestroyRef, ElementRef, inject, Injector, input, InputSignal, linkedSignal, model, ModelSignal, signal, Signal, WritableSignal } from '@angular/core';
import { EntityClass, EntityProperty, EntityUtilities } from '@service-soft/ngx-entity/entity';
import { ENTITY_FORM_COMPONENT } from '@service-soft/ngx-entity/field-base';
import { TabComponent, TabsComponent } from '@service-soft/ui/tabs';
import { ValidationProblem } from 'zibri-contract';

import { EntityFormChange } from './entity-form-change.model';
import { EntityFormConfig } from './entity-form-config.model';
import { ENTITY_FORM_CONFIG } from './entity-form-config.provider';
import { EntityFormTab } from './entity-form-layout.model';
import { EntityFormMode } from './entity-form-mode.type';
import { EntityFormRowsComponent } from './entity-form-rows.component';
import { EntityFormUtilities } from './entity-form.utilities';

/**
 * The fields of an entity, laid out by the decorators of its class: a grid of 12 columns, with rows and tabs from the
 * positions of the properties. Bind the values two-way with [(value)], and put it inside a ui-form with the button that
 * saves, which only submits while every field is valid. Give it the problems the server answered, which show at their
 * fields until the user changes them. An invalid field on a tab that isn't shown opens its tab when the form is
 * submitted.
 */
@Component({
    selector: 'ngx-entity-form',
    templateUrl: './entity-form.component.html',
    imports: [TabsComponent, TabComponent, EntityFormRowsComponent],
    // a field that shows the fields of an object in a dialog, like an item of an array, gets the form from here: an
    // import of the form would be a cycle of entry points. A factory, since the class isn't defined yet.
    providers: [{ provide: ENTITY_FORM_COMPONENT, useFactory: () => EntityFormComponent }],
    host: { class: 'block' }
})
export class EntityFormComponent<T extends object> {
    private readonly config: EntityFormConfig = inject(ENTITY_FORM_CONFIG);

    private readonly injector: Injector = inject(Injector);

    // whether the first invalid field of the current submit was handled already.
    private handlingInvalid: boolean = false;

    /**
     * The class of the entity.
     */
    readonly entity: InputSignal<EntityClass<T>> = input.required<EntityClass<T>>();

    /**
     * Whether the form creates an entity or edits one, which decides the fields it leaves out.
     */
    readonly mode: InputSignal<EntityFormMode> = input<EntityFormMode>('create');

    /**
     * The problems of the values the server refused, like the problems of zibri's error response.
     */
    readonly problems: InputSignal<ValidationProblem[]> = input<ValidationProblem[]>([]);

    /**
     * The values. The user changes them, bind them with [(value)].
     */
    readonly value: ModelSignal<Partial<T>> = model.required<Partial<T>>();

    /**
     * The tabs of the form, with their rows and fields.
     */
    protected readonly tabs: Signal<EntityFormTab<T>[]> = computed(() => {
        const properties: EntityProperty<T>[] = EntityUtilities.resolveProperties(this.entity());
        return EntityFormUtilities.resolveTabs(properties, this.mode(), this.value(), this.config.tabLabel);
    });

    /**
     * The value of the tab that shows, undefined for the first.
     */
    protected readonly selectedTab: WritableSignal<string | undefined> = signal(undefined);

    /**
     * The problems that still show, until the user changes their value.
     */
    private readonly openProblems: WritableSignal<ValidationProblem[]> = linkedSignal(() => this.problems());

    /**
     * The message of the problem of each property, by its key.
     */
    protected readonly problemMessages: Signal<Partial<Record<string, string>>> = computed(() => {
        return Object.fromEntries(this.openProblems().map(problem => [problem.key, problem.message]));
    });

    constructor() {
        const element: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
        // invalid doesn't bubble, so it can only be seen while capturing.
        const openTab: (event: Event) => void = event => this.openTabOfInvalid(event);
        element.addEventListener('invalid', openTab, { capture: true });
        inject(DestroyRef).onDestroy(() => element.removeEventListener('invalid', openTab, { capture: true }));
    }

    /**
     * Gets the value of a tab.
     * @param tab - The tab.
     * @returns Its value.
     */
    protected getTabValue(tab: EntityFormTab<T>): string {
        return `tab-${tab.tab}`;
    }

    /**
     * Takes a value the user changed, and drops the problem of its property.
     * @param change - The property and its new value.
     */
    protected change(change: EntityFormChange): void {
        // an optional object the user emptied again is sent as missing, not as an object without its required values.
        const values: Partial<T> = EntityUtilities.resolveWithValueAtPath(this.value(), change.key, change.value);
        this.value.set(EntityUtilities.resolveWithoutEmptyObjects(this.entity(), values));
        this.openProblems.update(problems => problems.filter(problem => problem.key !== change.key));
    }

    // the browser can't focus an invalid field on a hidden tab, so ui-form's focus doesn't reach it: the first one of a
    // submit opens its tab and gets focus once it shows.
    private openTabOfInvalid(event: Event): void {
        const target: EventTarget | null = event.target;
        if (this.handlingInvalid || !(target instanceof HTMLElement)) {
            return;
        }
        // the browser fires invalid for every invalid field of a submit at once, in the order of the page: only the
        // first decides. Not a microtask, which the browser runs between them.
        this.handlingInvalid = true;
        setTimeout(() => this.handlingInvalid = false);
        const tab: string | undefined = target.closest<HTMLElement>('[data-entity-form-tab]')?.dataset['entityFormTab'];
        const firstTab: EntityFormTab<T> | undefined = this.tabs()[0];
        const shownTab: string | undefined = this.selectedTab() ?? (firstTab == undefined ? undefined : this.getTabValue(firstTab));
        if (tab == undefined || tab === shownTab) {
            return;
        }
        this.selectedTab.set(tab);
        afterNextRender(() => target.focus(), { injector: this.injector });
    }
}