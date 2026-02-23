// PathingAPI.ts

import {IPathingAPI} from './I_PathingAPI';
import {PathRequestDTO, PathResponseDTO} from './PathingAPI.dto';
import {PathOrchestrator} from '../PathApplication/PathOrchestrator';

/**
 * Usage:
 * ------
 * The frontend should interact only with the `path()` method and
 * should not depend on any internal orchestration or domain types.
 *
 * PathingAPI
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
 * @implements IPathingAPI
 */
export class PathingAPI implements IPathingAPI {
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
  async path(request: PathRequestDTO): Promise<PathResponseDTO> {
    const result: PathResponseDTO = {status: 'internal_error'};
    try {
      // TODO eventually JSON Schema validation (stub for now)
      this.validateRequest(request);

      // TODO Semantic validation
      // const domainRequest = this.transformToDomain(request);

      // TODO Actually send to orchestration
      // const result = await this.orchestrator.computePath(domainRequest);
    } catch (validation_error) {
      console.log(validation_error);
    }
    return result;
  }

  private validateRequest(request: PathRequestDTO): void {
    // TODO: plug in JSON schema validation
    request.origin.value = 'tk';
  }

  private transformToDomain(request: PathRequestDTO) {
    // TODO: convert DTO -> Domain objects
    return request;
  }
}
