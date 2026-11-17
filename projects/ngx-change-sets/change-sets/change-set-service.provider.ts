import { Provider, Type } from '@angular/core';

import { ChangeSetService } from './change-set.service';

/**
 * Provides your ChangeSetService, which the change sets component uses to undo change sets and to show who made them.
 * Injecting your class gives the same instance the component uses.
 * @param service - Your class that extends ChangeSetService.
 * @returns The providers for your class and for ChangeSetService.
 */
export function provideChangeSetService(service: Type<ChangeSetService>): Provider[] {
    return [service, { provide: ChangeSetService, useExisting: service }];
}