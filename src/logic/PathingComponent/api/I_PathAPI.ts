import {PathRequestDTO, PathResponseDTO} from './PathAPI.dto';

/**
 * Entry point for route computation requests.
 * Accepts raw JSON request from frontend boundary.
 * Returns structured routing response.
 */
export interface I_PathAPI {
  path(request: PathRequestDTO): Promise<PathResponseDTO>;
}
