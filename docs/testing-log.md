# **Testing Log**
This file has a record and description of every test for this project, separated by component. All tests are found in the file `src/__tests__`.

## **Writing a new test**

- "Status" refers to the status of the individual test it will read:
	- ☑️ if the test is implemented
	- ⬜ if the test is not yet implemented
	- " * " if there is a note about the test's implementation (there will be more information at the foot of the table)
- "File Name" for the path of the file it is testing

## **Pathfinding Functions**

| Status | File | Description | Suite |
| :---: | --- | --- | --- |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Returns a `PathAPI` instance | Factory shape |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Exposes a `path()` method (satisfies `I_PathAPI`) | Factory shape |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Returns a distinct instance on each call | Factory shape |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Uses `HardcodedGraphRepository` when no repo is provided | Default repository |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Calls `getGraph()` on the provided repo | Custom repository |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Uses the graph returned by the provided repo | Custom repository |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Returns a `PathResponseDTO` with a `status` field for a valid request | Functional smoke tests |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Never throws — resolves for a valid request | Functional smoke tests |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Returns `validation_error` for a null request | Functional smoke tests |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Returns `validation_error` for a malformed request | Functional smoke tests |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` for null input | Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` for a plain string | Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` when origin is missing | Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` when destination is missing | Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` for an invalid origin mode | Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` for an invalid destination mode | Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Does not call the orchestrator when validation fails | Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `success` with path data when orchestrator finds a path | Response mapping |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Maps `NodeId`s to strings in the success response | Response mapping |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `not_found` when orchestrator returns `not_found` | Response mapping |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Maps node origin to `{kind: node, nodeId: number}` | Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Maps coordinate origin to `{kind: coordinate, position}` | Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Maps node destination to `{kind: node, nodeId: number}` | Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Maps poiType destination to `{kind: poiType, poiType: string}` | Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Maps `avoidStairs` preference to `PathFeatures.Stairs` | Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Maps `avoidUncovered` preference to `PathFeatures.Covered` | Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Maps `avoidUnpaved` preference to `PathFeatures.Paved` | Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Sends empty `avoidFeatures` when preferences are omitted | Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `internal_error` when the orchestrator throws | Error handling |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Never propagates exceptions to the caller | Error handling |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Accepts a valid request with `origin.mode=node` and string `origin.value` | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Accepts a valid request with `origin.mode=coordinate` and object `origin.value` | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Accepts requests when `preferences` is omitted | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects when request is not an object (string, number, null, undefined, array) | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects when `origin` is missing | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects when `destination` is missing | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects `origin` with an invalid mode | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects `destination` with an invalid mode | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects `origin.mode=node` when `origin.value` is not a string | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects `origin.mode=coordinate` when `origin.value` is not a Coordinate object | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects `origin.mode=coordinate` when Coordinate is missing required fields | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects `origin.mode=coordinate` when `floorNum` is not an integer | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects `destination.value` when not a string | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects empty strings (schema enforces `minLength=1`) | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects unknown extra properties at the top level (`additionalProperties=false`) | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathRequestValidator.ts` | Rejects unknown extra properties inside `origin`, `destination`, or `coordinate` | PathRequestValidator |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` for null | Integration — Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` when origin is missing | Integration — Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` when destination is missing | Integration — Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` for an invalid origin mode | Integration — Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` for an empty node value string | Integration — Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `validation_error` for unknown extra top-level properties | Integration — Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Does not invoke the orchestrator when validation fails | Integration — Validation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns a structured `PathResponseDTO` for a node-to-node request | Integration — End-to-end |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `not_found` for a valid request (orchestrator is a stub) | Integration — End-to-end |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Invokes the orchestrator exactly once for a valid request | Integration — End-to-end |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Accepts a coordinate origin without throwing | Integration — End-to-end |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Accepts a `poiType` destination without throwing | Integration — End-to-end |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Accepts all three preferences set to true | Integration — End-to-end |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Accepts a request with preferences omitted | Integration — End-to-end |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Returns `internal_error` when the orchestrator throws unexpectedly | Integration — End-to-end |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Passes `{kind: node, nodeId: number}` to the orchestrator for a node origin | Integration — Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Passes `{kind: coordinate, position}` to the orchestrator for a coordinate origin | Integration — Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Passes `{kind: node, nodeId: number}` to the orchestrator for a node destination | Integration — Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Passes `{kind: poiType, poiType: string}` to the orchestrator for a poiType destination | Integration — Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/PathAPI.ts` | Passes an empty `avoidFeatures` array when preferences are omitted | Integration — Domain transformation |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Produces a new independent instance on each call | Integration — Factory / DI |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Uses `HardcodedGraphRepository` by default | Integration — Factory / DI |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Accepts a custom `GraphRepository` and calls `getGraph()` on it | Integration — Factory / DI |
| ☑️ | `src/logic/PathingComponent/api/CreatePathingAPI.ts` | Custom repo with an empty graph still returns a valid response | Integration — Factory / DI |