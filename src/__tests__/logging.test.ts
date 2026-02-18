import {beforeEach, describe, expect, it, vi} from 'vitest';

type PinoOptions = {
  level: string;
  base: Record<string, unknown>;
  redact?: string[];
  timestamp?: unknown;
  browser?: {asObject: boolean};
};

const pinoTestState = vi.hoisted(() => {
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

  return {
    baseLogger,
    childLogger,
    pinoMock,
    getLastOptions: () => lastOptions,
    resetLastOptions: () => {
      lastOptions = undefined;
    },
  };
});

vi.mock('pino', () => {
  return {
    __esModule: true,
    default: pinoTestState.pinoMock,
    Logger: class {},
  };
});

import {createBrowserLogger} from '../logging/pinoBrowserLogger';

describe('createBrowserLogger', () => {
  beforeEach(() => {
    pinoTestState.resetLastOptions();
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

    expect(pinoTestState.getLastOptions()?.level).toBe('warn');
    expect(pinoTestState.getLastOptions()?.base).toEqual({
      app: 'test-app',
      env: import.meta.env.MODE,
      feature: 'search',
    });
    expect(pinoTestState.getLastOptions()?.redact).toEqual(['token']);
    expect(pinoTestState.getLastOptions()?.browser).toEqual({asObject: true});
  });

  it('defaults the level based on the current DEV flag', () => {
    createBrowserLogger();

    expect(pinoTestState.getLastOptions()?.level).toBe(
      import.meta.env.DEV ? 'debug' : 'info',
    );
  });

  it('logs with and without context', () => {
    const logger = createBrowserLogger({level: 'info'});

    logger.info('hello');
    logger.info('hello', {room: 'A101'});

    expect(pinoTestState.baseLogger.info).toHaveBeenCalledWith('hello');
    expect(pinoTestState.baseLogger.info).toHaveBeenCalledWith(
      {room: 'A101'},
      'hello',
    );
  });

  it('logs errors with an err field when provided', () => {
    const logger = createBrowserLogger({level: 'info'});
    const error = new Error('boom');

    logger.error('route_failed', {from: 'A', to: 'B'}, error);

    expect(pinoTestState.baseLogger.error).toHaveBeenCalledWith(
      {from: 'A', to: 'B', err: error},
      'route_failed',
    );
  });

  it('logs errors with only an err field when no context is provided', () => {
    const logger = createBrowserLogger({level: 'info'});
    const error = new Error('boom');

    logger.error('route_failed', undefined, error);

    expect(pinoTestState.baseLogger.error).toHaveBeenCalledWith(
      {err: error},
      'route_failed',
    );
  });

  it('calls trace and fatal methods on the underlying logger', () => {
    const logger = createBrowserLogger({level: 'trace'});

    logger.trace('trace_message');
    logger.fatal('fatal_message');

    expect(pinoTestState.baseLogger.trace).toHaveBeenCalledWith('trace_message');
    expect(pinoTestState.baseLogger.fatal).toHaveBeenCalledWith('fatal_message');
  });

  it('creates child loggers through pino child', () => {
    const logger = createBrowserLogger({level: 'info'});
    const child = logger.child({requestId: 'req-1'});

    child.debug('child_message');

    expect(pinoTestState.baseLogger.child).toHaveBeenCalledWith({
      requestId: 'req-1',
    });
    expect(pinoTestState.childLogger.debug).toHaveBeenCalledWith(
      'child_message',
    );
  });
});
