/**
 * filterRooms.ts
 *
 * Filters rooms by name, building, or floor using a search term.
 *
 * This helper was extracted from App.tsx without changing behavior.
 */

import {Room} from '../components/Map/MapView';
import {FEATURE_LABELS} from './featureLabels';

type RoomWithId = Room & {
  id: number;
};

export function filterRooms(
  rooms: RoomWithId[],
  searchTerm: string,
): RoomWithId[] {
  const term = searchTerm.toLowerCase();
  return rooms.filter(
    room =>
      room.name.toLowerCase().includes(term) ||
      room.building.toLowerCase().includes(term) ||
      room.floor.toString().includes(term) ||
      (room.features ?? []).some(f =>
        (FEATURE_LABELS[f] ?? '').toLowerCase().includes(term),
      ),
  );
}
