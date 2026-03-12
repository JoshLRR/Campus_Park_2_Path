import type {NodeId} from '../../../types/Node';
import type {PathDestination} from '../../../types/PathRequest';
import type {PathResult} from '../../../types/PathResponse';

/**
 * Strategy interface for campus path-finding algorithms.
 *
 * Implementors receive the graph at construction time and are invoked
 * by the `PathOrchestrator` with a resolved start node and destination.
 *
 * @see DijkstraAlgorithm for the concrete implementation
 */
export interface PathAlgorithm {
  /**
   * Computes the shortest path from `startNodeId` to `destination`.
   *
   * @param startNodeId  - The resolved origin node in the campus graph.
   * @param destination  - Either a specific node ID or a POI type to locate.
   * @returns A `PathResult` — `'found'` with node list and cost, or `'not_found'`.
   */
  findPath(
    startNodeId: NodeId,
    destination: PathDestination,
  ): Promise<PathResult>;
}
