import { InjectionToken } from '@angular/core';

import { StepsContext } from './steps-context.model';

// a token instead of the list itself, which a step would have to import while the list imports the step to find it.
/**
 * The list of steps a step is in, which provides it for its steps.
 */
export const STEPS_CONTEXT: InjectionToken<StepsContext> = new InjectionToken<StepsContext>('STEPS_CONTEXT');