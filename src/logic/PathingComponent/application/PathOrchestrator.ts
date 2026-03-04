import {IPathOrchestrator} from './I_PathOrchestrator';
import {appLogger} from '../../../logging/index';
import type {Node} from '../../../types/Node';
import {PathRequest} from '../../../types/PathRequest';
import {PathResult} from '../../../types/PathResponse';

/**
 * Coordinates the full routing workflow for a given `PathRequest`.
 *
 * `PathOrchestrator` sits between the API boundary (`PathAPI`) and the
 * algorithm layer. It is responsible for:
 *
 * - Selecting the appropriate routing strategy (point-to-point A* or nearest-POI Dijkstra)
 * - Retrieving and providing read-only access to the campus graph
 * - Applying contextual decoration (user constraints and preferences)
 * - Invoking the selected `PathAlgorithm`
 * - Triggering post-processing (warnings, route-to-text instructions)
 *
 * No algorithm logic is implemented directly here. The orchestrator delegates
 * to specialised strategy and algorithm components.
 *
 * @see IPathOrchestrator
 */
export class PathOrchestrator implements IPathOrchestrator {
  /**
   * @param graph - Read-only campus graph used for all path computations.
   *                Injected at construction time; the orchestrator does not mutate it.
   */
  constructor(private readonly graph: Node[]) {}

  /**
   * Resolves a routing request into a `PathResult`.
   *
   * Selects a routing strategy based on the request, runs the appropriate
   * algorithm against the graph, and returns either a found path with metadata
   * or a `not_found` result.
   *
   * Any unexpected errors are logged and re-thrown so `PathAPI` can catch
   * and translate them into a safe `internal_error` response.
   *
   * @param request - The validated domain routing request.
   * @returns A `PathResult` — either `'found'` with path data or `'not_found'`.
   * @throws Re-throws any unexpected algorithm or graph errors after logging.
   */
  async resolvePath(request: PathRequest): Promise<PathResult> {
    appLogger.debug('PathOrchestrator: resolving path', {request});
    try {
      const result: PathResult = {status: 'not_found'};

      // TODO: strategy selection, decoration, algorithm invocation

      if (result.status === 'not_found') {
        appLogger.warn('PathOrchestrator: no path found', {request});
      } else {
        appLogger.info('PathOrchestrator: path resolved successfully');
      }
      return result;
    } catch (error) {
      appLogger.error(
        'PathOrchestrator: unexpected error during path resolution',
        {request},
        error instanceof Error ? error : undefined,
      );
      throw error;
    }
  }
}
