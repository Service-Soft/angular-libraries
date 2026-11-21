import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ChangeSet, ChangeSetEntity, ResetChangeSetResult } from 'zibri-contract';

import { ChangeSetRequestBody } from './change-set-request-body.model';

/**
 * What the change sets component does with a change set: sending the requests that undo it, and resolving and opening
 * who made it. Extend it, implement openCreatedBy and provide it with provideChangeSetService. It needs HttpClient,
 * from provideHttpClient.
 */
export abstract class ChangeSetService {
    /**
     * Sends the requests of the default methods.
     */
    protected readonly http: HttpClient = inject(HttpClient);

    /**
     * Undoes a single change set and keeps the ones after it.
     * By default it sends a POST request to `${changeSetsApiBaseUrl}/${changeSet.changeSetEntityId}/reset` with the id
     * of the change set, which answers what resetSingleChangeSetById of zibri returns: the entity, with its change sets,
     * and the values that changed.
     * @param changeSet - The change set to undo.
     * @param changeSetsApiBaseUrl - The url the component got, which differs between types of entities.
     * @returns The entity after the change set was undone, with its change sets.
     */
    async resetChangeSet(changeSet: ChangeSet, changeSetsApiBaseUrl: string): Promise<ChangeSetEntity> {
        const body: ChangeSetRequestBody = { changeSetId: changeSet.id };
        const url: string = `${changeSetsApiBaseUrl}/${changeSet.changeSetEntityId}/reset`;
        const result: ResetChangeSetResult = await firstValueFrom(this.http.post<ResetChangeSetResult>(url, body));
        return result.entity;
    }

    /**
     * Undoes every change set after a change set, which leaves the entity as that one made it, like
     * rollbackToChangeSetById of zibri.
     * By default it sends a POST request to `${changeSetsApiBaseUrl}/${changeSet.changeSetEntityId}/rollback` with the id
     * of the change set, which answers the entity with its change sets.
     * @param changeSet - The change set to go back to.
     * @param changeSetsApiBaseUrl - The url the component got, which differs between types of entities.
     * @returns The entity after the change sets were undone, with its change sets.
     */
    async rollbackToChangeSet(changeSet: ChangeSet, changeSetsApiBaseUrl: string): Promise<ChangeSetEntity> {
        const body: ChangeSetRequestBody = { changeSetId: changeSet.id };
        const url: string = `${changeSetsApiBaseUrl}/${changeSet.changeSetEntityId}/rollback`;
        return await firstValueFrom(this.http.post<ChangeSetEntity>(url, body));
    }

    /**
     * Resolves the name shown for who made a change set, like the name of the user whose id createdBy is.
     * @param changeSet - The change set.
     * @returns The createdBy of the change set by default, or 'System' when it has none.
     */
    resolveCreatedByName(changeSet: ChangeSet): string | Promise<string> {
        return changeSet.createdBy ?? $localize`:@@ngx-change-sets.change-sets.system:System`;
    }

    /**
     * Opens who made a change set, like the profile of the user. Called when the user clicks the name, which is only a
     * button while canOpenCreatedBy is true.
     * @param changeSet - The change set.
     */
    abstract openCreatedBy(changeSet: ChangeSet): void | Promise<void>;
}