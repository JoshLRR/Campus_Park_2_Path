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

/**
 * Returns the label of the first feature on the room that matches the search
 * term, or null if the term didn't match via a feature.
 */
export function matchedFeatureLabel(
  room: RoomWithId,
  searchTerm: string,
): string | null {
  const term = searchTerm.toLowerCase();
  if (!term) return null;
  const matchedFeatureId = (room.features ?? []).find(f =>
    (FEATURE_LABELS[f] ?? '').toLowerCase().includes(term),
  );
  return matchedFeatureId !== undefined
    ? (FEATURE_LABELS[matchedFeatureId] ?? null)
    : null;
}
