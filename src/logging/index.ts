/**
 * logging/index.ts
 *
 * Logging module entry point — re-exports the `Logger` types/factory
 * and provides `appLogger`, the shared logger instance used app-wide.
 */

import {createBrowserLogger} from './pinoBrowserLogger';

export type {LogContext, LogLevel, Logger} from './logger';
export {createBrowserLogger} from './pinoBrowserLogger';

export const appLogger = createBrowserLogger();
