# Pathing API

## Overview

The **Pathing API** serves as the public interface between the CPP Frontend and the Pathfinding subsystem.

It is responsible for validating path requests, enforcing structural and semantic correctness, and delegating execution to the Path Orchestration layer.

The Pathing API does **not** implement routing algorithms. It acts strictly as a boundary layer.

---

## Files

| File | Purpose |
|------|---------|
| `PathAPI.ts` | Main boundary class. Owns the full request lifecycle. |
| `I_PathAPI.ts` | Interface contract for `PathAPI`. |
| `CreatePathingAPI.ts` | Factory function that wires `PathAPI` with its dependencies. |
| `PathAPI.dto.ts` | `PathRequestDTO` and `PathResponseDTO` type definitions. |
| `PathRequestValidator.ts` | AJV-based JSON schema validator and assertion function. |
| `schemas/PathRequest.schema.json` | JSON Schema definition for incoming requests. |

---

## Responsibilities

The Pathing API performs the following functions in order:

1. **Structural validation** — validates incoming JSON against the `PathRequest` JSON Schema via AJV
2. **Semantic validation** — *(planned)* verifies that referenced nodes and POI types exist in the active graph
3. **Domain transformation** — converts the validated `PathRequestDTO` into internal domain objects (`PathRequest`)
4. **Orchestration** — delegates path computation to `PathOrchestrator`
5. **Response mapping** — converts the internal `PathResult` into a `PathResponseDTO` for the frontend

---

## Request Contract

The API accepts a JSON payload conforming to [`PathRequest.schema.json`](./schemas/PathRequest.schema.json).

### Structure

```json
{
  "origin": {
    "mode": "node | coordinate",
    "value": "<nodeId string> | { x, y, floorNum }"
  },
  "destination": {
    "mode": "node | poiType",
    "value": "<nodeId string> | <poiType string>"
  },
  "preferences": {
    "avoidStairs": false,
    "avoidUncovered": false,
    "avoidUnpaved": false
  }
}
```

`preferences` is optional. All preference fields default to `false` when omitted.

---

## Response Contract

All responses conform to `PathResponseDTO`:

```typescript
{
  status: 'success' | 'not_found' | 'validation_error' | 'internal_error';
  message?: string;   // human-readable summary or warning string
  path?: {
    nodes: string[];        // ordered node IDs along the route
    totalDistance: number;  // total path distance
  };
}
```

### Status values

| Status | Meaning |
|--------|---------|
| `success` | A valid path was found |
| `not_found` | The graph contains no valid path for the request |
| `validation_error` | The request failed structural schema validation |
| `internal_error` | An unexpected error occurred during processing |

---

## Error Handling Philosophy

The Pathing API never exposes internal exceptions or stack traces to the caller.

All error states are encoded in `PathResponseDTO.status`. The `message` field provides a human-readable description where applicable. This ensures predictable failure modes regardless of what occurs internally.
