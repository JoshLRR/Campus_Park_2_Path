import {beforeEach, describe, expect, it, vi} from 'vitest';
import {renderHook} from '@testing-library/react';
import {useNavigationSelection} from '../hooks/useNavigationSelection';
import {Room} from '../components/Map/MapView';
import {GraphNode} from '../components/Map/GraphOverlay';

type RoomWithId = Room & {id: number};

const buildings = [
  {id: 1, name: 'Library', x: 100, y: 200, width: 10, height: 10},
];

const room: RoomWithId = {
  id: 42,
  name: 'Reading Room',
  building: 'Library',
  buildingId: 1,
  floor: 3,
  x: 5,
  y: 7,
};

const node: GraphNode = {
  id: 9,
  kind: 'room',
  position: {x: 1, y: 2, floorNum: 2},
  neighbors: [],
  roomNumber: 'B201',
};

function setup() {
  const setSelectedRoomId = vi.fn();
  const setSelectedGraphNodeId = vi.fn();
  const setStartPoint = vi.fn();
  const setDestinationPoint = vi.fn();
  const setCurrentRoute = vi.fn();

  const {result} = renderHook(() =>
    useNavigationSelection({
      buildings,
      setSelectedRoomId,
      setSelectedGraphNodeId,
      setStartPoint,
      setDestinationPoint,
      setCurrentRoute,
    }),
  );

  return {
    api: result.current,
    setSelectedRoomId,
    setSelectedGraphNodeId,
    setStartPoint,
    setDestinationPoint,
    setCurrentRoute,
  };
}

describe('useNavigationSelection', () => {
  let ctx: ReturnType<typeof setup>;
  beforeEach(() => {
    ctx = setup();
  });

  it('handleRoomSelect selects the room and clears the node', () => {
    ctx.api.handleRoomSelect(42);
    expect(ctx.setSelectedRoomId).toHaveBeenCalledWith(42);
    expect(ctx.setSelectedGraphNodeId).toHaveBeenCalledWith(null);
  });

  it('handleGraphNodeSelect selects the node and clears the room', () => {
    ctx.api.handleGraphNodeSelect(9);
    expect(ctx.setSelectedGraphNodeId).toHaveBeenCalledWith(9);
    expect(ctx.setSelectedRoomId).toHaveBeenCalledWith(null);
  });

  it('clearSelection clears both selections', () => {
    ctx.api.clearSelection();
    expect(ctx.setSelectedRoomId).toHaveBeenCalledWith(null);
    expect(ctx.setSelectedGraphNodeId).toHaveBeenCalledWith(null);
  });

  it('handleSetStartPoint sets a nav point from the room position', () => {
    ctx.api.handleSetStartPoint(room);
    expect(ctx.setStartPoint).toHaveBeenCalledWith({
      x: 105,
      y: 207,
      label: 'Reading Room',
      roomId: 42,
      floor: 3,
    });
  });

  it('handleSetDestination sets a nav point from the room position', () => {
    ctx.api.handleSetDestination(room);
    expect(ctx.setDestinationPoint).toHaveBeenCalledWith({
      x: 105,
      y: 207,
      label: 'Reading Room',
      roomId: 42,
      floor: 3,
    });
  });

  it('handleSetStartPointFromNode sets a nav point from the node', () => {
    ctx.api.handleSetStartPointFromNode(node);
    expect(ctx.setStartPoint).toHaveBeenCalledWith({
      x: 1,
      y: 2,
      label: 'B201',
      roomId: 9,
      floor: 2,
    });
  });

  it('handleSetDestinationFromNode sets a nav point from the node', () => {
    ctx.api.handleSetDestinationFromNode(node);
    expect(ctx.setDestinationPoint).toHaveBeenCalledWith({
      x: 1,
      y: 2,
      label: 'B201',
      roomId: 9,
      floor: 2,
    });
  });

  it('clearStartPoint clears the start point and route', () => {
    ctx.api.clearStartPoint();
    expect(ctx.setStartPoint).toHaveBeenCalledWith(null);
    expect(ctx.setCurrentRoute).toHaveBeenCalledWith(null);
  });

  it('clearDestination clears the destination and route', () => {
    ctx.api.clearDestination();
    expect(ctx.setDestinationPoint).toHaveBeenCalledWith(null);
    expect(ctx.setCurrentRoute).toHaveBeenCalledWith(null);
  });

  it('clearRoute clears start, destination, and route', () => {
    ctx.api.clearRoute();
    expect(ctx.setStartPoint).toHaveBeenCalledWith(null);
    expect(ctx.setDestinationPoint).toHaveBeenCalledWith(null);
    expect(ctx.setCurrentRoute).toHaveBeenCalledWith(null);
  });
});
