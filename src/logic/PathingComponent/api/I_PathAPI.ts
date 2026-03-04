import {PathResponseDTO} from './PathAPI.dto';

/**
 * Entry point for route computation requests.
 * Returns structured routing response.
 */
export interface I_PathAPI {
  path(request: unknown): Promise<PathResponseDTO>;
}
