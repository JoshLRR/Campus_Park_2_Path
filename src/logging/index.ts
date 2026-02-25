import {createBrowserLogger} from './pinoBrowserLogger';

export type {LogContext, LogLevel, Logger} from './logger';
export {createBrowserLogger} from './pinoBrowserLogger';

export const appLogger = createBrowserLogger();
