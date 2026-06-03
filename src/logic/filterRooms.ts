/**
 * filterRooms.ts
 *
 * Filters rooms by name, building, or floor using a search term.
 *
 * This helper was extracted from App.tsx without changing behavior.
 */

import {Room} from '../components/Map/MapView';

type RoomWithId = Room & {
  id: number;
};

export function filterRooms(
  rooms: RoomWithId[],
  searchTerm: string,
): RoomWithId[] {
  return rooms.filter(
    room =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.building.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.floor.toString().includes(searchTerm),
  );
}
