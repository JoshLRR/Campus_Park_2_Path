# Pathing API

## Overview

The **Pathing API** serves as the public interface between the CPP Frontend and the Pathfinding subsystem.

It is responsible for validating path requests, enforcing structural and semantic correctness, and delegating execution to the Path Orchestration layer.

The Pathing API does **not** implement routing algorithms. It acts strictly as a boundary and coordination layer.

---

## Responsibilities

The Pathing API performs the following functions:

- Accepts `PathRequest` JSON payloads
- Validates requests against the PathRequest JSON Schema
- Performs semantic validation:
  - Verifies origin and destination nodes exist
  - Verifies POI type identifiers exist in the POI repository
  - Ensures compatibility with the active graph version
- Transforms validated requests into internal domain objects
- Invokes the `PathOrchestrator` service
- Returns structured `PathResponse` objects
- Returns structured error responses for invalid requests

---

## Request Contract

The API accepts a JSON `PathRequest` containing:

- `origin`
- `mode` (`point_to_point` | `nearest_poi`)
- `destination` (for point-to-point)
- `poiTypeId` (for nearest POI)
- `constraints`
- `preferences`

All incoming requests must conform to the defined JSON Schema (`TODO schema coming soon`).

Requests failing schema validation are rejected with HTTP 400.

---

## Response Contract

Successful requests return a `PathResponse` containing:

- Path status
- Path geometry (an ordered list of nodes and edges)
- Human-readable instructions
- Path summary metadata

Unsuccessful requests return structured error responses including:

- Error code
- Human-readable message
- Validation failure details (if applicable)

---

## Error Handling Philosophy

The Pathing API does not expose internal exceptions or stack traces.

All errors are returned as structured responses with error codes such as:

- `INVALID_REQUEST`
- `UNKNOWN_NODE`
- `UNKNOWN_POI_TYPE`
- `NO_PATH_FOUND`
- `INTERNAL_ERROR`

This ensures predictable failure modes.
