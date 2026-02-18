# Logging

This module wraps Pino with a small, shared interface so we can keep local
console logging now and swap in richer implementations later.

## Quick start

```ts
import {appLogger} from './logging';

appLogger.info('search_submitted', {query: 'library'});
appLogger.error('route_failed', {from: 'A', to: 'B'}, new Error('No path'));
```

## Create a logger

```ts
import {createBrowserLogger} from './logging';

const logger = createBrowserLogger({
  name: 'campus-park-2-path',
  level: 'debug',
  context: {feature: 'search'},
});
```

Note: `src/logging/index.ts` creates a shared singleton logger (`appLogger`).
For most use cases, import and use that instead of creating new instances:

```ts
import {appLogger} from './logging';

appLogger.info('ready');
```

## Default level

When `level` is not provided, the default is:
- `debug` when `import.meta.env.DEV` is true
- `info` otherwise

## Child loggers

```ts
const requestLogger = logger.child({requestId: 'req-123'});
requestLogger.info('route_requested', {from: 'A', to: 'B'});
```

## Extensibility

All app code should depend on the `Logger` interface. That lets us:
- Add a Node/server implementation later
- Add log shipping, sampling, or redaction policy changes
- Introduce a shared schema without rewriting call sites
