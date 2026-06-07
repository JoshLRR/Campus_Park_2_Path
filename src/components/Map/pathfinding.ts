/**
 * pathfinding.ts
 *
 * `Pathfinder` — the map layer's routing facade over the live graph.
 * Wraps Dijkstra (point-to-point and "nearest room with feature") and
 * the local `PathAPI`/coordinate-based pathing, plus closest-node lookup,
 * normalizing every result into the UI-facing `PathResult` shape.
 */

import {GraphNode} from './GraphOverlay';
import {
  PathRequestDTO,
  PathResponseDTO,
  PositionDTO,
} from '../../logic/PathingComponent/api/PathAPI.dto';
import {createPathAPI} from '../../logic/PathingComponent/api/CreatePathingAPI';
import {DijkstraAlgorithm} from '../../logic/PathingComponent/application/DijkstraAlgorithm';
import type {Node} from '../../types/Node';
import type {GraphRepository} from '../../repositories/GraphRepository';

export interface PathResult {
  path: number[];
  totalDistance: number;
  success: boolean;
  message?: string;
}

export class Pathfinder {
  private readonly nodes: Map<number, GraphNode>;
  private readonly api: ReturnType<typeof createPathAPI>;

  constructor(graphNodes: GraphNode[]) {
    this.nodes = new Map(graphNodes.map(node => [node.id, node]));
    // Build the POI/coordinate API from live nodes, not the static graph.json.
    const liveRepo: GraphRepository = {
      getGraph: () => [...this.nodes.values()] as Node[],
    };
    this.api = createPathAPI(liveRepo);
  }

  /**
   * Find the shortest path between two nodes using Dijkstra on the live graph.
   */
  async findPath(startNodeId: number, endNodeId: number): Promise<PathResult> {
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

    const allNodes = [...this.nodes.values()] as Node[];

    // Prefer paths that don't cut through room nodes as shortcuts
    const roomNodeIds = new Set(
      [...this.nodes.values()]
        .filter(
          n => n.kind === 'room' && n.id !== startNodeId && n.id !== endNodeId,
        )
        .map(n => n.id),
    );

    let result = await new DijkstraAlgorithm(allNodes, roomNodeIds).findPath(
      startNodeId,
      {kind: 'node', nodeId: endNodeId},
    );

    // Fall back to full graph if no room-avoiding path exists
    if (result.status === 'not_found') {
      result = await new DijkstraAlgorithm(allNodes).findPath(startNodeId, {
        kind: 'node',
        nodeId: endNodeId,
      });
    }

    if (result.status === 'not_found') {
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: 'No path found',
      };
    }

    return {
      path: result.nodes,
      totalDistance: result.totalDistance,
      success: true,
    };
  }

  /**
   * Find a path from coordinates to a node using the local PathAPI
   */
  async findPathFromCoordinates(
    x: number,
    y: number,
    floor: number,
    endNodeId: number,
    scaleInverse: number = 0.1,
  ): Promise<PathResult> {
    if (!this.nodes.has(endNodeId)) {
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: 'Invalid destination node ID',
      };
    }

    const position: PositionDTO = {
      x: x * scaleInverse,
      y: y * scaleInverse,
      floorNum: floor,
    };

    const request: PathRequestDTO = {
      origin: {
        mode: 'coordinate',
        value: position,
      },
      destination: {
        mode: 'node',
        value: endNodeId.toString(),
      },
    };

    const result = await this.api.path(request);
    return this.transformApiResponse(result);
  }

  /**
   * Find a path to a POI type using the local PathAPI
   */
  async findPathToPOI(
    startNodeId: number,
    poiType: string,
    preferences?: {
      avoidStairs?: boolean;
      avoidUncovered?: boolean;
      avoidUnpaved?: boolean;
    },
  ): Promise<PathResult> {
    if (!this.nodes.has(startNodeId)) {
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: 'Invalid start node ID',
      };
    }

    const request: PathRequestDTO = {
      origin: {
        mode: 'node',
        value: startNodeId.toString(),
      },
      destination: {
        mode: 'poiType',
        value: poiType,
      },
      preferences,
    };

    const result = await this.api.path(request);
    return this.transformApiResponse(result);
  }

  /**
   * Transform the PathResponseDTO into our PathResult format
   */
  private transformApiResponse(response: PathResponseDTO): PathResult {
    switch (response.status) {
      case 'success':
        if (response.path) {
          return {
            path: response.path.nodes.map(nodeId => parseInt(nodeId, 10)),
            totalDistance: response.path.totalDistance,
            success: true,
            message: response.message,
          };
        }
        return {
          path: [],
          totalDistance: 0,
          success: false,
          message: 'API returned success but no path data',
        };

      case 'not_found':
        return {
          path: [],
          totalDistance: 0,
          success: false,
          message: response.message || 'No path found',
        };

      case 'validation_error':
        return {
          path: [],
          totalDistance: 0,
          success: false,
          message: response.message || 'Request validation failed',
        };

      case 'internal_error':
        return {
          path: [],
          totalDistance: 0,
          success: false,
          message: response.message || 'Internal server error',
        };

      default:
        return {
          path: [],
          totalDistance: 0,
          success: false,
          message: 'Unknown response status',
        };
    }
  }

  /**
   * Find the shortest path from a node to the nearest room (by graph
   * distance) whose features include the given feature ID.
   */
  async findNearestRoomWithFeature(
    startNodeId: number,
    featureId: number,
  ): Promise<PathResult & {targetNodeId?: number}> {
    if (!this.nodes.has(startNodeId)) {
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: 'Invalid start node ID',
      };
    }

    const shortestCostToNode = new Map<number, number>([[startNodeId, 0]]);
    const predecessorOnPath = new Map<number, number>();
    const settledNodes = new Set<number>();
    const queue: {nodeId: number; cumulativeCost: number}[] = [
      {nodeId: startNodeId, cumulativeCost: 0},
    ];

    while (queue.length > 0) {
      queue.sort((a, b) => a.cumulativeCost - b.cumulativeCost);
      const entry = queue.shift();
      if (entry === undefined) break;

      const {nodeId, cumulativeCost} = entry;
      if (settledNodes.has(nodeId)) continue;
      settledNodes.add(nodeId);

      const node = this.nodes.get(nodeId);
      if (node === undefined) continue;

      if (
        nodeId !== startNodeId &&
        node.kind === 'room' &&
        (node.features ?? []).includes(featureId)
      ) {
        const path: number[] = [];
        let current: number | undefined = nodeId;
        while (current !== undefined) {
          path.unshift(current);
          current = predecessorOnPath.get(current);
        }
        return {
          path,
          totalDistance: cumulativeCost,
          success: true,
          targetNodeId: nodeId,
        };
      }

      for (const edge of node.neighbors) {
        if (settledNodes.has(edge.to)) continue;
        const costThroughCurrent = cumulativeCost + edge.distance;
        if (
          costThroughCurrent < (shortestCostToNode.get(edge.to) ?? Infinity)
        ) {
          shortestCostToNode.set(edge.to, costThroughCurrent);
          predecessorOnPath.set(edge.to, nodeId);
          queue.push({nodeId: edge.to, cumulativeCost: costThroughCurrent});
        }
      }
    }

    return {
      path: [],
      totalDistance: 0,
      success: false,
      message: 'No reachable room with that feature was found',
    };
  }

  /**
   * Find the closest node on the given floor to (x, y).
   */
  findClosestNode(x: number, y: number, floor: number = 1): number | null {
    let closestNodeId: number | null = null;
    let minDistance = Infinity;

    for (const [nodeId, node] of this.nodes) {
      if (node.position.floorNum !== floor) continue;
      const dx = node.position.x - x;
      const dy = node.position.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < minDistance) {
        minDistance = distance;
        closestNodeId = nodeId;
      }
    }

    return closestNodeId;
  }
}
