import type {Node} from '../../../../types/Node';
import type {PathRequest} from '../../../../types/PathRequest';
import {EdgePruning} from './EdgePruning';
import {EdgeWeighting} from './EdgeWeighting';

/**
 * Applies routing constraints and preference policies to the campus graph
 * for a specific `PathRequest`.
 *
 * Rather than operating on the authoritative graph, `GraphContextBuilder`
 * first produces a shallow clone of the node array and deep-clones each
 * node's `neighbors` list so that mutations are isolated to this request.
 *
 * Composition order:
 *  1. {@link EdgePruning}   — hard constraints (removes nodes/edges entirely)
 *  2. {@link EdgeWeighting} — soft preferences (inflates edge costs)
 */
export class GraphContextBuilder {
  private readonly pruner = new EdgePruning();
  private readonly weighter = new EdgeWeighting();

  /**
   * Returns a mutated copy of `graph` with context rules applied.
   *
   * The original `graph` array and its node objects are never modified.
   *
   * @param graph   - The immutable base campus graph.
   * @param request - The validated routing request.
   * @returns A context-decorated graph ready for path-finding.
   */
  build(graph: Node[], request: PathRequest): Node[] {
    // Clone each node while preserving its prototype (PathNode / RoomNode
    // subclass checks in EdgePruning and EdgeWeighting rely on instanceof).
    // Neighbors are deep-cloned so distance mutations stay isolated.
    const workingGraph: Node[] = graph.map(node =>
      Object.assign(Object.create(Object.getPrototypeOf(node)), node, {
        neighbors: node.neighbors.map(edge => ({...edge})),
      }),
    );

    this.pruner.prune(workingGraph, request.avoidFeatures);
    this.weighter.weight(workingGraph, request.avoidFeatures);

    return workingGraph;
  }
}
