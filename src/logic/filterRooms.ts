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

// Match ranks, lowest sorts first (best match):
//   0 — exact match (room name/number or feature label equals the term)
//   1 — partial match on room name, building, or floor
//   2 — partial match on a feature label
const EXACT_MATCH_RANK = 0;
const PARTIAL_ROOM_MATCH_RANK = 1;
const PARTIAL_FEATURE_MATCH_RANK = 2;

function getMatchRank(room: RoomWithId, term: string): number | null {
  if (!term) return EXACT_MATCH_RANK;

  const name = room.name.toLowerCase();
  const building = room.building.toLowerCase();
  const floor = room.floor.toString();
  const featureLabels = (room.features ?? []).map(f =>
    (FEATURE_LABELS[f] ?? '').toLowerCase(),
  );

  const isExactMatch =
    name === term || featureLabels.some(label => label === term);
  if (isExactMatch) return EXACT_MATCH_RANK;

  const isPartialRoomMatch =
    name.includes(term) || building.includes(term) || floor.includes(term);
  if (isPartialRoomMatch) return PARTIAL_ROOM_MATCH_RANK;

  const isPartialFeatureMatch = featureLabels.some(label =>
    label.includes(term),
  );
  if (isPartialFeatureMatch) return PARTIAL_FEATURE_MATCH_RANK;

  return null;
}

export function filterRooms(
  rooms: RoomWithId[],
  searchTerm: string,
): RoomWithId[] {
  const term = searchTerm.toLowerCase();

  return rooms
    .map(room => ({room, rank: getMatchRank(room, term)}))
    .filter(
      (entry): entry is {room: RoomWithId; rank: number} => entry.rank !== null,
    )
    .sort((a, b) => a.rank - b.rank)
    .map(entry => entry.room);
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
