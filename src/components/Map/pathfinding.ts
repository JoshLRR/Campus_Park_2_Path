// src/components/Map/pathfinding.ts
import {GraphNode} from './GraphOverlay';
import {
  PathRequestDTO,
  PathResponseDTO,
  PositionDTO,
} from '../../logic/PathingComponent/api/PathAPI.dto';
import {createPathAPI} from '../../logic/PathingComponent/api/CreatePathingAPI';

export interface PathResult {
  path: number[];
  totalDistance: number;
  success: boolean;
  message?: string;
}

const api = createPathAPI();

export class Pathfinder {
  private nodes: Map<number, GraphNode>;

  constructor(graphNodes: GraphNode[]) {
    this.nodes = new Map(graphNodes.map(node => [node.id, node]));
  }

  /**
   * Find the shortest path between two nodes using the local PathAPI
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

    const request: PathRequestDTO = {
      origin: {
        mode: 'node',
        value: startNodeId.toString(),
      },
      destination: {
        mode: 'node',
        value: endNodeId.toString(),
      },
    };

    const result = await api.path(request);
    return this.transformApiResponse(result);
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

    const result = await api.path(request);
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

    const result = await api.path(request);
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
