import {appLogger} from '../../../logging/index';
import {I_PathAPI} from './I_PathAPI';
import {PathRequestDTO, PathResponseDTO} from './PathAPI.dto';
import {PathOrchestrator} from '../application/PathOrchestrator';
import {
  assertIsPathRequestDTO,
  PathRequestValidationError,
} from './PathRequestValidator';
import type {
  PathRequest,
  PathOrigin,
  PathDestination,
} from '../../../types/PathRequest';
import type {PathResult} from '../../../types/PathResponse';
import type {Position} from '../../../types/Node';
import {PathFeatures} from '../../../types/PathFeatures';

/**
 * Public boundary layer between the Frontend and the internal Pathfinding subsystem.
 *
 * `PathAPI` is the sole entry point for all routing requests from the UI. It owns
 * the full request lifecycle up to and including orchestration delegation:
 *
 * 1. **Structural validation** — incoming JSON is validated against
 *    `PathRequest.schema.json` via AJV before any processing occurs.
 * 2. **Semantic validation** — (planned) verifies that referenced nodes and POI
 *    types exist in the active graph.
 * 3. **Domain transformation** — converts the validated `PathRequestDTO` into
 *    typed internal domain objects (`PathRequest`) consumed by the orchestrator.
 * 4. **Orchestration** — delegates path computation to `PathOrchestrator`.
 * 5. **Response mapping** — converts the internal `PathResult` back into a
 *    `PathResponseDTO` safe for frontend consumption.
 *
 * No path computation logic lives here. All errors are caught and returned as
 * structured `PathResponseDTO` values — exceptions are never propagated to the caller.
 *
 * @see PathRequestValidator for structural validation details
 * @see PathOrchestrator for routing strategy and algorithm selection
 * @implements {I_PathAPI}
 */
export class PathAPI implements I_PathAPI {
  constructor(private readonly orchestrator: PathOrchestrator) {}

  /**
   * Accepts a raw routing request from the frontend, validates it, and returns
   * a structured routing response.
   *
   * This method never throws. All error states are represented as a
   * `PathResponseDTO` with an appropriate `status` field:
   * - `'success'` — a path was found
   * - `'not_found'` — the graph contains no valid path for the request
   * - `'validation_error'` — the request failed structural validation
   * - `'internal_error'` — an unexpected error occurred during processing
   *
   * The request schema is defined in:
   * `src/logic/PathingComponent/api/schemas/PathRequest.schema.json`
   * and can be used by the frontend to pre-validate requests before sending.
   *
   * @param request - Raw, unvalidated JSON payload from the UI.
   * @returns A `PathResponseDTO` representing the result or a structured error.
   */
  async path(request: unknown): Promise<PathResponseDTO> {
    let result: PathResponseDTO = {status: 'internal_error'};
    appLogger.info('PathAPI: incoming path request');
    try {
      this.validateRequest(request);

      // Semantic validation
      const domainRequest = this.transformToDomain(request);

      // Perform Orchestration
      const appResult = await this.orchestrator.resolvePath(domainRequest);

      // Transform appResult(PathRequest) back into result(PathResultDTO) for FrontEnd
      result = this.transformToPathResultDTO(appResult);

      if (result.status === 'not_found') {
        appLogger.warn('PathAPI: no path found for request');
      } else {
        appLogger.info('PathAPI: path resolved successfully');
      }
    } catch (validation_error) {
      if (validation_error instanceof PathRequestValidationError) {
        appLogger.warn('PathAPI: request failed validation', {
          errors: validation_error.details,
        });
        result = {
          status: 'validation_error',
          message: 'Request failed: improper request syntax',
        };
      } else {
        appLogger.error(
          'PathAPI: unexpected internal error',
          {},
          validation_error instanceof Error ? validation_error : undefined,
        );
      }
    }
    return result;
  }

  /**
   * Validates the raw request against the PathRequest JSON schema.
   *
   * Acts as a TypeScript assertion function — if validation passes, the type of
   * `request` is narrowed to `PathRequestDTO` at the call site. If validation
   * fails, a `PathRequestValidationError` is thrown containing AJV error details.
   *
   * @param request - Raw unknown input to validate.
   * @throws {PathRequestValidationError} If the request does not conform to the schema.
   */
  private validateRequest(request: unknown): asserts request is PathRequestDTO {
    assertIsPathRequestDTO(request);
  }

  /**
   * Converts a validated `PathRequestDTO` into the internal `PathRequest` domain type.
   *
   * - `origin.mode === 'node'` → `{kind: 'node', nodeId: number}`
   * - `origin.mode === 'coordinate'` → `{kind: 'coordinate', position: Position}`
   * - `destination.mode === 'node'` → `{kind: 'node', nodeId: number}`
   * - `destination.mode === 'poiType'` → `{kind: 'poiType', poiType: string}`
   * - `preferences` → mapped to a `PathFeatures[]` array of features to avoid
   *
   * @param request - A structurally validated `PathRequestDTO`.
   * @returns The equivalent `PathRequest` domain object for the orchestrator.
   */
  private transformToDomain(request: PathRequestDTO): PathRequest {
    const origin: PathOrigin =
      request.origin.mode === 'node'
        ? {kind: 'node', nodeId: parseInt(request.origin.value as string, 10)}
        : {kind: 'coordinate', position: request.origin.value as Position};

    const destination: PathDestination =
      request.destination.mode === 'node'
        ? {kind: 'node', nodeId: parseInt(request.destination.value, 10)}
        : {kind: 'poiType', poiType: request.destination.value};

    const avoidFeatures: PathFeatures[] = [];
    if (request.preferences?.avoidStairs)
      avoidFeatures.push(PathFeatures.Stairs);
    if (request.preferences?.avoidUncovered)
      avoidFeatures.push(PathFeatures.Covered);
    if (request.preferences?.avoidUnpaved)
      avoidFeatures.push(PathFeatures.Paved);

    return {origin, destination, avoidFeatures};
  }

  /**
   * Converts an internal `PathResult` from the orchestrator into a `PathResponseDTO`
   * suitable for the frontend.
   *
   * - `'found'` → `status: 'success'` with path nodes (as strings) and total distance.
   *   Any warnings are joined into a human-readable `message` string.
   * - `'not_found'` → `status: 'not_found'` with a descriptive message.
   *
   * @param result - The domain result returned by `PathOrchestrator.resolvePath`.
   * @returns A `PathResponseDTO` ready for frontend consumption.
   */
  private transformToPathResultDTO(result: PathResult): PathResponseDTO {
    if (result.status === 'not_found') {
      return {status: 'not_found', message: 'No path found'};
    }
    return {
      status: 'success',
      path: {
        nodes: result.nodes.map(String),
        totalDistance: result.totalDistance,
      },
      message: result.warnings?.length
        ? result.warnings.map(w => w.message).join('; ')
        : undefined,
    };
  }
}
