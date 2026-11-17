import { LoggerConfig } from './logger-config.model';

/**
 * The config of the LoggerService. Only where the logs go and where they come from have no default.
 */
export type LoggerConfigChanges = Pick<LoggerConfig, 'logUrl' | 'application'> & Partial<LoggerConfig>;