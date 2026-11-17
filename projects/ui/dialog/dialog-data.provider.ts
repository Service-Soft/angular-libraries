import { InjectionToken } from '@angular/core';

/**
 * The data a component opened with the DialogService was opened with: `inject<MyData>(DIALOG_DATA)`.
 */
export const DIALOG_DATA: InjectionToken<unknown> = new InjectionToken<unknown>('DIALOG_DATA');