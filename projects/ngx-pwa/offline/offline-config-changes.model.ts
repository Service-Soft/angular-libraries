import { OfflineConfig } from './offline-config.model';

/**
 * What provideOfflineConfig is given. Values left out keep their defaults: no headers, and no scope, so everything
 * belongs to everybody.
 */
export type OfflineConfigChanges = Partial<OfflineConfig>;