/**
 * getSelectedItems.ts
 *
 * Finds the currently selected room and graph node from their selected IDs.
 *
 * This helper was extracted from App.tsx without changing behavior.
 */

import {GraphNode} from '../components/Map/GraphOverlay';
import {Room} from '../components/Map/MapView';

type RoomWithId = Room & {
  id: number;
};

export function getSelectedRoom(
  rooms: RoomWithId[],
  selectedRoomId: number | null,
): RoomWithId | null | undefined {
  return selectedRoomId ? rooms.find(room => room.id === selectedRoomId) : null;
}

export function getSelectedGraphNode(
  graphNodes: GraphNode[],
  selectedGraphNodeId: number | null,
): GraphNode | null | undefined {
  return selectedGraphNodeId
    ? graphNodes.find(node => node.id === selectedGraphNodeId)
    : null;
}
