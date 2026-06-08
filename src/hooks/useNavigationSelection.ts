/**
 * useNavigationSelection.ts
 *
 * Owns room and graph node selection handlers used by App.tsx.
 *
 * This hook was extracted from App.tsx without changing behavior.
 */

import {Dispatch, SetStateAction} from 'react';
import {GraphNode} from '../components/Map/GraphOverlay';
import {NavigationPoint, Room} from '../components/Map/MapView';
import {
  createNavigationPointFromGraphNode,
  createNavigationPointFromRoom,
} from '../logic/createNavigationPoint';
import {PathResult} from '../components/Map/pathfinding';

type BuildingWithId = {
  id: number;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

type RoomWithId = Room & {
  id: number;
};

type UseNavigationSelectionProps = {
  buildings: BuildingWithId[];

  setSelectedRoomId: Dispatch<SetStateAction<number | null>>;
  setSelectedGraphNodeId: Dispatch<SetStateAction<number | null>>;
  setStartPoint: Dispatch<SetStateAction<NavigationPoint | null>>;
  setDestinationPoint: Dispatch<SetStateAction<NavigationPoint | null>>;
  setCurrentRoute: Dispatch<SetStateAction<PathResult | null>>;
};

export function useNavigationSelection({
  buildings,
  setSelectedRoomId,
  setSelectedGraphNodeId,
  setStartPoint,
  setDestinationPoint,
  setCurrentRoute,
}: UseNavigationSelectionProps) {
  const handleRoomSelect = (roomId: number) => {
    setSelectedRoomId(roomId);
    setSelectedGraphNodeId(null);
  };

  const handleGraphNodeSelect = (nodeId: number | null) => {
    setSelectedGraphNodeId(nodeId);
    setSelectedRoomId(null);
  };

  const clearSelection = () => {
    setSelectedRoomId(null);
    setSelectedGraphNodeId(null);
  };

  const handleSetStartPoint = (room: RoomWithId, displayLabel?: string) => {
    setStartPoint(createNavigationPointFromRoom(room, buildings, displayLabel));
  };

  const handleSetDestination = (room: RoomWithId, displayLabel?: string) => {
    setDestinationPoint(
      createNavigationPointFromRoom(room, buildings, displayLabel),
    );
  };

  const handleSetStartPointFromNode = (node: GraphNode) => {
    setStartPoint(createNavigationPointFromGraphNode(node));
  };

  const handleSetDestinationFromNode = (node: GraphNode) => {
    setDestinationPoint(createNavigationPointFromGraphNode(node));
  };

  const clearStartPoint = () => {
    setStartPoint(null);
    setCurrentRoute(null);
  };

  const clearDestination = () => {
    setDestinationPoint(null);
    setCurrentRoute(null);
  };

  const clearRoute = () => {
    setStartPoint(null);
    setDestinationPoint(null);
    setCurrentRoute(null);
  };

  return {
    handleRoomSelect,
    handleGraphNodeSelect,
    clearSelection,
    handleSetStartPoint,
    handleSetDestination,
    handleSetStartPointFromNode,
    handleSetDestinationFromNode,
    clearStartPoint,
    clearDestination,
    clearRoute,
  };
}
