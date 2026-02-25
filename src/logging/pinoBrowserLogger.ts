import pino, {Logger as PinoLogger} from 'pino';
import type {LogContext, LogLevel, Logger} from './logger';

const DEFAULT_REDACT_PATHS = [
  'password',
  'pass',
  'token',
  'authorization',
  'cookie',
  'set-cookie',
];

export type BrowserLoggerOptions = {
  level?: LogLevel;
  name?: string;
  context?: LogContext;
  redact?: string[];
};

class PinoBrowserLogger implements Logger {
  constructor(private readonly logger: PinoLogger) {}

  trace(message: string, context?: LogContext) {
    this.log('trace', message, context);
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext, error?: Error) {
    this.logWithError('error', message, context, error);
  }

  fatal(message: string, context?: LogContext, error?: Error) {
    this.logWithError('fatal', message, context, error);
  }

  child(bindings: LogContext): Logger {
    return new PinoBrowserLogger(this.logger.child(bindings));
  }

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (context && Object.keys(context).length > 0) {
      this.logger[level](context, message);
      return;
    }

    this.logger[level](message);
  }

  private logWithError(
    level: 'error' | 'fatal',
    message: string,
    context?: LogContext,
    error?: Error,
  ) {
    if (error) {
      this.logger[level]({...(context ?? {}), err: error}, message);
      return;
    }

    this.log(level, message, context);
  }
}

export function createBrowserLogger(
  options: BrowserLoggerOptions = {},
): Logger {
  const isDev = import.meta.env.DEV;
  const name = options.name ?? 'campus-park-2-path';
  const level = options.level ?? (isDev ? 'debug' : 'info');
  const baseContext: LogContext = {
    app: name,
    env: import.meta.env.MODE,
    ...options.context,
  };

  const logger = pino({
    level,
    base: baseContext,
    redact: options.redact ?? DEFAULT_REDACT_PATHS,
    timestamp: pino.stdTimeFunctions.isoTime,
    browser: {
      asObject: true,
    },
  });

  return new PinoBrowserLogger(logger);
}
