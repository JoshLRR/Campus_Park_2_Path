import type {PathRequest} from '../../../types/PathRequest';
import type {PathResult} from '../../../types/PathResponse';

/**
 * Contract for the path orchestration layer.
 *
 * Implementors are responsible for coordinating the full routing workflow:
 * strategy selection, graph access, constraint decoration, algorithm invocation,
 * and post-processing. No algorithm logic should be implemented directly here.
 *
 * @see PathOrchestrator for the concrete implementation
 */
export interface IPathOrchestrator {
  /**
   * Resolves a domain routing request into a `PathResult`.
   *
   * @param request - The validated internal routing request.
   * @returns A `PathResult` — either `'found'` with path data or `'not_found'`.
   * @throws May throw on unexpected internal failures; callers should handle accordingly.
   */
  resolvePath(request: PathRequest): Promise<PathResult>;
}
