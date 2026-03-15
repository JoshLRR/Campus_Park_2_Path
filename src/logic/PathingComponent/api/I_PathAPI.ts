import {PathResponseDTO} from './PathAPI.dto';

/**
 * Public contract for the Pathfinding API boundary layer.
 *
 * Implementors accept raw, unvalidated requests from the frontend and return
 * structured `PathResponseDTO` responses. All validation, transformation, and
 * orchestration details are encapsulated behind this interface.
 *
 * @see PathAPI for the concrete implementation
 */
export interface I_PathAPI {
  /**
   * Accepts a raw routing request and returns a structured routing response.
   *
   * Never throws — all error states are encoded in `PathResponseDTO.status`.
   *
   * @param request - Raw, unvalidated JSON payload from the frontend.
   * @returns A `PathResponseDTO` representing the result or a structured error.
   */
  path(request: unknown): Promise<PathResponseDTO>;
}
