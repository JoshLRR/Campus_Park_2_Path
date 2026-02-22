import {PathRequestDTO, PathResponseDTO} from './PathingAPI.dto';

/**
 * Entry point for route computation requests.
 * Accepts raw JSON request from frontend boundary.
 * Returns structured routing response.
 */
export interface IPathingAPI {
  path(request: PathRequestDTO): Promise<PathResponseDTO>;
}
