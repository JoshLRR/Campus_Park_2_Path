import {expect, test} from 'vitest';
import {
  createNavigationPointFromRoom,
  createNavigationPointFromGraphNode,
} from '../logic/createNavigationPoint';
import {Building, Room} from '../components/Map/MapView';
import {GraphNode} from '../components/Map/GraphOverlay';

type BuildingWithId = Building & {id: number};
type RoomWithId = Room & {id: number};

const buildings: BuildingWithId[] = [
  {id: 1, name: 'Library', x: 100, y: 200, width: 10, height: 10},
];

test('builds a navigation point from a room using its resolved position', () => {
  const room: RoomWithId = {
    id: 42,
    name: 'Reading Room',
    building: 'Library',
    buildingId: 1,
    floor: 3,
    x: 5,
    y: 7,
  };

  expect(createNavigationPointFromRoom(room, buildings)).toEqual({
    x: 105,
    y: 207,
    label: 'Reading Room',
    roomId: 42,
    floor: 3,
  });
});

test('builds a navigation point from a room node, keeping its roomId', () => {
  const node: GraphNode = {
    id: 7,
    kind: 'room',
    position: {x: 12, y: 34, floorNum: 2},
    neighbors: [],
    roomNumber: 'B201',
  };

  expect(createNavigationPointFromGraphNode(node)).toEqual({
    x: 12,
    y: 34,
    label: 'B201',
    roomId: 7,
    floor: 2,
  });
});

test('builds a navigation point from a path node with a fallback label and no roomId', () => {
  const node: GraphNode = {
    id: 99,
    kind: 'path',
    position: {x: 1, y: 2, floorNum: 1},
    neighbors: [],
  };

  expect(createNavigationPointFromGraphNode(node)).toEqual({
    x: 1,
    y: 2,
    label: 'Node 99',
    roomId: undefined,
    floor: 1,
  });
});
