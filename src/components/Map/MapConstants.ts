/**
 * Centralized map coordinate transformation constants.
 * 
 * These values define how graph coordinates are transformed to map coordinates.
 * All map components (GraphOverlay, RouteOverlay, pathfinding) use these values
 * to ensure consistent coordinate transformations across the application.
 * 
 * Transformation formula:
 *   mapX = graphX * GRAPH_SCALE + OFFSET_X
 *   mapY = graphY * GRAPH_SCALE + OFFSET_Y
 * 
 * Change these values in ONE place to adjust the entire map transformation.
 */

export const MAP_CONSTANTS = {
  /** Base scale factor for graph coordinates */
  SCALE_FACTOR: 7,
  
  /** Calculated scale (SCALE_FACTOR - 1.5) */
  get GRAPH_SCALE() {
    return this.SCALE_FACTOR - 1.5;
  },
  
  /** X-axis offset for coordinate transformation */
  OFFSET_X: -2080,
  
  /** Y-axis offset for coordinate transformation */
  OFFSET_Y: -70,
  
  /** World dimensions for the map canvas */
  WORLD_WIDTH: 20000,
  WORLD_HEIGHT: 20000,
} as const;

/**
 * Standard transformation function: Graph coordinates → Map coordinates
 */
export function graphToMapCoords(pos: { x: number; y: number }): { x: number; y: number } {
  return {
    x: pos.x * MAP_CONSTANTS.GRAPH_SCALE + MAP_CONSTANTS.OFFSET_X,
    y: pos.y * MAP_CONSTANTS.GRAPH_SCALE + MAP_CONSTANTS.OFFSET_Y,
  };
}

/**
 * Inverse transformation function: Map coordinates → Graph coordinates
 */
export function mapToGraphCoords(pos: { x: number; y: number }): { x: number; y: number } {
  return {
    x: (pos.x - MAP_CONSTANTS.OFFSET_X) / MAP_CONSTANTS.GRAPH_SCALE,
    y: (pos.y - MAP_CONSTANTS.OFFSET_Y) / MAP_CONSTANTS.GRAPH_SCALE,
  };
}
