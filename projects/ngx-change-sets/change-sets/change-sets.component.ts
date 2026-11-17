import { formatDate } from '@angular/common';
import { afterNextRender, booleanAttribute, Component, computed, inject, Injector, input, InputSignal, InputSignalWithTransform, linkedSignal, LOCALE_ID, model, ModelSignal, resource, ResourceRef, Signal, viewChildren, WritableSignal } from '@angular/core';
import { faArrowRotateLeft, faCircleLeft, faCircleMinus, faCirclePlus, faCircleUp, faClock, faClockRotateLeft, faUser } from '@fortawesome/free-solid-svg-icons';
import { ButtonComponent } from '@service-soft/ui/button';
import { DetailsComponent, SummaryComponent } from '@service-soft/ui/details';
import { ConfirmDialogComponent, ConfirmDialogData, DialogService } from '@service-soft/ui/dialog';
import { IconComponent, IconDefinition } from '@service-soft/ui/icon';
import { LinkComponent } from '@service-soft/ui/link';
import { MenuComponent, MenuItemComponent, MenuTriggerDirective } from '@service-soft/ui/menu';
import { ChangeSet, ChangeSetEntity, ChangeSetType } from 'zibri-contract';

import { ChangeSetTimeUtilities } from './change-set-time.utilities';
import { ChangeSetView } from './change-set-view.model';
import { ChangeSetService } from './change-set.service';
import { ChangeSetsConfig, ChangeSetsLabels } from './change-sets-config.model';
import { CHANGE_SETS_CONFIG } from './change-sets-config.provider';
import { ChangeValueUtilities } from './change-value.utilities';
import { ChangesTableComponent } from './changes-table.component';

const TYPE_LABEL_CLASSES: string = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-label';

// filled labels: the -on tokens on their colors are checked pairs, unlike warning or success as text on the surface.
// The label says the type as well, so color is never the only cue.
const TYPE_CLASSES: Record<ChangeSetType, string> = {
    [ChangeSetType.CREATE]: 'bg-success text-on-success',
    [ChangeSetType.REPLACE]: 'bg-primary text-on-primary',
    [ChangeSetType.RESET]: 'bg-warning text-on-warning',
    [ChangeSetType.UPDATE]: 'bg-primary text-on-primary',
    [ChangeSetType.DELETE]: 'bg-error text-on-error',
    [ChangeSetType.RESTORE]: 'bg-secondary text-on-secondary'
};

const TYPE_ICONS: Record<ChangeSetType, IconDefinition> = {
    [ChangeSetType.CREATE]: faCirclePlus,
    [ChangeSetType.REPLACE]: faCircleUp,
    [ChangeSetType.RESET]: faCircleLeft,
    [ChangeSetType.UPDATE]: faCircleUp,
    [ChangeSetType.DELETE]: faCircleMinus,
    [ChangeSetType.RESTORE]: faClockRotateLeft
};

/**
 * The icons the template shows next to text.
 */
type ChangeSetsIcons = Record<'clock' | 'user' | 'reset', IconDefinition>;

/**
 * Shows the change sets of an entity as its history, newest first: what happened, when and by whom, and the values
 * that changed. The user can undo a single change set, or roll back to the state after one, after confirming it.
 * Bind the entity two-way with [(entity)] to get it back after undoing. Needs a ChangeSetService, provided with
 * provideChangeSetService. Unset inputs fall back to the values provided with provideChangeSetsConfig.
 */
@Component({
    selector: 'ngx-change-sets',
    templateUrl: './change-sets.component.html',
    imports: [
        ButtonComponent,
        ChangesTableComponent,
        DetailsComponent,
        IconComponent,
        LinkComponent,
        MenuComponent,
        MenuItemComponent,
        MenuTriggerDirective,
        SummaryComponent
    ],
    host: {
        class: 'grid gap-2'
    }
})
export class ChangeSetsComponent {
    private readonly config: ChangeSetsConfig = inject(CHANGE_SETS_CONFIG);
    private readonly changeSetService: ChangeSetService = inject(ChangeSetService);
    private readonly dialogService: DialogService = inject(DialogService);
    private readonly locale: string = inject(LOCALE_ID);
    private readonly injector: Injector = inject(Injector);

    private readonly sections: Signal<readonly DetailsComponent[]> = viewChildren(DetailsComponent);

    /**
     * The entity whose change sets are shown. Undoing a change set replaces it with the entity the ChangeSetService
     * returns.
     */
    readonly entity: ModelSignal<ChangeSetEntity> = model.required<ChangeSetEntity>();

    /**
     * The url the ChangeSetService sends the requests to, like '/api/orders'. It differs between types of entities.
     */
    readonly changeSetsApiBaseUrl: InputSignal<string> = input.required<string>();

    /**
     * Whether the user can undo change sets. The default comes from provideChangeSetsConfig.
     */
    readonly canResetAndRollback: InputSignalWithTransform<boolean, unknown> = input(this.config.canResetAndRollback, {
        transform: booleanAttribute
    });

    /**
     * Whether the name of who made a change set opens it, with openCreatedBy of the ChangeSetService. The default comes
     * from provideChangeSetsConfig.
     */
    readonly canOpenCreatedBy: InputSignalWithTransform<boolean, unknown> = input(this.config.canOpenCreatedBy, {
        transform: booleanAttribute
    });

    /**
     * The texts to show.
     */
    protected readonly labels: ChangeSetsLabels = this.config.labels;

    /**
     * The labels of every type, one per line, which give each type label the width of the widest one.
     */
    protected readonly typeLabels: string = Object.values(this.labels.types).join('\n');

    /**
     * The icons to show next to text.
     */
    protected readonly icons: ChangeSetsIcons = { clock: faClock, user: faUser, reset: faArrowRotateLeft };

    private readonly sortedChangeSets: Signal<ChangeSet[]> = computed(() => {
        return [...this.entity().changeSets].sort((a, b) => ChangeSetTimeUtilities.compareNewestFirst(a, b));
    });

    // starts over with a new entity, like after undoing a change set.
    private readonly shownCount: WritableSignal<number> = linkedSignal({ source: this.entity, computation: () => this.config.pageSize });

    private readonly createdByNames: ResourceRef<Map<string, string> | undefined> = resource({
        params: () => this.entity().changeSets,
        loader: async ({ params }) => await this.resolveCreatedByNames(params)
    });

    /**
     * The change sets that are shown.
     */
    protected readonly changeSets: Signal<ChangeSetView[]> = computed(() => {
        return this.sortedChangeSets().slice(0, this.shownCount())
            .map((changeSet, index) => this.getView(changeSet, index === 0));
    });

    /**
     * Whether there are change sets that aren't shown yet.
     */
    protected readonly hasMore: Signal<boolean> = computed(() => this.shownCount() < this.sortedChangeSets().length);

    /**
     * Shows the next change sets and moves focus to the first of them, so keyboard and screen reader users continue
     * there.
     */
    protected showMore(): void {
        const firstNew: number = this.shownCount();
        this.shownCount.update(count => count + this.config.pageSize);
        afterNextRender(() => this.sections()[firstNew]?.focus(), { injector: this.injector });
    }

    /**
     * Opens who made a change set.
     * @param changeSet - The change set.
     */
    protected async openCreatedBy(changeSet: ChangeSet): Promise<void> {
        await this.changeSetService.openCreatedBy(changeSet);
    }

    /**
     * Undoes a single change set, after the user confirmed it.
     * @param changeSet - The change set to undo.
     */
    protected async reset(changeSet: ChangeSet): Promise<void> {
        await this.undo(this.config.resetConfirmDialogData, async () => {
            return await this.changeSetService.resetChangeSet(changeSet, this.changeSetsApiBaseUrl());
        });
    }

    /**
     * Undoes every change set after a change set, which leaves the entity as that one made it, after the user confirmed
     * it.
     * @param changeSet - The change set to go back to.
     */
    protected async rollback(changeSet: ChangeSet): Promise<void> {
        await this.undo(this.config.rollbackConfirmDialogData, async () => {
            return await this.changeSetService.rollbackToChangeSet(changeSet, this.changeSetsApiBaseUrl());
        });
    }

    private async undo(question: ConfirmDialogData, request: () => Promise<ChangeSetEntity>): Promise<void> {
        const confirmed: boolean | undefined = await this.dialogService.open<boolean>(ConfirmDialogComponent, question).closed;
        if (confirmed !== true) {
            return;
        }
        this.entity.set(await request());
        // the change set and the menu that undid it may be gone, which would leave focus nowhere.
        afterNextRender(() => this.sections()[0]?.focus(), { injector: this.injector });
    }

    private getView(changeSet: ChangeSet, isNewest: boolean): ChangeSetView {
        return {
            changeSet,
            typeLabel: this.config.labels.types[changeSet.type],
            typeClasses: [TYPE_LABEL_CLASSES, TYPE_CLASSES[changeSet.type]].join(' '),
            typeIcon: TYPE_ICONS[changeSet.type],
            createdAt: formatDate(ChangeSetTimeUtilities.resolveDate(changeSet), this.config.dateFormat, this.locale),
            createdByName: this.findCreatedByName(changeSet),
            canReset: changeSet.type !== ChangeSetType.CREATE,
            canRollback: !isNewest,
            changes: changeSet.changes.map(change => ({
                key: change.key,
                previousValue: ChangeValueUtilities.format(change.previousValue, this.config.valueDateFormat, this.locale),
                newValue: ChangeValueUtilities.format(change.newValue, this.config.valueDateFormat, this.locale)
            }))
        };
    }

    private findCreatedByName(changeSet: ChangeSet): string | undefined {
        const isShown: boolean = changeSet.createdBy != undefined || this.config.showEmptyCreatedBy;
        // the names may come from a request, until then the change set shows that something is still coming.
        return isShown ? this.createdByNames.value()?.get(changeSet.id) ?? '…' : undefined;
    }

    private async resolveCreatedByNames(changeSets: ChangeSet[]): Promise<Map<string, string>> {
        const names: string[] = await Promise.all(changeSets.map(async changeSet => {
            return await this.changeSetService.resolveCreatedByName(changeSet);
        }));
        return new Map(changeSets.map((changeSet, index): [string, string] => [changeSet.id, names[index] ?? '']));
    }
}