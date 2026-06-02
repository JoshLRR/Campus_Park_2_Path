/**
 * getRoomPosition.ts
 *
 * Finds the map position for a room based on its associated building data.
 *
 * This helper was extracted from App.tsx without changing behavior.
 */

import {Building, Room} from '../components/Map/MapView';

type BuildingWithId = Building & {
  id: number;
};

type RoomWithId = Room & {
  id: number;
};

type RoomPosition = {
  x: number;
  y: number;
};

export function getRoomPosition(
  room: RoomWithId,
  buildings: BuildingWithId[],
): RoomPosition {
  const building = buildings.find(b => b.name === room.building);

  if (!building) {
    return {x: 0, y: 0};
  }

  return {
    x: building.x + room.x,
    y: building.y + room.y,
  };
}
