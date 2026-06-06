import type {PathAlgorithm} from './PathAlgorithm';
import type {Node, NodeId} from '../../../types/Node';
import type {PathDestination} from '../../../types/PathRequest';
import type {PathResult} from '../../../types/PathResponse';
import {RoomNode} from '../../../types/RoomNode';
import {RoomFeatures} from '../../../types/RoomFeatures';

const NO_PREDECESSOR: NodeId = -1;
const UNREACHABLE_COST = Infinity;

type QueueEntry = {nodeId: NodeId; cumulativeCost: number};

/**
 * Dijkstra's algorithm implementation of `PathAlgorithm`.
 *
 * Supports two destination strategies:
 *  - `kind: 'node'`    — point-to-point; terminates when the target node is settled.
 *  - `kind: 'poiType'` — nearest POI; terminates when the first `RoomNode` whose
 *                        `features` include the requested POI type is settled.
 *
 * The graph is injected at construction and treated as read-only.
 */
export class DijkstraAlgorithm implements PathAlgorithm {
  private readonly nodeById: Map<NodeId, Node>;
  private readonly blockedNodeIds: Set<NodeId>;

  constructor(graph: Node[], blockedNodeIds: Set<NodeId> = new Set()) {
    this.nodeById = new Map(graph.map(node => [node.id, node]));
    this.blockedNodeIds = blockedNodeIds;
  }

  async findPath(
    startNodeId: NodeId,
    destination: PathDestination,
  ): Promise<PathResult> {
    const shortestCostToNode = new Map<NodeId, number>();
    const predecessorOnPath = new Map<NodeId, NodeId>();

    for (const nodeId of this.nodeById.keys()) {
      shortestCostToNode.set(nodeId, UNREACHABLE_COST);
      predecessorOnPath.set(nodeId, NO_PREDECESSOR);
    }
    shortestCostToNode.set(startNodeId, 0);

    const settledNodes = new Set<NodeId>();
    const queue: QueueEntry[] = [{nodeId: startNodeId, cumulativeCost: 0}];

    while (queue.length > 0) {
      queue.sort((a, b) => a.cumulativeCost - b.cumulativeCost);
      const entry = queue.shift();
      if (entry === undefined) break;

      const {nodeId, cumulativeCost} = entry;

      if (settledNodes.has(nodeId)) continue;
      settledNodes.add(nodeId);

      const currentNode = this.nodeById.get(nodeId);
      if (currentNode === undefined) continue;

      if (this.isDestinationNode(currentNode, destination)) {
        return this.reconstructPath(
          nodeId,
          predecessorOnPath,
          shortestCostToNode,
        );
      }

      for (const edge of currentNode.neighbors) {
        if (settledNodes.has(edge.to)) continue;
        if (this.blockedNodeIds.has(edge.to)) continue;
        const costThroughCurrent = cumulativeCost + edge.distance;
        if (
          costThroughCurrent <
          (shortestCostToNode.get(edge.to) ?? UNREACHABLE_COST)
        ) {
          shortestCostToNode.set(edge.to, costThroughCurrent);
          predecessorOnPath.set(edge.to, nodeId);
          queue.push({nodeId: edge.to, cumulativeCost: costThroughCurrent});
        }
      }
    }

    return {status: 'not_found'};
  }

  private isDestinationNode(node: Node, destination: PathDestination): boolean {
    if (destination.kind === 'node') {
      return node.id === destination.nodeId;
    }

    // POI destination: match the first settled RoomNode with the requested feature
    if (!(node instanceof RoomNode)) return false;
    const targetFeature = (RoomFeatures as Record<string, number>)[
      destination.poiType
    ];
    if (targetFeature === undefined) return false;
    return node.features.includes(targetFeature as RoomFeatures);
  }

  private reconstructPath(
    destinationNodeId: NodeId,
    predecessorOnPath: Map<NodeId, NodeId>,
    shortestCostToNode: Map<NodeId, number>,
  ): PathResult {
    const orderedNodes: NodeId[] = [];
    let currentNodeId: NodeId = destinationNodeId;
    while (currentNodeId !== NO_PREDECESSOR) {
      orderedNodes.unshift(currentNodeId);
      currentNodeId = predecessorOnPath.get(currentNodeId) ?? NO_PREDECESSOR;
    }
    return {
      status: 'found',
      nodes: orderedNodes,
      totalDistance: shortestCostToNode.get(destinationNodeId) ?? 0,
      warnings: [],
    };
  }
}
