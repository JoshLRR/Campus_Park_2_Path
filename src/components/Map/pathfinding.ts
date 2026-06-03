// src/components/Map/pathfinding.ts
import {GraphNode} from './GraphOverlay';

export interface PathResult {
  path: number[];
  totalDistance: number;
  success: boolean;
  message?: string;
}

const NO_PREDECESSOR = -1;
const UNREACHABLE_COST = Infinity;

type QueueEntry = {nodeId: number; cumulativeCost: number};

/**
 * Dijkstra's shortest-path algorithm.
 *
 * Operates directly on the local graph — no API calls are made.
 *
 * @param graph    - All nodes available on the map.
 * @param startId  - ID of the origin node.
 * @param endId    - ID of the destination node.
 * @returns A `PathResult` with the ordered node IDs and total distance,
 *          or a failure result if no path exists.
 */
function dijkstra(
  graph: Map<number, GraphNode>,
  startId: number,
  endId: number,
): PathResult {
  const shortestCost = new Map<number, number>();
  const predecessor = new Map<number, number>();

  for (const nodeId of graph.keys()) {
    shortestCost.set(nodeId, UNREACHABLE_COST);
    predecessor.set(nodeId, NO_PREDECESSOR);
  }
  shortestCost.set(startId, 0);

  const settled = new Set<number>();
  const queue: QueueEntry[] = [{nodeId: startId, cumulativeCost: 0}];

  while (queue.length > 0) {
    queue.sort((a, b) => a.cumulativeCost - b.cumulativeCost);
    const entry = queue.shift();
    if (entry === undefined) break;

    const {nodeId, cumulativeCost} = entry;

    if (settled.has(nodeId)) continue;
    settled.add(nodeId);

    if (nodeId === endId) {
      // Reconstruct path
      const orderedNodes: number[] = [];
      let current = endId;
      while (current !== NO_PREDECESSOR) {
        orderedNodes.unshift(current);
        current = predecessor.get(current) ?? NO_PREDECESSOR;
      }
      return {
        path: orderedNodes,
        totalDistance: shortestCost.get(endId) ?? 0,
        success: true,
      };
    }

    const currentNode = graph.get(nodeId);
    if (currentNode === undefined) continue;

    for (const edge of currentNode.neighbors) {
      if (settled.has(edge.to)) continue;
      const costThroughCurrent = cumulativeCost + edge.distance;
      if (costThroughCurrent < (shortestCost.get(edge.to) ?? UNREACHABLE_COST)) {
        shortestCost.set(edge.to, costThroughCurrent);
        predecessor.set(edge.to, nodeId);
        queue.push({nodeId: edge.to, cumulativeCost: costThroughCurrent});
      }
    }
  }

  return {path: [], totalDistance: 0, success: false, message: 'No path found'};
}

export class Pathfinder {
  private nodes: Map<number, GraphNode>;

  constructor(graphNodes: GraphNode[]) {
    this.nodes = new Map(graphNodes.map(node => [node.id, node]));
  }

  /**
   * Find the shortest path between two nodes using Dijkstra's algorithm.
   * Runs entirely locally — no external API calls are made.
   */
  findPath(startNodeId: number, endNodeId: number): PathResult {
    if (!this.nodes.has(startNodeId) || !this.nodes.has(endNodeId)) {
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: 'Invalid node IDs',
      };
    }

    if (startNodeId === endNodeId) {
      return {path: [startNodeId], totalDistance: 0, success: true};
    }

    return dijkstra(this.nodes, startNodeId, endNodeId);
  }

  /**
   * Find the closest node to a given position
   */
  findClosestNode(
    x: number,
    y: number,
    floor: number,
  ): number | null {
    let closestNodeId: number | null = null;
    let minDistance = Infinity;

    for (const [nodeId, node] of this.nodes) {
      if (node.position.floorNum !== floor) continue;
      const nodeX = node.position.x;
      const nodeY = node.position.y;

      const distance = Math.sqrt(
        Math.pow(nodeX - x, 2) +
        Math.pow(nodeY - y, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestNodeId = nodeId;
      }
    }

    return closestNodeId;
  }
}
