// src/components/Map/pathfinding.ts
import {GraphNode} from './GraphOverlay';

export interface PathResult {
  path: number[];
  totalDistance: number;
  success: boolean;
}

export class Pathfinder {
  private nodes: Map<number, GraphNode>;

  constructor(graphNodes: GraphNode[]) {
    this.nodes = new Map(graphNodes.map(node => [node.id, node]));
  }

  /**
   * Find the shortest path between two nodes using Dijkstra's algorithm
   */
  findPath(startNodeId: number, endNodeId: number): PathResult {
    if (!this.nodes.has(startNodeId) || !this.nodes.has(endNodeId)) {
      return {path: [], totalDistance: 0, success: false};
    }

    if (startNodeId === endNodeId) {
      return {path: [startNodeId], totalDistance: 0, success: true};
    }

    // Initialize distances and previous nodes
    const distances = new Map<number, number>();
    const previous = new Map<number, number | null>();
    const unvisited = new Set<number>();

    // Set initial distances
    for (const [nodeId] of this.nodes) {
      distances.set(nodeId, nodeId === startNodeId ? 0 : Infinity);
      previous.set(nodeId, null);
      unvisited.add(nodeId);
    }

    while (unvisited.size > 0) {
      // Find unvisited node with minimum distance
      let currentNodeId: number | null = null;
      let minDistance = Infinity;

      for (const nodeId of unvisited) {
        const distance = distances.get(nodeId)!;
        if (distance < minDistance) {
          minDistance = distance;
          currentNodeId = nodeId;
        }
      }

      if (currentNodeId === null || minDistance === Infinity) {
        // No path exists
        break;
      }

      unvisited.delete(currentNodeId);

      // If we reached the destination
      if (currentNodeId === endNodeId) {
        break;
      }

      const currentNode = this.nodes.get(currentNodeId)!;
      const currentDistance = distances.get(currentNodeId)!;

      // Check all neighbors
      for (const neighbor of currentNode.neighbors) {
        if (!unvisited.has(neighbor.to)) continue;

        const alternativeDistance = currentDistance + neighbor.distance;
        const currentNeighborDistance = distances.get(neighbor.to)!;

        if (alternativeDistance < currentNeighborDistance) {
          distances.set(neighbor.to, alternativeDistance);
          previous.set(neighbor.to, currentNodeId);
        }
      }
    }

    // Reconstruct path
    const path: number[] = [];
    let currentNodeId: number | null = endNodeId;

    while (currentNodeId !== null) {
      path.unshift(currentNodeId);
      currentNodeId = previous.get(currentNodeId) || null;
    }

    const totalDistance = distances.get(endNodeId) || 0;
    const success = path.length > 0 && path[0] === startNodeId;

    return {
      path: success ? path : [],
      totalDistance,
      success,
    };
  }

  /**
   * Find the closest node to a given position
   */
  findClosestNode(
    x: number,
    y: number,
    scaleInverse: number = 0.1,
  ): number | null {
    let closestNodeId: number | null = null;
    let minDistance = Infinity;

    for (const [nodeId, node] of this.nodes) {
      // Convert map coordinates back to graph coordinates
      const nodeX = node.position.x;
      const nodeY = node.position.y;

      const distance = Math.sqrt(
        Math.pow(nodeX - x * scaleInverse, 2) +
          Math.pow(nodeY - y * scaleInverse, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestNodeId = nodeId;
      }
    }

    return closestNodeId;
  }
}
