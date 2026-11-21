import { Component, computed, inject, Signal, signal, WritableSignal } from '@angular/core';
import { CONSENT_DIALOG_CONFIG, ConsentDialogConfig, ConsentDialogLabels, ConsentService, GdprCategory, Tracking } from '@service-soft/ngx-tracking/consent';
import { ButtonComponent } from '@service-soft/ui/button';
import { DialogRef } from '@service-soft/ui/dialog';
import { FormComponent } from '@service-soft/ui/form';

import { ConsentCategoryView } from './consent-category-view.model';
import { ConsentCategoryComponent } from './consent-category.component';

// the order the categories show in: what can't be changed first, then what is checked at first.
const CATEGORIES: GdprCategory[] = [GdprCategory.TECHNICAL_NECESSARY, GdprCategory.ENABLED_BY_DEFAULT, GdprCategory.DISABLED_BY_DEFAULT];

/**
 * The dialog where the user chooses which trackings to allow. Opened by the ConsentDialogUi, inside a dialog that
 * escape doesn't close: the user has to choose. Nothing is allowed or forbidden before they press one of its buttons.
 */
@Component({
    selector: 'ngx-consent-dialog',
    templateUrl: './consent-dialog.component.html',
    imports: [ButtonComponent, ConsentCategoryComponent, FormComponent]
})
export class ConsentDialogComponent {
    private readonly consentService: ConsentService = inject(ConsentService);

    private readonly dialogRef: DialogRef = inject(DialogRef);

    /**
     * What the dialog shows.
     */
    protected readonly config: ConsentDialogConfig = inject(CONSENT_DIALOG_CONFIG);

    /**
     * The texts of the dialog.
     */
    protected readonly labels: ConsentDialogLabels = this.config.labels;

    // what the user allowed before, or what is checked at first when they never chose.
    private readonly allowed: WritableSignal<Tracking[]> = signal(this.consentService.trackings.filter(tracking => {
        return this.consentService.hasMadeChoices
            ? this.consentService.getTrackingService(tracking).enabled()
            : this.getCategory(tracking) !== GdprCategory.DISABLED_BY_DEFAULT;
    }));

    /**
     * The categories that have trackings, with whether each of them is checked.
     */
    protected readonly categories: Signal<ConsentCategoryView[]> = computed(() => {
        return CATEGORIES
            .map(category => this.toCategoryView(category))
            .filter(category => category.options.length);
    });

    /**
     * Checks or unchecks a tracking.
     * @param tracking - The tracking.
     */
    protected toggleTracking(tracking: Tracking): void {
        this.allowed.update(allowed => allowed.includes(tracking) ? allowed.filter(other => other !== tracking) : [...allowed, tracking]);
    }

    /**
     * Checks every tracking of a category, or unchecks them all when they were all checked.
     * @param category - The category.
     */
    protected toggleCategory(category: ConsentCategoryView): void {
        const trackings: Tracking[] = category.options.map(option => option.tracking);
        this.allowed.update(allowed => {
            const others: Tracking[] = allowed.filter(tracking => !trackings.includes(tracking));
            return category.allChecked ? others : [...others, ...trackings];
        });
    }

    /**
     * Allows what the user checked and closes the dialog.
     */
    protected async saveChoices(): Promise<void> {
        await this.consentService.saveChoices(this.allowed());
        this.dialogRef.close();
    }

    /**
     * Allows every tracking and closes the dialog.
     */
    protected async allowAll(): Promise<void> {
        await this.consentService.allowAll();
        this.dialogRef.close();
    }

    /**
     * Allows only the technically necessary trackings and closes the dialog.
     */
    protected async allowOnlyRequired(): Promise<void> {
        await this.consentService.allowOnlyRequired();
        this.dialogRef.close();
    }

    private toCategoryView(category: GdprCategory): ConsentCategoryView {
        const required: boolean = category === GdprCategory.TECHNICAL_NECESSARY;
        const options: ConsentCategoryView['options'] = this.consentService.trackings
            .filter(tracking => this.getCategory(tracking) === category)
            .map(tracking => ({ tracking, checked: required || this.allowed().includes(tracking) }));
        const checkedCount: number = options.filter(option => option.checked).length;
        return {
            category,
            title: this.labels.categories[category],
            required,
            allChecked: checkedCount === options.length,
            someChecked: checkedCount > 0 && checkedCount < options.length,
            options
        };
    }

    private getCategory(tracking: Tracking): GdprCategory {
        return this.consentService.getTrackingService(tracking).gdprCategory;
    }
}