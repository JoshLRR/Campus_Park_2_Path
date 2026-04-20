// src/components/Map/pathfinding.ts
import {GraphNode} from './GraphOverlay';
import {
  PathRequestDTO,
  PathResponseDTO,
  PositionDTO,
} from '../../logic/PathingComponent/api/PathAPI.dto';

export interface PathResult {
  path: number[];
  totalDistance: number;
  success: boolean;
  message?: string;
}

export class Pathfinder {
  private nodes: Map<number, GraphNode>;
  private apiBaseUrl: string;

  constructor(
    graphNodes: GraphNode[],
    apiBaseUrl: string = 'http://localhost:3001/api',
  ) {
    this.nodes = new Map(graphNodes.map(node => [node.id, node]));
    this.apiBaseUrl = apiBaseUrl;
  }

  /**
   * Find the shortest path between two nodes using the backend PathAPI
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

    try {
      // Prepare the API request
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

      // Make the API call
      const response = await fetch(`${this.apiBaseUrl}/path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const result: PathResponseDTO = await response.json();

      // Transform the API response to our expected format
      return this.transformApiResponse(result);
    } catch (error) {
      console.error('Pathfinding API error:', error);
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown API error',
      };
    }
  }

  /**
   * Find a path from coordinates to a node using the backend PathAPI
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

    try {
      // Convert map coordinates to graph coordinates
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

      const response = await fetch(`${this.apiBaseUrl}/path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const result: PathResponseDTO = await response.json();
      return this.transformApiResponse(result);
    } catch (error) {
      console.error('Pathfinding API error:', error);
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown API error',
      };
    }
  }

  /**
   * Find a path to a POI type using the backend PathAPI
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

    try {
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

      const response = await fetch(`${this.apiBaseUrl}/path`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const result: PathResponseDTO = await response.json();
      return this.transformApiResponse(result);
    } catch (error) {
      console.error('Pathfinding API error:', error);
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: error instanceof Error ? error.message : 'Unknown API error',
      };
    }
  }

  /**
   * Transform the PathResponseDTO from the API into our PathResult format
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
          message: 'Unknown API response status',
        };
    }
  }

  /**
   * Find the closest node to a given position (kept local for UI responsiveness)
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

  /**
   * Get the current API base URL
   */
  getApiBaseUrl(): string {
    return this.apiBaseUrl;
  }

  /**
   * Update the API base URL
   */
  setApiBaseUrl(url: string): void {
    this.apiBaseUrl = url;
  }
}
