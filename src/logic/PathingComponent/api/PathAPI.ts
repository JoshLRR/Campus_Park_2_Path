// PathAPI.ts
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
 * Usage:
 * ------
 * The frontend should interact only with the `path()` method and
 * should not depend on any internal orchestration or domain types.
 *
 * PathAPI
 * -----------
 * Public boundary layer between the Frontend (Web/Kiosk UI) and the
 * internal Pathfinding subsystem.
 *
 * This class serves as the sole entry point for all routing requests
 * originating from the user interface. It is responsible for:
 *
 * - Validating the structural integrity of incoming `PathRequestDTO` objects
 *   (JSON schema validation — planned integration).
 * - Performing semantic validation (e.g., origin existence, POI type validity).
 * - Transforming validated transport-layer DTOs into internal domain models.
 * - Delegating path computation to the `PathOrchestrator`.
 * - Converting internal results into a structured `PathResponseDTO`
 *   suitable for frontend consumption.
 *
 * Design Notes:
 * -------------
 * - This class contains NO path computation logic.
 * - All graph traversal and strategy selection occurs within the
 *   application layer (`PathOrchestrator`).
 * - Acts as a clean architectural boundary to isolate the UI from
 *   domain and algorithmic concerns.
 *
 * @implements I_PathAPI
 */
export class PathAPI implements I_PathAPI {
  constructor(private readonly orchestrator: PathOrchestrator) {}

  /**
   * Entry point for routing requests from the frontend.
   *
   * @param request - Transport-layer routing request from UI.
   * @returns A `PathResponseDTO` representing either:
   *          - a successful path result, or
   *          - a structured error state.
   *
   * @throws Does not propagate exceptions. All errors are caught
   *         and translated into a safe `PathResponseDTO`.
   */
  async path(request: unknown): Promise<PathResponseDTO> {
    let result: PathResponseDTO = {status: 'internal_error'};
    appLogger.info('PathAPI: incoming path request');
    try {
      this.validateRequest(request);

      // TODO Semantic validation
      const domainRequest = this.transformToDomain(request);

      // TODO Actually send to orchestration
      const appResult = await this.orchestrator.resolvePath(domainRequest);

      // TODO transform appResult(PathRequest) back into result (PathResultDTO)

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
   * Performs syntactical validation for the Path Request.
   * Acts as a type assertion — narrows `request` to `PathRequestDTO` at the call site.
   */
  private validateRequest(request: unknown): asserts request is PathRequestDTO {
    assertIsPathRequestDTO(request);
  }

  /**
   * Transforms a validated PathRequestDTO into domain objects for the orchestrator.
   * @param request - A structurally validated PathRequestDTO
   * @returns PathRequest domain object
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
    };
  }
}
