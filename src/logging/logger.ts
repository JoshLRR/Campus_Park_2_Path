/**
 * Supported log levels in order of increasing severity.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Extra fields to attach to log entries.
 */
export type LogContext = Record<string, unknown>;

/**
 * Minimal logging interface shared across environments.
 */
export interface Logger {
  /**
   * Log a trace-level message.
   */
  trace(message: string, context?: LogContext): void;
  /**
   * Log a debug-level message.
   */
  debug(message: string, context?: LogContext): void;
  /**
   * Log an info-level message.
   */
  info(message: string, context?: LogContext): void;
  /**
   * Log a warning-level message.
   */
  warn(message: string, context?: LogContext): void;
  /**
   * Log an error-level message, optionally with an Error.
   */
  error(message: string, context?: LogContext, error?: Error): void;
  /**
   * Log a fatal-level message, optionally with an Error.
   */
  fatal(message: string, context?: LogContext, error?: Error): void;
  /**
   * Create a child logger with bound context fields.
   */
  child(bindings: LogContext): Logger;
}
