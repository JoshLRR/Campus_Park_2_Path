import {GraphNode} from './GraphOverlay';
import { MAP_CONSTANTS } from './MapConstants';

export interface PathResult {
  path: number[];
  totalDistance: number;
  success: boolean;
  message?: string;
}

interface QueueEntry {
  nodeId: number;
  cost: number;
}

export class Pathfinder {
  private nodes: Map<number, GraphNode>;

  constructor(graphNodes: GraphNode[]) {
    this.nodes = new Map(graphNodes.map(node => [node.id, node]));
    console.log(`[Pathfinder] Initialized with ${this.nodes.size} nodes`);
  }

  /**
   * Find the shortest path between two nodes using Dijkstra's algorithm
   */
  async findPath(startNodeId: number, endNodeId: number): Promise<PathResult> {
    console.log(`[Pathfinder] Finding path from ${startNodeId} to ${endNodeId}`);

    const startNode = this.nodes.get(startNodeId);
    const endNode = this.nodes.get(endNodeId);

    if (!startNode || !endNode) {
      console.error(`[Pathfinder] Invalid node IDs - Start exists: ${!!startNode}, End exists: ${!!endNode}`);
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: `Invalid node IDs - Start: ${startNodeId}, End: ${endNodeId}`,
      };
    }

    console.log(`[Pathfinder] Start node:`, {
      id: startNode.id,
      kind: startNode.kind,
      floor: startNode.position.floorNum,
      neighbors: startNode.neighbors.length,
    });

    console.log(`[Pathfinder] End node:`, {
      id: endNode.id,
      kind: endNode.kind,
      floor: endNode.position.floorNum,
      neighbors: endNode.neighbors.length,
    });

    if (startNodeId === endNodeId) {
      return {path: [startNodeId], totalDistance: 0, success: true};
    }

    // Run Dijkstra's algorithm
    const result = this.dijkstra(startNodeId, endNodeId);

    if (result.path.length === 0) {
      console.error(`[Pathfinder] No path found between nodes ${startNodeId} and ${endNodeId}`);
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: 'No path found between the selected nodes. They may be on disconnected graph components.',
      };
    }

    console.log(`[Pathfinder] Path found with ${result.path.length} waypoints, distance: ${result.distance.toFixed(2)}`);
    return {
      path: result.path,
      totalDistance: result.distance,
      success: true,
      message: `Route found with ${result.path.length} waypoints`,
    };
  }

  /**
   * Dijkstra's algorithm implementation
   */
  private dijkstra(
    startNodeId: number,
    endNodeId: number,
  ): {path: number[]; distance: number} {
    const distances = new Map<number, number>();
    const previous = new Map<number, number | null>();
    const visited = new Set<number>();
    const queue: QueueEntry[] = [];

    // Initialize distances
    for (const nodeId of this.nodes.keys()) {
      distances.set(nodeId, Infinity);
      previous.set(nodeId, null);
    }
    distances.set(startNodeId, 0);

    // Add start node to queue
    queue.push({nodeId: startNodeId, cost: 0});

    let iterations = 0;
    const maxIterations = this.nodes.size * 10; // Safety limit

    while (queue.length > 0 && iterations < maxIterations) {
      iterations++;

      // Sort queue by cost and get node with minimum cost
      queue.sort((a, b) => a.cost - b.cost);
      const current = queue.shift();

      if (!current) break;

      const {nodeId: currentNodeId, cost: currentCost} = current;

      // Skip if already visited
      if (visited.has(currentNodeId)) continue;

      // Mark as visited
      visited.add(currentNodeId);

      // If we reached the destination, we're done
      if (currentNodeId === endNodeId) {
        console.log(`[Dijkstra] Found path after ${iterations} iterations, visited ${visited.size} nodes`);
        break;
      }

      // Get current node
      const currentNode = this.nodes.get(currentNodeId);
      if (!currentNode) {
        console.warn(`[Dijkstra] Node ${currentNodeId} not found in graph`);
        continue;
      }

      // Check all neighbors
      for (const neighbor of currentNode.neighbors) {
        const neighborNodeId = neighbor.to;

        // Verify neighbor exists in graph
        if (!this.nodes.has(neighborNodeId)) {
          console.warn(`[Dijkstra] Neighbor ${neighborNodeId} referenced by node ${currentNodeId} doesn't exist in graph`);
          continue;
        }

        // Skip if already visited
        if (visited.has(neighborNodeId)) continue;

        // Calculate new distance
        const newDistance = currentCost + neighbor.distance;
        const oldDistance = distances.get(neighborNodeId) ?? Infinity;

        console.log(`[Dijkstra] Checking neighbor ${neighborNodeId}: current cost=${currentCost.toFixed(2)}, edge distance=${neighbor.distance.toFixed(2)}, new distance=${newDistance.toFixed(2)}, old distance=${oldDistance === Infinity ? 'Infinity' : oldDistance.toFixed(2)}`);

        // If we found a shorter path, update it
        if (newDistance < oldDistance) {
          distances.set(neighborNodeId, newDistance);
          previous.set(neighborNodeId, currentNodeId);

          // Add to queue
          queue.push({
            nodeId: neighborNodeId,
            cost: newDistance,
          });
        }
      }
    }

    if (iterations >= maxIterations) {
      console.error(`[Dijkstra] Hit max iterations (${maxIterations})`);
    }

    // Check if we reached the destination
    if (!visited.has(endNodeId)) {
      console.error(`[Dijkstra] End node ${endNodeId} was never reached. Visited ${visited.size} nodes.`);

      // Debug: Check if nodes are on same floor
      const startNode = this.nodes.get(startNodeId);
      const endNode = this.nodes.get(endNodeId);
      if (startNode && endNode) {
        console.error(`[Dijkstra] Start floor: ${startNode.position.floorNum}, End floor: ${endNode.position.floorNum}`);

        // Check if start and end nodes have any neighbors
        console.error(`[Dijkstra] Start node has ${startNode.neighbors.length} neighbors`);
        console.error(`[Dijkstra] End node has ${endNode.neighbors.length} neighbors`);

        // Check if nodes are in disconnected components
        if (startNode.neighbors.length === 0) {
          console.error(`[Dijkstra] Start node ${startNodeId} is isolated (no neighbors)!`);
        }
        if (endNode.neighbors.length === 0) {
          console.error(`[Dijkstra] End node ${endNodeId} is isolated (no neighbors)!`);
        }
      }

      return {path: [], distance: 0};
    }

    // Reconstruct path
    const path: number[] = [];
    let currentNodeId: number | null = endNodeId;

    // Build path backwards from end to start
    while (currentNodeId !== null) {
      path.unshift(currentNodeId);
      if (currentNodeId === startNodeId) break;
      currentNodeId = previous.get(currentNodeId) ?? null;

      // Safety check for infinite loop
      if (path.length > this.nodes.size) {
        console.error(`[Dijkstra] Path reconstruction exceeded node count - possible cycle detected`);
        return {path: [], distance: 0};
      }
    }

    // Verify the path is complete
    if (path[0] !== startNodeId || path[path.length - 1] !== endNodeId) {
      console.error(`[Dijkstra] Path reconstruction failed - Start: ${path[0]}, End: ${path[path.length - 1]}`);
      return {path: [], distance: 0};
    }

    const finalDistance = distances.get(endNodeId) ?? 0;

    console.log(`[Dijkstra] Path reconstruction complete:`);
    console.log(`  - Path nodes: ${path.join(' → ')}`);
    console.log(`  - Final distance from distances map: ${finalDistance.toFixed(2)}`);

    // Debug: Calculate distance by walking the path
    let calculatedDistance = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const currentId = path[i];
      const nextId = path[i + 1];
      const currentNode = this.nodes.get(currentId);

      if (currentNode) {
        const edge = currentNode.neighbors.find(n => n.to === nextId);
        if (edge) {
          calculatedDistance += edge.distance;
          console.log(`  - Edge ${currentId} → ${nextId}: ${edge.distance.toFixed(2)} (running total: ${calculatedDistance.toFixed(2)})`);
        } else {
          console.error(`  - Missing edge ${currentId} → ${nextId}!`);
        }
      }
    }

    console.log(`  - Calculated total by walking path: ${calculatedDistance.toFixed(2)}`);
    console.log(`  - Distances map value: ${finalDistance.toFixed(2)}`);

    return {path, distance: finalDistance};
  }
  /**
   * Find a path from coordinates to a node
   */
  async findPathFromCoordinates(
    x: number,
    y: number,
    floor: number,
    endNodeId: number,
  ): Promise<PathResult> {
    // Find the closest node to the starting coordinates
    const startNodeId = this.findClosestNode(x, y, floor);

    if (startNodeId === null) {
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: 'Could not find a node near the starting coordinates',
      };
    }

    console.log(`[Pathfinder] Found closest node ${startNodeId} to coordinates (${x}, ${y}) on floor ${floor}`);

    // Use regular pathfinding from the closest node
    return this.findPath(startNodeId, endNodeId);
  }

  /**
   * Find a path to a specific point of interest (POI) type
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

    // Find all nodes that match the POI type
    const poiNodes: number[] = [];
    for (const [nodeId, node] of this.nodes) {
      if (node.kind === 'room' && node.roomNumber?.includes(poiType)) {
        poiNodes.push(nodeId);
      }
    }

    if (poiNodes.length === 0) {
      return {
        path: [],
        totalDistance: 0,
        success: false,
        message: `No POI of type "${poiType}" found`,
      };
    }

    // Find the shortest path to any of the POI nodes
    let bestResult: PathResult | null = null;
    let shortestDistance = Infinity;

    for (const poiNodeId of poiNodes) {
      const result = await this.findPath(startNodeId, poiNodeId);
      if (result.success && result.totalDistance < shortestDistance) {
        shortestDistance = result.totalDistance;
        bestResult = result;
      }
    }

    if (bestResult) {
      return bestResult;
    }

    return {
      path: [],
      totalDistance: 0,
      success: false,
      message: `No path found to POI type "${poiType}"`,
    };
  }

  /**
   * Find the closest node to a given position
   */
  findClosestNode(
    x: number,
    y: number,
    floor?: number,
  ): number | null {
    let closestNodeId: number | null = null;
    let minDistance = Infinity;

    // Convert map coordinates to graph coordinates using centralized constants
    const inputGraphX = (x - MAP_CONSTANTS.OFFSET_X) / MAP_CONSTANTS.GRAPH_SCALE;
    const inputGraphY = (y - MAP_CONSTANTS.OFFSET_Y) / MAP_CONSTANTS.GRAPH_SCALE;

    console.log(`[findClosestNode] Looking for node near map coords (${x.toFixed(1)}, ${y.toFixed(1)}) = graph coords (${inputGraphX.toFixed(1)}, ${inputGraphY.toFixed(1)})${floor !== undefined ? ` on floor ${floor}` : ''}`);

    for (const [nodeId, node] of this.nodes) {
      // If floor is specified, only consider nodes on that floor
      if (floor !== undefined && node.position.floorNum !== floor) {
        continue;
      }

      const nodeX = node.position.x;
      const nodeY = node.position.y;

      const distance = Math.sqrt(
        Math.pow(nodeX - inputGraphX, 2) + Math.pow(nodeY - inputGraphY, 2),
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestNodeId = nodeId;
      }
    }

    if (closestNodeId !== null) {
      const closestNode = this.nodes.get(closestNodeId);
      console.log(`[findClosestNode] Found node ${closestNodeId} (${closestNode?.kind}) at distance ${minDistance.toFixed(2)}`);
    } else {
      console.error(`[findClosestNode] No node found!`);
    }

    return closestNodeId;
  }

  /**
   * Get all nodes on a specific floor
   */
  getNodesOnFloor(floor: number): GraphNode[] {
    return Array.from(this.nodes.values()).filter(
      node => node.position.floorNum === floor,
    );
  }

  /**
   * Get node by ID
   */
  getNode(nodeId: number): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Debug: Check graph connectivity
   */
  checkGraphConnectivity(nodeId: number): void {
    const node = this.nodes.get(nodeId);
    if (!node) {
      console.error(`[checkGraphConnectivity] Node ${nodeId} not found`);
      return;
    }

    console.log(`[checkGraphConnectivity] Node ${nodeId} (${node.kind}) on floor ${node.position.floorNum}:`);
    console.log(`  - Position: (${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)})`);
    console.log(`  - Neighbors: ${node.neighbors.length}`);

    if (node.neighbors.length > 0) {
      console.log(`  - Neighbor details:`);
      node.neighbors.forEach(neighbor => {
        const neighborNode = this.nodes.get(neighbor.to);
        if (neighborNode) {
          console.log(`    → ${neighbor.to} (${neighborNode.kind}, floor ${neighborNode.position.floorNum}, distance: ${neighbor.distance.toFixed(2)})`);
        } else {
          console.log(`    → ${neighbor.to} (NOT FOUND IN GRAPH!)`);
        }
      });
    }
  }
}
