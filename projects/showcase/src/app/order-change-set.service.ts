import { Service, signal, WritableSignal } from '@angular/core';
import { ChangeSetService } from '@service-soft/ngx-change-sets/change-sets';
import { ChangeSet } from 'zibri-contract';

/**
 * The ChangeSetService of the showcase, which has no user pages to open.
 */
@Service({ autoProvided: false })
export class OrderChangeSetService extends ChangeSetService {
    /**
     * Who the user opened last.
     */
    readonly opened: WritableSignal<string> = signal('');

    override async openCreatedBy(changeSet: ChangeSet): Promise<void> {
        const name: string = await this.resolveCreatedByName(changeSet);
        this.opened.set(`Opened ${name}.`);
    }
}