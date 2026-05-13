import type {Node, NodeId} from '../../../../types/Node';
import {PathNode} from '../../../../types/PathNode';
import type {PathFeatures} from '../../../../types/PathFeatures';

/**
 * Penalty multiplier applied to edges whose destination node has a feature
 * the user wants to avoid. Edges are never removed — only made more costly.
 *
 * TODO: make configurable per-feature or per-request.
 */
const AVOID_PENALTY_MULTIPLIER = 10;

/**
 * Adjusts edge traversal costs based on soft routing preferences.
 *
 * Operates directly on the graph passed in. Unlike `EdgePruning`, this
 * class never removes nodes or edges — it only inflates distances so
 * the algorithm naturally prefers routes that respect user preferences.
 *
 * Examples of preferences applied here:
 *  - Prefer covered walkways — uncovered edges penalised
 *  - Prefer indoor paths — outdoor edges penalised
 *  - Prefer well-lit areas — unlit edges penalised
 */
export class EdgeWeighting {
  /**
   * Mutates edge distances in `graph` in place.
   *
   * For each edge whose destination node carries a feature in `avoidFeatures`,
   * the edge's distance is multiplied by {@link AVOID_PENALTY_MULTIPLIER}.
   *
   * @param graph         - Cloned working graph (will be mutated).
   * @param avoidFeatures - Soft preferences from the routing request.
   */
  weight(graph: Node[], avoidFeatures: PathFeatures[]): void {
    if (avoidFeatures.length === 0) return;

    const avoidSet = new Set(avoidFeatures);

    // Index PathNode features by node ID for O(1) lookup during edge traversal
    const featuresByNodeId = new Map<NodeId, PathFeatures[]>();
    for (const node of graph) {
      if (node instanceof PathNode) {
        featuresByNodeId.set(node.id, node.features);
      }
    }

    for (const node of graph) {
      for (const edge of node.neighbors) {
        const destFeatures = featuresByNodeId.get(edge.to);
        if (destFeatures && destFeatures.some(f => avoidSet.has(f))) {
          edge.distance *= AVOID_PENALTY_MULTIPLIER;
        }
      }
    }
  }
}
