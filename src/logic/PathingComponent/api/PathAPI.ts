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
    const result: PathResponseDTO = {status: 'internal_error'};
    try {
      this.validateRequest(request);

      // TODO Semantic validation
      const domainRequest = this.transformToDomain(request);
      console.log(domainRequest);

      // TODO Actually send to orchestration
      result = await this.orchestrator.resolvePath(domainRequest);
    } catch (validation_error) {
      if (validation_error instanceof PathRequestValidationError) {
        result.status = 'validation_error';
        result.message = 'Request failed: improper request syntax';
      }
    }
    return result;
  }
  /**
   * Performs syntactical validation for the Path Request
   * @param request
   */
  private validateRequest(request: unknown): void {
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
}
