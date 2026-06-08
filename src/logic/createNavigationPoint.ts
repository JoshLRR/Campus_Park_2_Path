/**
 * createNavigationPoint.ts
 *
 * Builds NavigationPoint objects from room and graph node selections.
 *
 * This helper was extracted from App.tsx without changing behavior.
 */

import {GraphNode} from '../components/Map/GraphOverlay';
import {Building, NavigationPoint, Room} from '../components/Map/MapView';
import {getRoomPosition} from './getRoomPosition';

type BuildingWithId = Building & {
  id: number;
};

type RoomWithId = Room & {
  id: number;
};

export function createNavigationPointFromRoom(
  room: RoomWithId,
  buildings: BuildingWithId[],
  displayLabel?: string,
): NavigationPoint {
  const position = getRoomPosition(room, buildings);

  return {
    x: position.x,
    y: position.y,
    label: displayLabel ?? room.name,
    roomId: room.id,
    floor: room.floor,
  };
}

export function createNavigationPointFromGraphNode(
  node: GraphNode,
): NavigationPoint {
  return {
    x: node.position.x,
    y: node.position.y,
    label: node.roomNumber || `Node ${node.id}`,
    roomId: node.kind === 'room' ? node.id : undefined,
    floor: node.position.floorNum,
  };
}
