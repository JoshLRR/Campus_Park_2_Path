import {beforeEach, describe, expect, it, vi} from 'vitest';

type PinoOptions = {
  level: string;
  base: Record<string, unknown>;
  redact?: string[];
  timestamp?: unknown;
  browser?: {asObject: boolean};
};

const baseLogger = {
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn(),
};

const childLogger = {
  trace: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  fatal: vi.fn(),
  child: vi.fn(),
};

let lastOptions: PinoOptions | undefined;

const pinoMock = vi.fn((options: PinoOptions) => {
  lastOptions = options;
  baseLogger.child.mockReturnValue(childLogger);
  return baseLogger;
});

pinoMock.stdTimeFunctions = {
  isoTime: () => 'time',
};

vi.mock('pino', () => {
  return {
    __esModule: true,
    default: pinoMock,
    Logger: class {},
  };
});

import {createBrowserLogger} from '../logging/pinoBrowserLogger';

describe('createBrowserLogger', () => {
  beforeEach(() => {
    lastOptions = undefined;
    vi.clearAllMocks();
  });

  it('configures pino with merged base context and options', () => {
    const logger = createBrowserLogger({
      name: 'test-app',
      level: 'warn',
      context: {feature: 'search'},
      redact: ['token'],
    });

    logger.info('message');

    expect(lastOptions?.level).toBe('warn');
    expect(lastOptions?.base).toEqual({
      app: 'test-app',
      env: import.meta.env.MODE,
      feature: 'search',
    });
    expect(lastOptions?.redact).toEqual(['token']);
    expect(lastOptions?.browser).toEqual({asObject: true});
  });

  it('defaults the level based on the current DEV flag', () => {
    createBrowserLogger();

    expect(lastOptions?.level).toBe(
      import.meta.env.DEV ? 'debug' : 'info',
    );
  });

  it('logs with and without context', () => {
    const logger = createBrowserLogger({level: 'info'});

    logger.info('hello');
    logger.info('hello', {room: 'A101'});

    expect(baseLogger.info).toHaveBeenCalledWith('hello');
    expect(baseLogger.info).toHaveBeenCalledWith({room: 'A101'}, 'hello');
  });

  it('logs errors with an err field when provided', () => {
    const logger = createBrowserLogger({level: 'info'});
    const error = new Error('boom');

    logger.error('route_failed', {from: 'A', to: 'B'}, error);

    expect(baseLogger.error).toHaveBeenCalledWith(
      {from: 'A', to: 'B', err: error},
      'route_failed',
    );
  });

  it('logs errors with only an err field when no context is provided', () => {
    const logger = createBrowserLogger({level: 'info'});
    const error = new Error('boom');

    logger.error('route_failed', undefined, error);

    expect(baseLogger.error).toHaveBeenCalledWith({err: error}, 'route_failed');
  });

  it('calls trace and fatal methods on the underlying logger', () => {
    const logger = createBrowserLogger({level: 'trace'});

    logger.trace('trace_message');
    logger.fatal('fatal_message');

    expect(baseLogger.trace).toHaveBeenCalledWith('trace_message');
    expect(baseLogger.fatal).toHaveBeenCalledWith('fatal_message');
  });

  it('creates child loggers through pino child', () => {
    const logger = createBrowserLogger({level: 'info'});
    const child = logger.child({requestId: 'req-1'});

    child.debug('child_message');

    expect(baseLogger.child).toHaveBeenCalledWith({requestId: 'req-1'});
    expect(childLogger.debug).toHaveBeenCalledWith('child_message');
  });
});
