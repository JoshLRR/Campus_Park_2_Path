/**
 * getFloorStats.ts
 *
 * Calculates floor-level graph and room statistics for the active floor.
 *
 * This helper was extracted from App.tsx without changing behavior.
 */

import {GraphNode} from '../components/Map/GraphOverlay';
import {Room} from '../components/Map/MapView';

type RoomWithId = Room & {
  id: number;
};

export type FloorStats = {
  nodes: number;
  pathNodes: number;
  roomNodes: number;
  rooms: number;
};

export function getFloorStats(
  graphNodes: GraphNode[],
  rooms: RoomWithId[],
  currentFloor: number,
): FloorStats {
  const currentFloorNodes = graphNodes.filter(
    n => n.position.floorNum === currentFloor,
  );
  const currentFloorRooms = rooms.filter(r => r.floor === currentFloor);

  return {
    nodes: currentFloorNodes.length,
    pathNodes: currentFloorNodes.filter(n => n.kind === 'path').length,
    roomNodes: currentFloorNodes.filter(n => n.kind === 'room').length,
    rooms: currentFloorRooms.length,
  };
}
