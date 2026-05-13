import type {Node, NodeId} from '../../../../types/Node';
import {PathNode} from '../../../../types/PathNode';
import type {PathFeatures} from '../../../../types/PathFeatures';

/**
 * Removes nodes and edges that violate hard routing constraints.
 *
 * Operates directly on the graph array passed in. Call only on a
 * cloned graph — never on the authoritative campus graph.
 *
 * Examples of constraints applied here:
 *  - Accessible-only routing removes stair nodes
 *  - Avoid unpaved paths removes dirt/gravel nodes
 *  - Avoid construction zones removes blocked nodes
 */
export class EdgePruning {
  /**
   * Mutates `graph` in place:
   *  1. Collects all `PathNode` IDs whose features intersect `avoidFeatures`.
   *  2. Splices those nodes out of the array.
   *  3. Strips edges pointing to removed nodes from every remaining node.
   *
   * @param graph         - Cloned working graph (will be mutated).
   * @param avoidFeatures - Hard constraints from the routing request.
   */
  prune(graph: Node[], avoidFeatures: PathFeatures[]): void {
    if (avoidFeatures.length === 0) return;

    const avoidSet = new Set(avoidFeatures);

    // 1. Identify nodes to remove
    const prunedIds = new Set<NodeId>();
    for (const node of graph) {
      if (node instanceof PathNode) {
        if (node.features.some(f => avoidSet.has(f))) {
          prunedIds.add(node.id);
        }
      }
    }

    if (prunedIds.size === 0) return;

    // 2. Remove pruned nodes from the graph array
    for (let i = graph.length - 1; i >= 0; i--) {
      if (prunedIds.has(graph[i].id)) {
        graph.splice(i, 1);
      }
    }

    // 3. Strip edges leading into pruned nodes from all remaining nodes
    for (const node of graph) {
      node.neighbors = node.neighbors.filter(edge => !prunedIds.has(edge.to));
    }
  }
}
